from __future__ import annotations

CHANNEL_PRICE_PAISE: dict[str, int] = {
    "sms": 10,
    "email": 2,
    "push": 1,
    "network": 5,
}

SIM_SWAP_PRICE_PAISE = 5
DEFAULT_CHANNEL = "sms"


def get_channel_price_paise(channel: str) -> int:
    return CHANNEL_PRICE_PAISE.get(channel, 0)


def get_sim_swap_price_paise() -> int:
    return SIM_SWAP_PRICE_PAISE


def compute_roi_summary(
    *,
    total_usage_paise: int,
    channel_counts: dict[str, int],
) -> dict[str, int | float]:
    notification_count = sum(channel_counts.get(channel, 0) for channel in ("sms", "email", "push"))
    baseline_cost_paise = notification_count * CHANNEL_PRICE_PAISE[DEFAULT_CHANNEL]
    savings_paise = max(0, baseline_cost_paise - total_usage_paise)
    savings_percent = (
        round((savings_paise / baseline_cost_paise) * 100, 1) if baseline_cost_paise > 0 else 0.0
    )
    return {
        "notification_count": notification_count,
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
