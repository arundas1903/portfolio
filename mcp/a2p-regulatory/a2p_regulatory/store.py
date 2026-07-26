from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from a2p_regulatory.models import CHANNEL_LABELS, SUPPORT_LABELS, ChannelKey, SupportLevel

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = PACKAGE_ROOT.parents[1]


@dataclass(frozen=True)
class CountryRecord:
    name: str
    iso2: str
    dial_code: str
    channels: dict[ChannelKey, SupportLevel]
    two_way_sms: SupportLevel
    international_sending: SupportLevel
    twilio_alpha: SupportLevel | None
    sources: list[str]

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> CountryRecord:
        return cls(
            name=data["name"],
            iso2=data["iso2"],
            dial_code=data["dialCode"],
            channels={
                "alphanumeric": data["channels"]["alphanumeric"],
                "shortCode": data["channels"]["shortCode"],
                "longCode": data["channels"]["longCode"],
                "tollFree": data["channels"]["tollFree"],
            },
            two_way_sms=data["twoWaySms"],
            international_sending=data["internationalSending"],
            twilio_alpha=data.get("twilioAlpha"),
            sources=list(data.get("sources", [])),
        )

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "name": self.name,
            "iso2": self.iso2,
            "dialCode": self.dial_code,
            "channels": self.channels,
            "twoWaySms": self.two_way_sms,
            "internationalSending": self.international_sending,
            "sources": self.sources,
        }
        if self.twilio_alpha is not None:
            payload["twilioAlpha"] = self.twilio_alpha
        return payload


def resolve_data_path() -> Path:
    if env_path := os.getenv("A2P_DATA_PATH"):
        return Path(env_path).expanduser().resolve()

    candidates = [
        PACKAGE_ROOT / "data" / "countries.json",
        REPO_ROOT / "backend" / "data" / "countries.json",
        REPO_ROOT / "src" / "a2p-atlas" / "data" / "countries.json",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        "countries.json not found. Set A2P_DATA_PATH or run scripts/generate-a2p-data.py"
    )


class CountryStore:
    def __init__(self, data_path: Path | None = None) -> None:
        path = data_path or resolve_data_path()
        raw = json.loads(path.read_text(encoding="utf-8"))
        self.data_path = path
        self.countries: list[CountryRecord] = [CountryRecord.from_dict(item) for item in raw]
        self.by_iso = {country.iso2.upper(): country for country in self.countries}
        self.by_name = {country.name.lower(): country for country in self.countries}

    def lookup(self, query: str) -> CountryRecord | None:
        normalized = query.strip()
        if not normalized:
            return None

        upper = normalized.upper()
        if upper in self.by_iso:
            return self.by_iso[upper]

        lower = normalized.lower()
        if lower in self.by_name:
            return self.by_name[lower]

        for country in self.countries:
            if lower in country.name.lower():
                return country

        return None

    def search(
        self,
        *,
        channel: ChannelKey | None = None,
        support_level: SupportLevel | None = None,
        two_way: SupportLevel | None = None,
        international: SupportLevel | None = None,
        query: str | None = None,
        limit: int = 25,
    ) -> list[CountryRecord]:
        results = self.countries

        if query:
            needle = query.strip().lower()
            results = [
                country
                for country in results
                if needle in country.name.lower()
                or needle == country.iso2.lower()
                or needle in country.dial_code
            ]

        if channel and support_level:
            results = [country for country in results if country.channels[channel] == support_level]

        if two_way:
            results = [country for country in results if country.two_way_sms == two_way]

        if international:
            results = [country for country in results if country.international_sending == international]

        return results[: max(1, min(limit, 100))]

    def registration_required(self, channel: ChannelKey | None = None) -> list[CountryRecord]:
        channels: tuple[ChannelKey, ...] = (channel,) if channel else tuple(CHANNEL_LABELS.keys())
        matches: list[CountryRecord] = []
        for country in self.countries:
            if any(country.channels[key] == "registration" for key in channels):
                matches.append(country)
        return matches

    def stats(self) -> dict[str, Any]:
        channel_stats: dict[str, dict[str, int]] = {}
        for key in CHANNEL_LABELS:
            channel_stats[key] = {}
            for country in self.countries:
                level = country.channels[key]
                channel_stats[key][level] = channel_stats[key].get(level, 0) + 1

        return {
            "country_count": len(self.countries),
            "data_path": str(self.data_path),
            "channels": channel_stats,
            "registration_required_alphanumeric": sum(
                1 for country in self.countries if country.channels["alphanumeric"] == "registration"
            ),
            "registration_required_short_code": sum(
                1 for country in self.countries if country.channels["shortCode"] == "registration"
            ),
        }

    def extract_countries_from_text(self, text: str, limit: int = 5) -> list[CountryRecord]:
        found: list[CountryRecord] = []
        seen: set[str] = set()
        lowered = text.lower()

        iso_matches = re.findall(r"\b([A-Z]{2})\b", text)
        for iso in iso_matches:
            country = self.by_iso.get(iso)
            if country and country.iso2 not in seen:
                seen.add(country.iso2)
                found.append(country)

        for country in self.countries:
            if country.iso2 in seen:
                continue
            if country.name.lower() in lowered:
                seen.add(country.iso2)
                found.append(country)
            if len(found) >= limit:
                break

        return found[:limit]


@lru_cache(maxsize=1)
def get_store() -> CountryStore:
    return CountryStore()
