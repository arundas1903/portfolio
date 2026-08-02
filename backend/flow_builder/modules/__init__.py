from flow_builder.base import ConfigField, FlowContext, FlowModule, NodeResult
from flow_builder.registry import register_module


@register_module
class StartModule(FlowModule):
    type_id = "start"
    label = "Start"
    category = "Flow"
    description = "Entry point for the workflow."
    color = "#22c55e"
    inputs: list[str] = []
    outputs = ["out"]

    def execute(self, ctx: FlowContext, config: dict) -> NodeResult:
        ctx.logs.append("Workflow started.")
        return NodeResult(output_handle="out")


@register_module
class EndModule(FlowModule):
    type_id = "end"
    label = "End"
    category = "Flow"
    description = "Terminates the workflow."
    color = "#ef4444"
    outputs: list[str] = []

    @classmethod
    def config_fields(cls) -> list[ConfigField]:
        return [
            ConfigField(
                key="message",
                label="Completion message",
                field_type="string",
                default="Workflow completed.",
                required=False,
            )
        ]

    def execute(self, ctx: FlowContext, config: dict) -> NodeResult:
        message = str(config.get("message") or "Workflow completed.")
        ctx.logs.append(message)
        return NodeResult(stop=True)


@register_module
class ConditionModule(FlowModule):
    type_id = "condition"
    label = "Condition"
    category = "Logic"
    description = "Branch on a field value — routes to Yes or No."
    color = "#f59e0b"
    outputs = ["yes", "no"]

    @classmethod
    def config_fields(cls) -> list[ConfigField]:
        return [
            ConfigField(key="field", label="Field name", field_type="string", default="score"),
            ConfigField(
                key="operator",
                label="Operator",
                field_type="select",
                default="eq",
                options=["eq", "neq", "gt", "gte", "lt", "lte", "contains", "exists"],
            ),
            ConfigField(key="value", label="Compare value", field_type="string", default="", required=False),
        ]

    def execute(self, ctx: FlowContext, config: dict) -> NodeResult:
        field = str(config.get("field") or "")
        operator = str(config.get("operator") or "eq")
        expected = config.get("value")
        actual = ctx.data.get(field)

        matched = self._evaluate(actual, operator, expected)
        handle = "yes" if matched else "no"
        ctx.logs.append(f"Condition {field} {operator} {expected!r} → {handle} (actual: {actual!r})")
        return NodeResult(output_handle=handle)

    @staticmethod
    def _evaluate(actual, operator: str, expected) -> bool:
        if operator == "exists":
            return actual is not None
        if operator == "contains":
            return str(expected) in str(actual or "")
        if operator == "eq":
            return actual == expected or str(actual) == str(expected)
        if operator == "neq":
            return actual != expected and str(actual) != str(expected)
        try:
            left = float(actual)
            right = float(expected)
        except (TypeError, ValueError):
            return False
        if operator == "gt":
            return left > right
        if operator == "gte":
            return left >= right
        if operator == "lt":
            return left < right
        if operator == "lte":
            return left <= right
        return False


@register_module
class SetValueModule(FlowModule):
    type_id = "set_value"
    label = "Set Value"
    category = "Data"
    description = "Write a key into the workflow data context."
    color = "#3b82f6"

    @classmethod
    def config_fields(cls) -> list[ConfigField]:
        return [
            ConfigField(key="key", label="Key", field_type="string", default="status"),
            ConfigField(key="value", label="Value", field_type="string", default="approved"),
        ]

    def execute(self, ctx: FlowContext, config: dict) -> NodeResult:
        key = str(config.get("key") or "")
        value = config.get("value")
        if key:
            ctx.data[key] = value
            ctx.logs.append(f"Set {key} = {value!r}")
        return NodeResult(output_handle="out")


@register_module
class LogMessageModule(FlowModule):
    type_id = "log"
    label = "Log"
    category = "Utility"
    description = "Append a message to the execution log."
    color = "#8b5cf6"

    @classmethod
    def config_fields(cls) -> list[ConfigField]:
        return [
            ConfigField(key="message", label="Message", field_type="string", default="Step executed."),
        ]

    def execute(self, ctx: FlowContext, config: dict) -> NodeResult:
        message = str(config.get("message") or "")
        ctx.logs.append(message)
        return NodeResult(output_handle="out")


@register_module
class DelayModule(FlowModule):
    type_id = "delay"
    label = "Delay"
    category = "Utility"
    description = "Simulate a wait step (records intent, no real sleep in demo)."
    color = "#64748b"

    @classmethod
    def config_fields(cls) -> list[ConfigField]:
        return [
            ConfigField(key="seconds", label="Seconds", field_type="number", default=1),
        ]

    def execute(self, ctx: FlowContext, config: dict) -> NodeResult:
        seconds = config.get("seconds", 1)
        ctx.logs.append(f"Delay {seconds}s (simulated)")
        return NodeResult(output_handle="out")


from flow_builder.modules import api_call  # noqa: F401
