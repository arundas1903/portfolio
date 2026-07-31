from __future__ import annotations

CHANNEL_PRICE_PAISE: dict[str, int] = {
    "sms": 10,
    "email": 2,
    "push": 1,
}

DEFAULT_CHANNEL = "sms"


def get_channel_price_paise(channel: str) -> int:
    return CHANNEL_PRICE_PAISE.get(channel, 0)


def compute_roi_summary(
    *,
    send_count: int,
    total_usage_paise: int,
    channel_counts: dict[str, int],
) -> dict[str, int | float]:
    baseline_cost_paise = send_count * CHANNEL_PRICE_PAISE[DEFAULT_CHANNEL]
    savings_paise = max(0, baseline_cost_paise - total_usage_paise)
    savings_percent = (
        round((savings_paise / baseline_cost_paise) * 100, 1) if baseline_cost_paise > 0 else 0.0
    )
    return {
        "baseline_cost_paise": baseline_cost_paise,
        "savings_paise": savings_paise,
        "savings_percent": savings_percent,
        "channel_counts": channel_counts,
    }


def format_paise(paise: int) -> str:
    if paise < 100:
        return f"{paise} paise"
    rupees = paise / 100
    if rupees == int(rupees):
        return f"₹{int(rupees)}"
    return f"₹{rupees:.2f}"


def channel_prices_public() -> dict[str, int]:
    return dict(CHANNEL_PRICE_PAISE)
