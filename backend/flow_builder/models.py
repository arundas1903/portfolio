from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class FlowPosition(BaseModel):
    x: float = 0
    y: float = 0


class FlowNodeModel(BaseModel):
    id: str
    type: str
    config: dict[str, Any] = Field(default_factory=dict)
    position: FlowPosition = Field(default_factory=FlowPosition)


class FlowEdgeModel(BaseModel):
    id: str
    source: str
    target: str
    source_handle: str = Field(default="out", alias="sourceHandle")
    target_handle: str = Field(default="in", alias="targetHandle")

    model_config = {"populate_by_name": True}


class FlowDefinition(BaseModel):
    nodes: list[FlowNodeModel]
    edges: list[FlowEdgeModel]


class FlowExecuteRequest(BaseModel):
    flow: FlowDefinition
    input_data: dict[str, Any] = Field(default_factory=dict)


class FlowTraceStep(BaseModel):
    node_id: str
    type: str
    output_handle: str
    config: dict[str, Any] = Field(default_factory=dict)


class FlowExecuteResponse(BaseModel):
    status: Literal["completed", "stopped", "error", "waiting"]
    data: dict[str, Any]
    logs: list[str]
    trace: list[FlowTraceStep]
    error: str | None = None
    webhook_url: str | None = None
    webhook_token: str | None = None


class ConfigFieldModel(BaseModel):
    key: str
    label: str
    field_type: str
    default: Any = None
    options: list[str] | None = None
    required: bool = True
    description: str = ""


class ModuleDefinitionModel(BaseModel):
    type_id: str
    label: str
    category: str
    description: str
    color: str
    inputs: list[str]
    outputs: list[str]
    config_fields: list[ConfigFieldModel]


class FlowConfigurationCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)
    flow: FlowDefinition


class FlowConfigurationUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    flow: FlowDefinition | None = None


class FlowConfigurationSummary(BaseModel):
    id: str
    name: str
    description: str
    owner_email: str = ""
    created_at: str
    updated_at: str


class FlowConfigurationResponse(BaseModel):
    id: str
    name: str
    description: str
    owner_email: str = ""
    flow: FlowDefinition
    created_at: str
    updated_at: str


class FlowConfigurationRunRequest(BaseModel):
    input_data: dict[str, Any] = Field(default_factory=dict)


class FlowBuilderAccessResponse(BaseModel):
    required: bool
    unlocked: bool
    email_required: bool = True


class FlowRunHistoryEntry(BaseModel):
    id: str
    config_id: str
    source: str
    status: str
    input_data: dict[str, Any] = Field(default_factory=dict)
    flow: FlowDefinition
    result: FlowExecuteResponse
    webhook_payload: dict[str, Any] | None = None
    created_at: str
    completed_at: str | None = None
