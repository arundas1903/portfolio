from fastapi import APIRouter, Depends, Header, HTTPException, Request

from app.dependencies import get_client_ip
from app.models import (
    BfsiDefaultConfigPauseRequest,
    BfsiDefaultConfigResponse,
    BfsiDefaultConfigStatusResponse,
    BfsiDefaultConfigUpsertRequest,
    BfsiNotificationLogsResponse,
    BfsiSessionStartRequest,
    BfsiSessionStartResponse,
    BfsiSessionResetRequest,
    BfsiStatusResponse,
    BfsiTemplateCreateRequest,
    BfsiTemplateListResponse,
    BfsiTemplateResponse,
    BfsiTemplateUpdateRequest,
    BfsiUsageResponse,
    BfsiUserProfile,
)
from app.services.bfsi import database as db
from app.services.bfsi.auth import reset_bindings, start_session
from app.services.bfsi.default_config import (
    delete_default_config_for_user,
    format_default_config_response,
    set_default_config_paused_for_user,
    upsert_default_config_for_user,
)
from app.services.bfsi.pricing import channel_prices_public, compute_roi_summary
from app.services.bfsi.sessions import verify_session_token
from app.services.bfsi.templates import (
    create_template_for_user,
    format_routing_summary,
    update_template_for_user,
)

router = APIRouter(prefix="/api/bfsi", tags=["bfsi"])


