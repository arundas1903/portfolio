from __future__ import annotations

from typing import Literal

SupportLevel = Literal[
    "yes",
    "no",
    "registration",
    "partial",
    "varies",
    "na",
    "unknown",
]

ChannelKey = Literal["alphanumeric", "shortCode", "longCode", "tollFree"]

CHANNEL_LABELS: dict[ChannelKey, str] = {
    "alphanumeric": "Alphanumeric Sender ID",
    "shortCode": "Short Code",
    "longCode": "Long Code",
    "tollFree": "Toll-Free",
}

SUPPORT_LABELS: dict[SupportLevel, str] = {
    "yes": "Supported",
    "no": "Not supported",
    "registration": "Registration required",
    "partial": "Partial / exceptions",
    "varies": "Varies by carrier",
    "na": "N/A",
    "unknown": "Unknown",
}
