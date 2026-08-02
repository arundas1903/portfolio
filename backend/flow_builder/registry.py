from __future__ import annotations

from flow_builder.base import FlowModule, NodeDefinition


_REGISTRY: dict[str, type[FlowModule]] = {}


def register_module(module_cls: type[FlowModule]) -> type[FlowModule]:
    """Decorator to register a flow module."""
    if not module_cls.type_id:
        raise ValueError(f"{module_cls.__name__} must define type_id")
    _REGISTRY[module_cls.type_id] = module_cls
    return module_cls


def get_module(type_id: str) -> type[FlowModule]:
    if type_id not in _REGISTRY:
        raise KeyError(f"Unknown module type: {type_id}")
    return _REGISTRY[type_id]


def list_modules() -> list[NodeDefinition]:
    return [cls.definition() for cls in _REGISTRY.values()]


def discover_modules() -> None:
    """Import all built-in modules so they self-register."""
    import flow_builder.modules  # noqa: F401