def get_bfsi_email(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")
    token = authorization.split(" ", 1)[1].strip()
    email = verify_session_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    return email


def _to_template_response(template: dict) -> BfsiTemplateResponse:
    return BfsiTemplateResponse(
        id=template["id"],
        name=template["name"],
        content=template["content"],
        amount_threshold=template["amount_threshold"],
        channel_if_above=template["channel_if_above"],
        channel_if_below=template["channel_if_below"],
        routing_summary=format_routing_summary(template),
        created_at=template["created_at"],
        updated_at=template["updated_at"],
    )


@router.post("/session/start", response_model=BfsiSessionStartResponse)
async def bfsi_session_start(body: BfsiSessionStartRequest, request: Request) -> BfsiSessionStartResponse:
    token, user, error = start_session(
        body.email,
        ip=get_client_ip(request),
        client_id=body.client_id.strip(),
    )
    if error or not token or not user:
        raise HTTPException(status_code=403, detail=error or "Could not start session")

    return BfsiSessionStartResponse(
        token=token,
        user=BfsiUserProfile(**user),
    )


@router.post("/session/reset-bindings", status_code=204)
async def bfsi_session_reset_bindings(body: BfsiSessionResetRequest, request: Request) -> None:
    reset_bindings(ip=get_client_ip(request), client_id=body.client_id.strip())


@router.get("/me", response_model=BfsiStatusResponse)
async def bfsi_me(email: str = Depends(get_bfsi_email)) -> BfsiStatusResponse:
    user = db.get_user(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return BfsiStatusResponse(user=BfsiUserProfile(email=user["email"]))


@router.get("/templates", response_model=BfsiTemplateListResponse)
async def bfsi_list_templates(email: str = Depends(get_bfsi_email)) -> BfsiTemplateListResponse:
    templates = db.list_templates(email)
    return BfsiTemplateListResponse(templates=[_to_template_response(item) for item in templates])


@router.post("/templates", response_model=BfsiTemplateResponse)
async def bfsi_create_template(
    body: BfsiTemplateCreateRequest,
    email: str = Depends(get_bfsi_email),
) -> BfsiTemplateResponse:
    template, error = create_template_for_user(
        email,
        name=body.name,
        content=body.content,
        amount_threshold=body.amount_threshold,
        channel_if_above=body.channel_if_above,
        channel_if_below=body.channel_if_below,
    )
    if error or not template:
        raise HTTPException(status_code=400, detail=error or "Could not create template")
    return _to_template_response(template)


@router.put("/templates/{template_id}", response_model=BfsiTemplateResponse)
async def bfsi_update_template(
    template_id: str,
    body: BfsiTemplateUpdateRequest,
    email: str = Depends(get_bfsi_email),
) -> BfsiTemplateResponse:
    template, error = update_template_for_user(
        email,
        template_id,
        name=body.name,
        content=body.content,
        amount_threshold=body.amount_threshold,
        channel_if_above=body.channel_if_above,
        channel_if_below=body.channel_if_below,
    )
    if error:
        status = 404 if error == "Template not found." else 400
        raise HTTPException(status_code=status, detail=error)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found.")
    return _to_template_response(template)


@router.get("/default-config", response_model=BfsiDefaultConfigStatusResponse)
async def bfsi_get_default_config(email: str = Depends(get_bfsi_email)) -> BfsiDefaultConfigStatusResponse:
    config = db.get_default_config(email)
    if not config:
        return BfsiDefaultConfigStatusResponse(config=None)
    formatted = format_default_config_response(config)
    return BfsiDefaultConfigStatusResponse(config=BfsiDefaultConfigResponse(**formatted))


@router.put("/default-config", response_model=BfsiDefaultConfigResponse)
async def bfsi_upsert_default_config(
    body: BfsiDefaultConfigUpsertRequest,
    email: str = Depends(get_bfsi_email),
) -> BfsiDefaultConfigResponse:
    config, error = upsert_default_config_for_user(
        email,
        amount_threshold=body.amount_threshold,
        channel_if_above=body.channel_if_above,
        channel_if_below=body.channel_if_below,
    )
    if error or not config:
        raise HTTPException(status_code=400, detail=error or "Could not save default configuration")
    formatted = format_default_config_response(config)
    return BfsiDefaultConfigResponse(**formatted)


@router.patch("/default-config/pause", response_model=BfsiDefaultConfigResponse)
async def bfsi_pause_default_config(
    body: BfsiDefaultConfigPauseRequest,
    email: str = Depends(get_bfsi_email),
) -> BfsiDefaultConfigResponse:
    config, error = set_default_config_paused_for_user(email, paused=body.paused)
    if error or not config:
        raise HTTPException(status_code=404, detail=error or "Default configuration not found")
    formatted = format_default_config_response(config)
    return BfsiDefaultConfigResponse(**formatted)


@router.delete("/default-config", status_code=204)
async def bfsi_delete_default_config(email: str = Depends(get_bfsi_email)) -> None:
    _, error = delete_default_config_for_user(email)
    if error:
        raise HTTPException(status_code=404, detail=error)


@router.get("/usage", response_model=BfsiUsageResponse)
async def bfsi_usage(email: str = Depends(get_bfsi_email)) -> BfsiUsageResponse:
    summary = db.get_usage_summary(email)
    roi = compute_roi_summary(
        send_count=summary["send_count"],
        total_usage_paise=summary["total_usage_paise"],
        channel_counts=summary["channel_counts"],
    )
    return BfsiUsageResponse(
        total_usage_paise=summary["total_usage_paise"],
        total_ai_tokens=summary["total_ai_tokens"],
        send_count=summary["send_count"],
        channel_prices=channel_prices_public(),
        channel_counts=summary["channel_counts"],
        baseline_cost_paise=int(roi["baseline_cost_paise"]),
        savings_paise=int(roi["savings_paise"]),
        savings_percent=float(roi["savings_percent"]),
    )


@router.get("/logs", response_model=BfsiNotificationLogsResponse)
async def bfsi_list_logs(
    email: str = Depends(get_bfsi_email),
    page: int = 1,
    page_size: int = 10,
) -> BfsiNotificationLogsResponse:
    items, total = db.list_notifications(email, page=page, page_size=page_size)
    usage = db.get_usage_summary(email)
    total_pages = 0 if total == 0 else (total + page_size - 1) // page_size
    return BfsiNotificationLogsResponse(
        items=items,
        total=total,
        page=max(1, page),
        page_size=max(1, min(page_size, 50)),
        total_pages=total_pages,
        total_usage_paise=usage["total_usage_paise"],
    )
