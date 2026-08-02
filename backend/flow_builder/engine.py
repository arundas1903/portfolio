from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from flow_builder import database as flow_db
from flow_builder.base import FlowContext
from flow_builder.models import FlowDefinition, FlowExecuteResponse, FlowTraceStep
from flow_builder.registry import get_module


class FlowExecutionError(Exception):
    pass


def _build_adjacency(flow: FlowDefinition) -> dict[tuple[str, str], str]:
    adjacency: dict[tuple[str, str], str] = {}
    for edge in flow.edges:
        adjacency[(edge.source, edge.source_handle)] = edge.target
    return adjacency


def _find_start_node(flow: FlowDefinition) -> str:
    for node in flow.nodes:
        if node.type == "start":
            return node.id
    raise FlowExecutionError("Flow must contain exactly one Start node.")


def _flow_has_webhook_wait(flow: FlowDefinition) -> bool:
    return any(node.type == "webhook_wait" for node in flow.nodes)


def _prepare_webhook_context(
    ctx: FlowContext,
    flow: FlowDefinition,
    public_base_url: str,
) -> str | None:
    if not _flow_has_webhook_wait(flow):
        return None

    token = str(uuid4())
    base = public_base_url.rstrip("/")
    ctx.data["webhook_token"] = token
    ctx.data["webhook_url"] = f"{base}/api/flow-builder/webhook/{token}"
    return token


def _trace_to_dict(trace: list[FlowTraceStep]) -> list[dict[str, Any]]:
    return [step.model_dump() for step in trace]


def _trace_from_dict(items: list[dict[str, Any]]) -> list[FlowTraceStep]:
    return [FlowTraceStep.model_validate(item) for item in items]


