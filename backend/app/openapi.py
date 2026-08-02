from __future__ import annotations

from fastapi import Header
from fastapi.openapi.utils import get_openapi

BFSI_OWNER_EMAIL_HEADER = "X-BFSI-Owner-Email"
PUBLIC_OPENAPI_TAGS = frozenset({"bfsi", "bfsi-v1", "bfsi-v2", "payment", "flow-builder"})

OPENAPI_TAGS = [
    {
        "name": "bfsi",
        "description": (
            "BFSI dashboard API for the web UI. Authenticate with `Authorization: Bearer <token>` "
            "from `POST /api/bfsi/session/start`."
        ),
    },
    {
        "name": "bfsi-v1",
        "description": (
            "Public notification send API (v1). Requires `X-BFSI-Owner-Email` and routes by "
            "template ID + transaction amount."
        ),
    },
    {
        "name": "bfsi-v2",
        "description": (
            "Public notification send API (v2). Requires `X-BFSI-Owner-Email`. AI classifies "
            "`message_body` and applies default configuration routing for transaction messages."
        ),
    },
    {
        "name": "payment",
        "description": (
            "Payment POC network intelligence API. Requires `X-BFSI-Owner-Email`. "
            "SIM swap checks cost 5 paise and are logged under the network channel."
        ),
    },
    {
        "name": "flow-builder",
        "description": (
            "Visual workflow builder API. Authenticate with `X-Chat-Password` (same as chat) and "
            "`X-Flow-Builder-Email`. Configurations are scoped to the owner email. Trigger saved "
            "flows via `POST /api/flow-builder/run/{config_id}` with both headers."
        ),
    },
]


def get_bfsi_owner_email(
    x_bfsi_owner_email: str = Header(
        ...,
        alias=BFSI_OWNER_EMAIL_HEADER,
        min_length=5,
        max_length=254,
        description="Account email that owns templates and default configuration.",
        examples=["owner@example.com"],
    ),
) -> str:
    return x_bfsi_owner_email.strip()


def _collect_schema_refs(value: object, refs: set[str]) -> None:
    if isinstance(value, dict):
        ref = value.get("$ref")
        if isinstance(ref, str) and ref.startswith("#/components/schemas/"):
            refs.add(ref.rsplit("/", 1)[-1])
        for nested in value.values():
            _collect_schema_refs(nested, refs)
    elif isinstance(value, list):
        for item in value:
            _collect_schema_refs(item, refs)


def _collect_component_refs(value: object, section: str, refs: set[str]) -> None:
    prefix = f"#/components/{section}/"
    if isinstance(value, dict):
        ref = value.get("$ref")
        if isinstance(ref, str) and ref.startswith(prefix):
            refs.add(ref.rsplit("/", 1)[-1])
        for nested in value.values():
            _collect_component_refs(nested, section, refs)
    elif isinstance(value, list):
        for item in value:
            _collect_component_refs(item, section, refs)


def _filter_bfsi_paths(schema: dict) -> dict:
    http_methods = {"get", "post", "put", "patch", "delete", "options", "head", "trace"}
    filtered_paths: dict = {}

    for path, path_item in schema.get("paths", {}).items():
        kept_operations = {
            method: operation
            for method, operation in path_item.items()
            if method in http_methods
            and any(tag in PUBLIC_OPENAPI_TAGS for tag in operation.get("tags", []))
        }
        if kept_operations:
            filtered_paths[path] = kept_operations

    schema["paths"] = filtered_paths
    if "tags" in schema:
        schema["tags"] = [tag for tag in schema["tags"] if tag.get("name") in PUBLIC_OPENAPI_TAGS]
    return schema


def _filter_bfsi_components(schema: dict) -> dict:
    components = schema.setdefault("components", {})
    paths = schema.get("paths", {})
    all_schemas: dict = components.get("schemas", {})

    used_schemas: set[str] = set()
    _collect_schema_refs(paths, used_schemas)

    expanded = True
    while expanded:
        expanded = False
        for name in list(used_schemas):
            if name not in all_schemas:
                continue
            before = len(used_schemas)
            _collect_schema_refs(all_schemas[name], used_schemas)
            if len(used_schemas) > before:
                expanded = True

    if all_schemas:
        components["schemas"] = {
            name: all_schemas[name] for name in sorted(used_schemas) if name in all_schemas
        }

    for section in ("parameters", "responses", "requestBodies", "headers", "examples", "links", "callbacks"):
        items = components.get(section)
        if not isinstance(items, dict):
            continue
        used_items: set[str] = set()
        _collect_component_refs(paths, section, used_items)
        if used_items:
            components[section] = {name: items[name] for name in sorted(used_items) if name in items}
        else:
            components.pop(section, None)

    return schema


def configure_openapi(app) -> None:
    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema

        schema = get_openapi(
            title="Portfolio Public API",
            version=app.version,
            description=(
                "Public APIs for the arundas.me portfolio demos.\n\n"
                "**BFSI** — Intelligent notification router (SMS, email, push) with template-based "
                "routing (v1) and AI-driven routing (v2).\n\n"
                "**Payment** — Network intelligence checks (SIM swap status and location) for the "
                "UPI Pay POC. Responses are mocked for demo purposes.\n\n"
                "**Flow Builder** — Pluggable workflow editor. Save configurations by UUID and "
                "trigger runs over HTTP.\n\n"
                "**Swagger UI:** `/docs`\n"
                "**OpenAPI JSON:** `/openapi.json`"
            ),
            routes=app.routes,
            tags=OPENAPI_TAGS,
        )
        schema = _filter_bfsi_paths(schema)
        schema = _filter_bfsi_components(schema)
        components = schema.setdefault("components", {})
        components["securitySchemes"] = {
            "BfsiSession": {
                "type": "http",
                "scheme": "bearer",
                "description": "Session token from POST /api/bfsi/session/start",
            },
            "BfsiOwnerEmail": {
                "type": "apiKey",
                "in": "header",
                "name": BFSI_OWNER_EMAIL_HEADER,
                "description": "Account email that owns templates and default configuration.",
            },
        }
        app.openapi_schema = schema
        return app.openapi_schema

    app.openapi = custom_openapi
