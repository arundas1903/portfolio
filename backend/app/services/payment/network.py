from __future__ import annotations

import hashlib
import random
from datetime import UTC, datetime

SIM_SWAP_STATUSES = ("no_swap", "recent_swap", "unknown")
RISK_BY_STATUS = {
    "no_swap": "low",
    "recent_swap": "high",
    "unknown": "medium",
}

LOCATIONS = [
    {"country": "India", "region": "Karnataka", "city": "Bengaluru", "carrier": "Jio"},
    {"country": "India", "region": "Maharashtra", "city": "Mumbai", "carrier": "Airtel"},
    {"country": "India", "region": "Tamil Nadu", "city": "Chennai", "carrier": "Vi"},
    {"country": "India", "region": "Delhi", "city": "New Delhi", "carrier": "BSNL"},
    {"country": "India", "region": "Telangana", "city": "Hyderabad", "carrier": "Jio"},
    {"country": "India", "region": "West Bengal", "city": "Kolkata", "carrier": "Airtel"},
]

# Demo number — always reports a SIM swap within the last 24 hours.
DEMO_RECENT_SIM_SWAP_PHONE = "9999999999"


def _normalize_phone(phone_number: str) -> str:
    digits = "".join(ch for ch in phone_number if ch.isdigit())
    if len(digits) < 10:
        raise ValueError("Phone number must contain at least 10 digits.")
    return digits[-10:]


def _seeded_rng(phone_number: str) -> random.Random:
    digest = hashlib.sha256(phone_number.encode()).hexdigest()
    return random.Random(int(digest[:12], 16))


def check_network(phone_number: str, *, sim_swap: bool, location: bool) -> dict:
    normalized = _normalize_phone(phone_number)
    rng = _seeded_rng(normalized)
    checked_at = datetime.now(UTC).isoformat()

    result: dict = {
        "phone_number": normalized,
        "checked_at": checked_at,
        "sim_swap": None,
        "location": None,
    }

    if sim_swap:
        if normalized == DEMO_RECENT_SIM_SWAP_PHONE:
            result["sim_swap"] = {
                "checked": True,
                "status": "recent_swap",
                "swapped_within_days": 0,
                "risk_level": "high",
            }
        else:
            status = rng.choices(
                SIM_SWAP_STATUSES,
                weights=[0.62, 0.23, 0.15],
                k=1,
            )[0]
            swapped_within_days = None
            if status == "recent_swap":
                swapped_within_days = rng.choice([0, 0, 1, 2, 3, 5, 7, 11, 14])
            result["sim_swap"] = {
                "checked": True,
                "status": status,
                "swapped_within_days": swapped_within_days,
                "risk_level": RISK_BY_STATUS[status],
            }

    if location:
        place = rng.choice(LOCATIONS)
        result["location"] = {
            "checked": True,
            "country": place["country"],
            "region": place["region"],
            "city": place["city"],
            "carrier": place["carrier"],
        }

    return result
