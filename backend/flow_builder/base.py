from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, ClassVar


@dataclass
class FlowContext:
    """Mutable runtime state passed between nodes."""

    data: dict[str, Any] = field(default_factory=dict)
    logs: list[str] = field(default_factory=list)
    trace: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class NodeResult:
    """Output of a single node execution."""

    output_handle: str = "out"
    stop: bool = False


@dataclass
class ConfigField:
    key: str
    label: str
    field_type: str = "string"  # string | number | boolean | select
    default: Any = None
    options: list[str] | None = None
    required: bool = True
    description: str = ""


@dataclass
class NodeDefinition:
    type_id: str
    label: str
    category: str
    description: str
    color: str
    inputs: list[str]
    outputs: list[str]
    config_fields: list[ConfigField]


class FlowModule(ABC):
    """Base class for pluggable workflow nodes.

    To add a new module:
    1. Create a class in flow_builder/modules/ that subclasses FlowModule
    2. Set type_id, label, category, and handle lists
    3. Implement execute()
    4. Import it in flow_builder/modules/__init__.py
    """

    type_id: ClassVar[str]
    label: ClassVar[str]
    category: ClassVar[str] = "General"
    description: ClassVar[str] = ""
    color: ClassVar[str] = "#6366f1"
    inputs: ClassVar[list[str]] = ["in"]
    outputs: ClassVar[list[str]] = ["out"]

    @classmethod
    def config_fields(cls) -> list[ConfigField]:
        return []

    @classmethod
    def definition(cls) -> NodeDefinition:
        return NodeDefinition(
            type_id=cls.type_id,
            label=cls.label,
            category=cls.category,
            description=cls.description,
            color=cls.color,
            inputs=list(cls.inputs),
            outputs=list(cls.outputs),
            config_fields=cls.config_fields(),
        )

    @abstractmethod
    def execute(self, ctx: FlowContext, config: dict[str, Any]) -> NodeResult:
        raise NotImplementedError
