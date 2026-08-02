# Flow Builder — pluggable workflow modules

Add a new node type:

1. Create a class in `flow_builder/modules/` extending `FlowModule`
2. Decorate with `@register_module` and set `type_id`, `label`, `outputs`
3. Implement `execute(ctx, config) -> NodeResult`
4. Import the module in `flow_builder/modules/__init__.py`
5. Add a matching UI node in `src/flow-builder/registry/nodeRegistry.ts` (optional — generic node works)

## Built-in modules

| type_id | Label | Outputs |
|---------|-------|---------|
| start | Start | out |
| end | End | — |
| condition | Condition | yes, no |
| set_value | Set Value | out |
| log | Log | out |
| delay | Delay | out |
| api_call | API Call | success, error |
| webhook_wait | Webhook Wait | received, timeout |

## Async callbacks

For APIs that accept a callback URL and respond later:

1. Add **API Call** with `{{webhook_url}}` in the request body (enable **Async callback mode** for HTTP 202).
2. Connect **Webhook Wait** after the API Call.
3. When the flow runs, it pauses with status `waiting` and exposes the callback URL.
4. The external provider POSTs to that URL; the workflow resumes automatically.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhook/{token}` | Public callback — resumes a paused workflow (JSON body merged into context) |

## API

Base path: `/api/flow-builder`

**Headers (required on all endpoints except `/access`):**

| Header | Description |
|--------|-------------|
| `X-Chat-Password` | Same access password as Faith Discuss / URL Strength |
| `X-Flow-Builder-Email` | Owner email — configurations are scoped to this address |

| Method | Path | Description |
|--------|------|-------------|
| GET | `/modules` | List registered module definitions (palette metadata) |
| GET | `/configurations` | List saved configurations (summary) |
| POST | `/configurations` | Create configuration (auto UUID) |
| GET | `/configurations/{config_id}` | Get one configuration |
| PUT | `/configurations/{config_id}` | Update name, description, or flow graph |
| DELETE | `/configurations/{config_id}` | Delete configuration |
| POST | `/execute` | Run an ad-hoc flow graph |
| POST | `/run/{config_id}` | Trigger a saved flow by UUID |

### Run a saved flow

```bash
curl -X POST "https://api.arundas.me/api/flow-builder/run/{config_id}" \
  -H "Content-Type: application/json" \
  -H "X-Chat-Password: your-access-password" \
  -H "X-Flow-Builder-Email: you@example.com" \
  -d '{"key": "value"}'
```

### Execute ad-hoc flow

```bash
curl -X POST "https://api.arundas.me/api/flow-builder/execute" \
  -H "Content-Type: application/json" \
  -d '{"flow": {"nodes": [], "edges": []}, "input_data": {}}'
```

Interactive docs: `https://api.arundas.me/docs` (Flow Builder section).
