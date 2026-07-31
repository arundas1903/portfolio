from __future__ import annotations

from app.config import settings

# OpenAI list prices per 1M tokens (USD). Updated for gpt-4o-mini / gpt-4o family.
MODEL_TOKEN_PRICING_USD_PER_1M: dict[str, dict[str, float]] = {
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-2024-08-06": {"input": 2.50, "output": 10.00},
    "gpt-4o-2024-11-20": {"input": 2.50, "output": 10.00},
}

DEFAULT_USD_TO_INR = 84.0
MICRO_PAISE_PER_INR = 10_000


def _resolve_model_rates(model: str) -> dict[str, float]:
    if model in MODEL_TOKEN_PRICING_USD_PER_1M:
        return MODEL_TOKEN_PRICING_USD_PER_1M[model]
    prefix = model.split(":")[0]
    if prefix in MODEL_TOKEN_PRICING_USD_PER_1M:
        return MODEL_TOKEN_PRICING_USD_PER_1M[prefix]
    return MODEL_TOKEN_PRICING_USD_PER_1M["gpt-4o-mini"]


def compute_ai_cost_micro_paise(
    *,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    usd_to_inr: float = DEFAULT_USD_TO_INR,
) -> int:
    rates = _resolve_model_rates(model)
    cost_usd = (
        (prompt_tokens * rates["input"]) + (completion_tokens * rates["output"])
    ) / 1_000_000
    cost_inr = cost_usd * usd_to_inr
    return max(0, round(cost_inr * MICRO_PAISE_PER_INR))


def build_ai_usage(
    *,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
) -> dict[str, int | str]:
    return {
        "model": model,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": prompt_tokens + completion_tokens,
        "cost_micro_paise": compute_ai_cost_micro_paise(
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        ),
    }


def format_ai_cost_micro_paise(micro_paise: int) -> str:
    if micro_paise <= 0:
        return "0 paise"
    paise = micro_paise / 100
    if paise < 100:
        return f"{paise:.2f} paise"
    rupees = paise / 100
    return f"₹{rupees:.4f}"


def configured_openai_model() -> str:
    return settings.openai_model.strip() or "gpt-4o-mini"
