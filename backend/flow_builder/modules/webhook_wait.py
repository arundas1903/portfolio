from __future__ import annotations

from typing import Any

from flow_builder.base import ConfigField, FlowContext, FlowModule, NodeResult
from flow_builder.registry import register_module


@register_module
class WebhookWaitModule(FlowModule):
    type_id = "webhook_wait"
    label = "Webhook Wait"
    category = "Integrations"
    description = (
        "Pause the workflow until an HTTP POST arrives at the callback URL. "
        "Use {{webhook_url}} in a preceding API Call body for async providers."
    )
    color = "#f97316"
    outputs = ["received", "timeout"]

    @classmethod
    def config_fields(cls) -> list[ConfigField]:
        return [
            ConfigField(
                key="response_key",
                label="Callback payload key",
                field_type="string",
                default="webhook_payload",
                description="Context key where the incoming webhook JSON body is stored.",
            ),
            ConfigField(
                key="timeout_minutes",
                label="Timeout (minutes)",
                field_type="number",
                default=60,
                description="How long to keep the wait open before it expires.",
            ),
        ]

    def execute(self, ctx: FlowContext, config: dict[str, Any]) -> NodeResult:
        webhook_url = ctx.data.get("webhook_url")
        if not webhook_url:
            ctx.logs.append("Webhook Wait failed: webhook_url was not initialized for this run.")
            return NodeResult(output_handle="timeout")

        response_key = str(config.get("response_key") or "webhook_payload")
        timeout_minutes = int(config.get("timeout_minutes") or 60)
        ctx.data["webhook_timeout_minutes"] = timeout_minutes
        ctx.logs.append(f"Waiting for webhook callback at {webhook_url}")

        return NodeResult(
            output_handle="received",
            wait_for_webhook=True,
            webhook_response_key=response_key,
        )
