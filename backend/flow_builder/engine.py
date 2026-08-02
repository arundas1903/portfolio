from __future__ import annotations

from typing import Any

from flow_builder.base import FlowContext
from flow_builder.models import FlowDefinition, FlowExecuteResponse, FlowTraceStep
from flow_builder.registry import get_module


class FlowExecutionError(Exception):
    pass


def _build_adjacency(flow: FlowDefinition) -> dict[tuple[str, str], str]:
    """Map (source_node_id, source_handle) -> target_node_id."""
    adjacency: dict[tuple[str, str], str] = {}
    for edge in flow.edges:
        adjacency[(edge.source, edge.source_handle)] = edge.target
    return adjacency


def _find_start_node(flow: FlowDefinition) -> str:
    for node in flow.nodes:
        if node.type == "start":
            return node.id
    raise FlowExecutionError("Flow must contain exactly one Start node.")


def execute_flow(flow: FlowDefinition, input_data: dict[str, Any] | None = None) -> FlowExecuteResponse:
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

    try:
        current_id = _find_start_node(flow)
    except FlowExecutionError as exc:
        return FlowExecuteResponse(
            status="error",
            data=input_data or {},
            logs=[],
            trace=[],
            error=str(exc),
        )

    ctx = FlowContext(data=dict(input_data or {}))
    trace: list[FlowTraceStep] = []
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
