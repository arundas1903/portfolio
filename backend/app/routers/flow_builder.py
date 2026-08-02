from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Request, Response

from app.config import settings
from app.dependencies import (
    FLOW_BUILDER_EMAIL_HEADER,
    flow_builder_access_valid,
    require_flow_builder_owner,
)
from flow_builder import database as flow_db
from flow_builder.engine import execute_flow, poll_webhook_wait, resume_flow_from_webhook
from flow_builder.models import (
    ConfigFieldModel,
    FlowBuilderAccessResponse,
    FlowConfigurationCreateRequest,
    FlowConfigurationResponse,
    FlowConfigurationRunRequest,
    FlowConfigurationSummary,
    FlowConfigurationUpdateRequest,
    FlowDefinition,
    FlowExecuteRequest,
    FlowExecuteResponse,
    FlowRunHistoryEntry,
    ModuleDefinitionModel,
)
from flow_builder.registry import discover_modules, list_modules

discover_modules()

router = APIRouter(prefix="/api/flow-builder", tags=["flow-builder"])


def _public_base_url(request: Request) -> str:
    forwarded_proto = request.headers.get("X-Forwarded-Proto")
    forwarded_host = request.headers.get("X-Forwarded-Host")
    if forwarded_proto and forwarded_host:
        return f"{forwarded_proto}://{forwarded_host}".rstrip("/")
    return str(request.base_url).rstrip("/")


def _to_configuration_response(record: dict) -> FlowConfigurationResponse:
    return FlowConfigurationResponse(
        id=record["id"],
        name=record["name"],
        description=record["description"],
        owner_email=record.get("owner_email", ""),
        flow=FlowDefinition.model_validate(record["flow"]),
        created_at=record["created_at"],
        updated_at=record["updated_at"],
    )


def _get_owned_configuration(config_id: str, owner_email: str) -> dict:
    record = flow_db.get_configuration_for_owner(config_id, owner_email)
    if not record:
        raise HTTPException(status_code=404, detail="Configuration not found.")
    return record


def _to_run_history_entry(record: dict) -> FlowRunHistoryEntry:
    return FlowRunHistoryEntry(
        id=record["id"],
        config_id=record["config_id"],
        source=record["source"],
        status=record["status"],
        input_data=record["input_data"],
        flow=FlowDefinition.model_validate(record["flow"]),
        result=FlowExecuteResponse.model_validate(record["result"]),
        webhook_payload=record.get("webhook_payload"),
        created_at=record["created_at"],
        completed_at=record.get("completed_at"),
    )


@router.get("/access", response_model=FlowBuilderAccessResponse)
async def flow_builder_access(
    x_chat_password: Annotated[str | None, Header(alias="X-Chat-Password")] = None,
    x_flow_builder_email: Annotated[str | None, Header(alias=FLOW_BUILDER_EMAIL_HEADER)] = None,
) -> FlowBuilderAccessResponse:
    return FlowBuilderAccessResponse(
        required=settings.chat_password_required,
        unlocked=flow_builder_access_valid(x_chat_password, x_flow_builder_email),
    )


@router.get("/modules", response_model=list[ModuleDefinitionModel])
async def get_modules(
    _: Annotated[str, Depends(require_flow_builder_owner)],
) -> list[ModuleDefinitionModel]:
    """List all registered flow module definitions for the editor palette."""
    return [
        ModuleDefinitionModel(
            type_id=definition.type_id,
            label=definition.label,
            category=definition.category,
            description=definition.description,
            color=definition.color,
            inputs=definition.inputs,
            outputs=definition.outputs,
            config_fields=[
                ConfigFieldModel(
                    key=field.key,
                    label=field.label,
                    field_type=field.field_type,
                    default=field.default,
                    options=field.options,
                    required=field.required,
                    description=field.description,
                )
                for field in definition.config_fields
            ],
        )
        for definition in list_modules()
    ]


@router.get("/configurations", response_model=list[FlowConfigurationSummary])
async def list_configurations(
    owner_email: Annotated[str, Depends(require_flow_builder_owner)],
) -> list[FlowConfigurationSummary]:
    return [
        FlowConfigurationSummary.model_validate(item)
        for item in flow_db.list_configurations(owner_email)
    ]


@router.post("/configurations", response_model=FlowConfigurationResponse, status_code=201)
async def create_configuration(
    body: FlowConfigurationCreateRequest,
    owner_email: Annotated[str, Depends(require_flow_builder_owner)],
) -> FlowConfigurationResponse:
    record = flow_db.create_configuration(
        name=body.name,
        description=body.description,
        flow=body.flow.model_dump(by_alias=True),
        owner_email=owner_email,
    )
    return _to_configuration_response(record)


@router.get("/configurations/{config_id}", response_model=FlowConfigurationResponse)
async def get_configuration(
    config_id: str,
    owner_email: Annotated[str, Depends(require_flow_builder_owner)],
) -> FlowConfigurationResponse:
    record = _get_owned_configuration(config_id, owner_email)
    return _to_configuration_response(record)