def _is_webhook_expired(wait: dict[str, Any]) -> bool:
    expires_at = datetime.fromisoformat(wait["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) > expires_at


def _append_webhook_timeout_trace(
    wait: dict[str, Any],
    trace: list[FlowTraceStep],
) -> list[FlowTraceStep]:
    webhook_node_id = wait.get("webhook_node_id") or ""
    if not webhook_node_id:
        return trace

    flow = FlowDefinition.model_validate(wait["flow"])
    node = next((item for item in flow.nodes if item.id == webhook_node_id), None)
    config = node.config if node else {}
    updated = list(trace)
    timeout_step = FlowTraceStep(
        node_id=webhook_node_id,
        type="webhook_wait",
        output_handle="timeout",
        config=config,
    )
    if (
        updated
        and updated[-1].node_id == webhook_node_id
        and updated[-1].output_handle == "received"
    ):
        updated[-1] = timeout_step
    else:
        updated.append(timeout_step)
    return updated


def _timeout_response(
    wait: dict[str, Any],
    *,
    error: str | None = None,
) -> FlowExecuteResponse:
    trace = _append_webhook_timeout_trace(wait, _trace_from_dict(wait["trace"]))
    return FlowExecuteResponse(
        status="error" if error else "stopped",
        data=wait["context"],
        logs=["Webhook wait timed out."],
        trace=trace,
        error=error,
    )


def execute_flow(
    flow: FlowDefinition,
    input_data: dict[str, Any] | None = None,
    *,
    public_base_url: str = "http://localhost:8000",
    owner_email: str = "",
    config_id: str = "",
    start_node_id: str | None = None,
    initial_ctx: FlowContext | None = None,
    initial_trace: list[FlowTraceStep] | None = None,
) -> FlowExecuteResponse:
    if not flow.nodes:
        return FlowExecuteResponse(
            status="error",
            data={},
            logs=[],
            trace=[],
            error="Flow has no nodes.",
        )

    nodes_by_id = {node.id: node for node in flow.nodes}
    adjacency = _build_adjacency(flow)

    ctx = initial_ctx or FlowContext(data=dict(input_data or {}))
    trace = list(initial_trace or [])
    webhook_token = ctx.data.get("webhook_token")
    if webhook_token is None:
        webhook_token = _prepare_webhook_context(ctx, flow, public_base_url)

    try:
        current_id = start_node_id or _find_start_node(flow)
    except FlowExecutionError as exc:
        return FlowExecuteResponse(
            status="error",
            data=ctx.data,
            logs=ctx.logs,
            trace=trace,
            error=str(exc),
        )

    visited_guard = 0
    max_steps = 100

    while current_id and visited_guard < max_steps:
        visited_guard += 1
        node = nodes_by_id.get(current_id)
        if not node:
            return FlowExecuteResponse(
                status="error",
                data=ctx.data,
                logs=ctx.logs,
                trace=trace,
                error=f"Node not found: {current_id}",
            )

        try:
            module_cls = get_module(node.type)
            module = module_cls()
            result = module.execute(ctx, node.config)
        except KeyError:
            return FlowExecuteResponse(
                status="error",
                data=ctx.data,
                logs=ctx.logs,
                trace=trace,
                error=f"Unknown module type: {node.type}",
            )
        except Exception as exc:
            return FlowExecuteResponse(
                status="error",
                data=ctx.data,
                logs=ctx.logs,
                trace=trace,
                error=f"Error in node {node.id} ({node.type}): {exc}",
            )

        trace.append(
            FlowTraceStep(
                node_id=node.id,
                type=node.type,
                output_handle=result.output_handle,
                config=node.config,
            )
        )

        if result.wait_for_webhook:
            received_key = (node.id, "received")
            timeout_key = (node.id, "timeout")
            resume_node_id = adjacency.get(received_key)
            timeout_node_id = adjacency.get(timeout_key) or ""
            if not resume_node_id:
                return FlowExecuteResponse(
                    status="error",
                    data=ctx.data,
                    logs=ctx.logs,
                    trace=trace,
                    error=f"No edge from {node.id}:received",
                )

            token = str(ctx.data.get("webhook_token") or webhook_token or "")
            timeout_minutes = int(ctx.data.get("webhook_timeout_minutes") or 60)
            flow_db.create_webhook_wait(
                token=token,
                owner_email=owner_email,
                flow=flow.model_dump(by_alias=True),
                resume_node_id=resume_node_id,
                timeout_node_id=timeout_node_id,
                webhook_node_id=node.id,
                context=ctx.data,
                trace=_trace_to_dict(trace),
                response_key=result.webhook_response_key,
                timeout_minutes=timeout_minutes,
                config_id=config_id,
                public_base_url=public_base_url,
            )

            return FlowExecuteResponse(
                status="waiting",
                data=ctx.data,
                logs=ctx.logs,
                trace=trace,
                webhook_url=str(ctx.data.get("webhook_url") or ""),
                webhook_token=token,
            )

        if result.stop or node.type == "end":
            return FlowExecuteResponse(
                status="completed" if node.type == "end" else "stopped",
                data=ctx.data,
                logs=ctx.logs,
                trace=trace,
            )

        next_key = (node.id, result.output_handle)
        current_id = adjacency.get(next_key)
        if not current_id:
            return FlowExecuteResponse(
                status="stopped",
                data=ctx.data,
                logs=ctx.logs,
                trace=trace,
                error=f"No edge from {node.id}:{result.output_handle}",
            )

    return FlowExecuteResponse(
        status="error",
        data=ctx.data,
        logs=ctx.logs,
        trace=trace,
        error="Flow exceeded maximum step count (possible loop).",
    )


def resume_flow_from_webhook(
    token: str,
    payload: dict[str, Any],
    *,
    public_base_url: str,
) -> FlowExecuteResponse:
    wait = flow_db.get_webhook_wait(token)
    if not wait:
        return FlowExecuteResponse(
            status="error",
            data={},
            logs=[],
            trace=[],
            error="Webhook wait not found.",
        )

    if wait["status"] != "pending":
        return FlowExecuteResponse(
            status="error",
            data=wait["context"],
            logs=[],
            trace=_trace_from_dict(wait["trace"]),
            error=f"Webhook wait already {wait['status']}.",
        )

    if _is_webhook_expired(wait):
        timeout_result = resume_flow_from_timeout(token, public_base_url=public_base_url)
        if timeout_result:
            return FlowExecuteResponse(
                status="error",
                data=wait["context"],
                logs=["Webhook callback arrived after the wait expired."],
                trace=timeout_result.trace,
                error="Webhook wait expired.",
            )
        return FlowExecuteResponse(
            status="error",
            data=wait["context"],
            logs=[],
            trace=_trace_from_dict(wait["trace"]),
            error="Webhook wait expired.",
        )

    if not flow_db.complete_webhook_wait(token):
        return FlowExecuteResponse(
            status="error",
            data=wait["context"],
            logs=[],
            trace=_trace_from_dict(wait["trace"]),
            error="Webhook wait already completed.",
        )

    ctx = FlowContext(data=dict(wait["context"]))
    ctx.data[wait["response_key"]] = payload
    ctx.logs.append("Webhook callback received.")

    flow = FlowDefinition.model_validate(wait["flow"])
    return execute_flow(
        flow,
        initial_ctx=ctx,
        initial_trace=_trace_from_dict(wait["trace"]),
        start_node_id=wait["resume_node_id"],
        public_base_url=public_base_url,
        owner_email=wait["owner_email"],
        config_id=wait.get("config_id") or "",
    )


def resume_flow_from_timeout(
    token: str,
    *,
    public_base_url: str = "http://localhost:8000",
) -> FlowExecuteResponse | None:
    wait = flow_db.get_webhook_wait(token)
    if not wait or wait["status"] != "pending" or not _is_webhook_expired(wait):
        return None

    if not flow_db.expire_webhook_wait(token):
        return None

    timeout_node_id = wait.get("timeout_node_id") or ""
    if not timeout_node_id:
        return _timeout_response(
            wait,
            error="Webhook wait timed out with no timeout branch connected.",
        )

    ctx = FlowContext(data=dict(wait["context"]))
    ctx.logs.append("Webhook wait timed out.")
    trace = _append_webhook_timeout_trace(wait, _trace_from_dict(wait["trace"]))
    flow = FlowDefinition.model_validate(wait["flow"])
    base_url = wait.get("public_base_url") or public_base_url
    return execute_flow(
        flow,
        initial_ctx=ctx,
        initial_trace=trace,
        start_node_id=timeout_node_id,
        public_base_url=base_url,
        owner_email=wait["owner_email"],
        config_id=wait.get("config_id") or "",
    )


def poll_webhook_wait(
    token: str,
    *,
    public_base_url: str = "http://localhost:8000",
) -> FlowExecuteResponse:
    wait = flow_db.get_webhook_wait(token)
    if not wait:
        return FlowExecuteResponse(
            status="error",
            data={},
            logs=[],
            trace=[],
            error="Webhook wait not found.",
        )

    if wait["status"] == "pending":
        if _is_webhook_expired(wait):
            timeout_result = resume_flow_from_timeout(token, public_base_url=public_base_url)
            if timeout_result:
                run_history_id = wait.get("run_history_id")
                if run_history_id:
                    flow_db.update_run_history(run_history_id, result=timeout_result.model_dump())
                return timeout_result
        base_url = (wait.get("public_base_url") or public_base_url).rstrip("/")
        return FlowExecuteResponse(
            status="waiting",
            data=wait["context"],
            logs=[],
            trace=_trace_from_dict(wait["trace"]),
            webhook_url=f"{base_url}/api/flow-builder/webhook/{token}",
            webhook_token=token,
        )

    return FlowExecuteResponse(
        status="error",
        data=wait["context"],
        logs=[],
        trace=_trace_from_dict(wait["trace"]),
        error=f"Webhook wait already {wait['status']}.",
    )


def process_expired_webhook_waits(
    *,
    public_base_url: str = "http://localhost:8000",
) -> list[FlowExecuteResponse]:
    results: list[FlowExecuteResponse] = []
    for wait in flow_db.list_expired_pending_waits():
        base_url = wait.get("public_base_url") or public_base_url
        result = resume_flow_from_timeout(wait["token"], public_base_url=base_url)
        if not result:
            continue
        run_history_id = wait.get("run_history_id")
        if run_history_id:
            flow_db.update_run_history(run_history_id, result=result.model_dump())
        results.append(result)
    return results
