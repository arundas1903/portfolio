from __future__ import annotations

SIM_SWAP_BLOCK_MESSAGE = (
    "Your SIM was swapped recently. For security, you cannot register for one day. "
    "Please try again tomorrow or contact your bank."
)


def is_recent_sim_swap(sim_swap: dict | None) -> bool:
    if not sim_swap or not sim_swap.get("checked"):
        return False
    if sim_swap.get("status") != "recent_swap":
        return False
    days = sim_swap.get("swapped_within_days")
    return days is None or days < 1