@router.put("/configurations/{config_id}", response_model=FlowConfigurationResponse)
async def update_configuration(
    config_id: str,
    body: FlowConfigurationUpdateRequest,
    owner_email: Annotated[str, Depends(require_flow_builder_owner)],
) -> FlowConfigurationResponse:
    _get_owned_configuration(config_id, owner_email)
    record = flow_db.update_configuration(
        config_id,
        name=body.name,
        description=body.description,
        flow=body.flow.model_dump(by_alias=True) if body.flow else None,
    )
    if not record:
        raise HTTPException(status_code=404, detail="Configuration not found.")
    return _to_configuration_response(record)


@router.get("/configurations/{config_id}/history", response_model=list[FlowRunHistoryEntry])
async def list_configuration_history(
    config_id: str,
    owner_email: Annotated[str, Depends(require_flow_builder_owner)],
) -> list[FlowRunHistoryEntry]:
    _get_owned_configuration(config_id, owner_email)
    return [
        _to_run_history_entry(item)
        for item in flow_db.list_run_history(config_id, owner_email)
    ]


@router.delete("/configurations/{config_id}", status_code=204, response_class=Response)
async def delete_configuration(
    config_id: str,
    owner_email: Annotated[str, Depends(require_flow_builder_owner)],
) -> Response:
    _get_owned_configuration(config_id, owner_email)
    if not flow_db.delete_configuration(config_id):
        raise HTTPException(status_code=404, detail="Configuration not found.")
    return Response(status_code=204)


@router.post("/execute", response_model=FlowExecuteResponse)
async def run_flow(
    request: FlowExecuteRequest,
    http_request: Request,
    owner_email: Annotated[str, Depends(require_flow_builder_owner)],
) -> FlowExecuteResponse:
    return execute_flow(
        request.flow,
        request.input_data,
        public_base_url=_public_base_url(http_request),
        owner_email=owner_email,
    )


@router.post("/configurations/{config_id}/run", response_model=FlowExecuteResponse)
async def run_saved_configuration(
    config_id: str,
    body: FlowConfigurationRunRequest,
    http_request: Request,
    owner_email: Annotated[str, Depends(require_flow_builder_owner)],
) -> FlowExecuteResponse:
    record = _get_owned_configuration(config_id, owner_email)
    flow = FlowDefinition.model_validate(record["flow"])
    return execute_flow(
        flow,
        body.input_data,
        public_base_url=_public_base_url(http_request),
        owner_email=owner_email,
    )


@router.post("/run/{config_id}", response_model=FlowExecuteResponse)
async def run_configuration_by_id(
    config_id: str,
    http_request: Request,
    owner_email: Annotated[str, Depends(require_flow_builder_owner)],
    body: dict[str, Any] = Body(
        default_factory=dict,
        description="Flow input fields sent at the top level (e.g. `{\"name\": \"Ada\", \"count\": 1}`).",
        examples=[{"name": "Ada", "count": 1}],
    ),
) -> FlowExecuteResponse:
    """Public trigger endpoint — runs a saved flow by configuration UUID."""
    record = _get_owned_configuration(config_id, owner_email)
    flow = FlowDefinition.model_validate(record["flow"])
    result = execute_flow(
        flow,
        body,
        public_base_url=_public_base_url(http_request),
        owner_email=owner_email,
        config_id=config_id,
    )
    history = flow_db.create_run_history(
        config_id=config_id,
        owner_email=owner_email,
        source="public_api",
        input_data=body,
        flow=flow.model_dump(by_alias=True),
        result=result.model_dump(),
    )
    if result.status == "waiting" and result.webhook_token:
        flow_db.link_webhook_wait_to_run(result.webhook_token, history["id"])
    return result


@router.get("/webhook/{token}/status", response_model=FlowExecuteResponse)
async def poll_webhook_wait_status(
    token: str,
    http_request: Request,
    owner_email: Annotated[str, Depends(require_flow_builder_owner)],
) -> FlowExecuteResponse:
    """Poll a paused workflow; resumes the timeout branch when the wait expires."""
    wait = flow_db.get_webhook_wait(token)
    if not wait or wait.get("owner_email") != owner_email:
        raise HTTPException(status_code=404, detail="Webhook wait not found.")
    result = poll_webhook_wait(token, public_base_url=_public_base_url(http_request))
    return result


@router.post("/webhook/{token}", response_model=FlowExecuteResponse)
async def receive_webhook_callback(
    token: str,
    http_request: Request,
    body: dict[str, Any] = Body(default_factory=dict),
) -> FlowExecuteResponse:
    """Public callback endpoint for async integrations. Resumes a paused workflow."""
    wait = flow_db.get_webhook_wait(token)
    result = resume_flow_from_webhook(
        token,
        body,
        public_base_url=_public_base_url(http_request),
    )
    if wait and wait.get("run_history_id"):
        flow_db.update_run_history(
            wait["run_history_id"],
            result=result.model_dump(),
            webhook_payload=body,
        )
    return result
