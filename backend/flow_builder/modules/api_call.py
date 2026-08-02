from __future__ import annotations

import json
from typing import Any

import httpx

from flow_builder.base import ConfigField, FlowContext, FlowModule, NodeResult
from flow_builder.http_utils import HttpRequestError, parse_json_object, render_template, safe_request
from flow_builder.registry import register_module


@register_module
class ApiCallModule(FlowModule):
    type_id = "api_call"
    label = "API Call"
    category = "Integrations"
    description = "Make an HTTP request and store the response in workflow data."
    color = "#0ea5e9"
    outputs = ["success", "error"]

    @classmethod
    def config_fields(cls) -> list[ConfigField]:
        return [
            ConfigField(
                key="url",
                label="URL",
                field_type="string",
                default="https://api.example.com/v1/check",
                description="Use {{field}} to inject values from workflow data.",
            ),
            ConfigField(
                key="method",
                label="Method",
                field_type="select",
                default="GET",
                options=["GET", "POST", "PUT", "PATCH", "DELETE"],
            ),
            ConfigField(
                key="headers",
                label="Headers (JSON)",
                field_type="textarea",
                default='{"Content-Type": "application/json"}',
                required=False,
                description='Optional JSON object, e.g. {"Authorization": "Bearer {{token}}"}',
            ),
            ConfigField(
                key="body",
                label="Body (JSON)",
                field_type="textarea",
                default='{"customer": "{{customer}}"}',
                required=False,
                description="Request JSON body for POST/PUT/PATCH. Supports {{field}} templates.",
            ),
            ConfigField(
                key="response_key",
                label="Response data key",
                field_type="string",
                default="api_response",
                description="Context key where parsed response body is stored.",
            ),
            ConfigField(
                key="status_key",
                label="Status code key",
                field_type="string",
                default="api_status",
                required=False,
                description="Context key where HTTP status code is stored.",
            ),
        ]

    def execute(self, ctx: FlowContext, config: dict[str, Any]) -> NodeResult:
        url = render_template(str(config.get("url") or ""), ctx.data)
        method = str(config.get("method") or "GET")
        response_key = str(config.get("response_key") or "api_response")
        status_key = str(config.get("status_key") or "api_status")

        try:
            headers_raw = render_template(str(config.get("headers") or ""), ctx.data)
            body_raw = render_template(str(config.get("body") or ""), ctx.data)
            headers = {
                str(key): render_template(str(value), ctx.data)
                for key, value in parse_json_object(headers_raw, "Headers").items()
            }
            json_body = None
            if body_raw.strip() and method.upper() in {"POST", "PUT", "PATCH"}:
                json_body = json.loads(body_raw)

            response = safe_request(url=url, method=method, headers=headers, json_body=json_body)
            ctx.data[status_key] = response.status_code

            try:
                ctx.data[response_key] = response.json()
            except json.JSONDecodeError:
                ctx.data[response_key] = response.text[:4000]

            ctx.logs.append(f"API {method} {url} → {response.status_code}")

            if 200 <= response.status_code < 300:
                return NodeResult(output_handle="success")

            ctx.data["api_error"] = f"HTTP {response.status_code}"
            return NodeResult(output_handle="error")

        except (HttpRequestError, httpx.HTTPError, json.JSONDecodeError) as exc:
            ctx.data["api_error"] = str(exc)
            ctx.logs.append(f"API call failed: {exc}")
            return NodeResult(output_handle="error")
