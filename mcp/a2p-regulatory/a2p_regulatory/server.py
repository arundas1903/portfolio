"""MCP server exposing A2P SMS regulatory intelligence tools."""

from __future__ import annotations

import json

from mcp.server.fastmcp import FastMCP

from a2p_regulatory.guidance import (
    build_onboarding_guidance,
    compare_countries as format_country_comparison,
    format_country_summary,
)
from a2p_regulatory.models import CHANNEL_LABELS, SUPPORT_LABELS, ChannelKey, SupportLevel
from a2p_regulatory.store import get_store

mcp = FastMCP(
    "A2P Regulatory Intelligence",
    instructions=(
        "Regulatory intelligence and onboarding guidance for global A2P SMS across 190+ countries. "
        "Use lookup_country for a single market, search_countries to filter by channel support, "
        "get_onboarding_guidance for launch checklists, and compare_countries for side-by-side reviews."
    ),
)


def _parse_channel(channel: str) -> ChannelKey:
    normalized = channel.strip()
    aliases = {
        "alpha": "alphanumeric",
        "alphanumeric": "alphanumeric",
        "sender_id": "alphanumeric",
        "sender id": "alphanumeric",
        "short_code": "shortCode",
        "shortcode": "shortCode",
        "short code": "shortCode",
        "long_code": "longCode",
        "longcode": "longCode",
        "long code": "longCode",
        "toll_free": "tollFree",
        "tollfree": "tollFree",
        "toll-free": "tollFree",
    }
    key = aliases.get(normalized.lower(), normalized)
    if key not in CHANNEL_LABELS:
        allowed = ", ".join(CHANNEL_LABELS.keys())
        raise ValueError(f"Unknown channel '{channel}'. Use one of: {allowed}")
    return key  # type: ignore[return-value]


def _parse_support(level: str) -> SupportLevel:
    normalized = level.strip().lower().replace(" ", "_")
    aliases = {
        "supported": "yes",
        "registration_required": "registration",
        "register": "registration",
    }
    parsed = aliases.get(normalized, normalized)
    if parsed not in SUPPORT_LABELS:
        allowed = ", ".join(SUPPORT_LABELS.keys())
        raise ValueError(f"Unknown support level '{level}'. Use one of: {allowed}")
    return parsed  # type: ignore[return-value]


@mcp.tool()
def get_dataset_overview() -> str:
    """Return high-level stats for the A2P regulatory dataset (country count and channel breakdown)."""
    store = get_store()
    stats = store.stats()
    lines = [
        f"Countries covered: {stats['country_count']}",
        f"Alphanumeric registration required: {stats['registration_required_alphanumeric']}",
        f"Short code registration required: {stats['registration_required_short_code']}",
        "",
        "Channel support breakdown:",
    ]
    for channel, breakdown in stats["channels"].items():
        label = CHANNEL_LABELS[channel]  # type: ignore[index]
        summary = ", ".join(f"{SUPPORT_LABELS[level]}={count}" for level, count in sorted(breakdown.items()))
        lines.append(f"- {label}: {summary}")
    return "\n".join(lines)


@mcp.tool()
def lookup_country(query: str) -> str:
    """Look up A2P SMS regulatory support for a country by ISO-3166 alpha-2 code or country name.

    Args:
        query: Country code (e.g. BR, DE) or name (e.g. Brazil, Germany).
    """
    store = get_store()
    country = store.lookup(query)
    if not country:
        return f"No country found for '{query}'. Try an ISO-2 code or full/partial country name."
    return format_country_summary(country)


@mcp.tool()
def search_countries(
    channel: str | None = None,
    support_level: str | None = None,
    query: str | None = None,
    two_way: str | None = None,
    international: str | None = None,
    limit: int = 25,
) -> str:
    """Search countries by sender channel support, two-way SMS, or international sending rules.

    Args:
        channel: Sender channel — alphanumeric, shortCode, longCode, or tollFree.
        support_level: Support level — yes, no, registration, partial, varies, na, unknown.
        query: Optional text filter on country name, ISO code, or dial code.
        two_way: Filter by two-way SMS support level.
        international: Filter by international sending support level.
        limit: Maximum results (default 25, max 100).
    """
    store = get_store()
    parsed_channel = _parse_channel(channel) if channel else None
    parsed_support = _parse_support(support_level) if support_level else None
    parsed_two_way = _parse_support(two_way) if two_way else None
    parsed_international = _parse_support(international) if international else None

    if parsed_channel and not parsed_support:
        return "When channel is provided, support_level is required."

    results = store.search(
        channel=parsed_channel,
        support_level=parsed_support,
        query=query,
        two_way=parsed_two_way,
        international=parsed_international,
        limit=limit,
    )

    if not results:
        return "No countries matched the filters."

    lines = [f"Found {len(results)} countr{'y' if len(results) == 1 else 'ies'}:", ""]
    for country in results:
        if parsed_channel:
            level = country.channels[parsed_channel]
            lines.append(f"- {country.name} ({country.iso2}): {SUPPORT_LABELS[level]}")
        else:
            lines.append(f"- {country.name} ({country.iso2})")
    return "\n".join(lines)


@mcp.tool()
def list_registration_required(channel: str | None = None) -> str:
    """List countries where sender registration is required for a channel.

    Args:
        channel: Optional channel filter — alphanumeric, shortCode, longCode, or tollFree.
    """
    store = get_store()
    parsed_channel = _parse_channel(channel) if channel else None
    matches = store.registration_required(parsed_channel)

    if not matches:
        label = CHANNEL_LABELS[parsed_channel] if parsed_channel else "any sender channel"
        return f"No countries with registration required for {label}."

    lines = [f"{len(matches)} countries require registration:", ""]
    for country in matches[:100]:
        if parsed_channel:
            lines.append(f"- {country.name} ({country.iso2})")
        else:
            flagged = [
                CHANNEL_LABELS[key]
                for key in CHANNEL_LABELS
                if country.channels[key] == "registration"  # type: ignore[index]
            ]
            lines.append(f"- {country.name} ({country.iso2}): {', '.join(flagged)}")
    if len(matches) > 100:
        lines.append(f"... and {len(matches) - 100} more")
    return "\n".join(lines)


@mcp.tool()
def get_onboarding_guidance(country: str, channel: str, use_case: str | None = None) -> str:
    """Generate an onboarding checklist for launching A2P SMS in a country on a specific channel.

    Args:
        country: ISO-2 code or country name.
        channel: Sender channel — alphanumeric, shortCode, longCode, or tollFree.
        use_case: Optional campaign description (e.g. OTP alerts, marketing promotions).
    """
    store = get_store()
    record = store.lookup(country)
    if not record:
        return f"No country found for '{country}'."
    parsed_channel = _parse_channel(channel)
    return build_onboarding_guidance(record, parsed_channel, use_case)


@mcp.tool()
def compare_countries(countries: list[str], channel: str | None = None) -> str:
    """Compare A2P SMS regulatory support across multiple countries side by side.

    Args:
        countries: List of ISO-2 codes or country names (2–10 entries).
        channel: Optional single channel to focus the comparison.
    """
    store = get_store()
    parsed_channel = _parse_channel(channel) if channel else None
    resolved = []
    missing = []

    for entry in countries[:10]:
        record = store.lookup(entry)
        if record:
            resolved.append(record)
        else:
            missing.append(entry)

    text = format_country_comparison(resolved, parsed_channel)
    if missing:
        text += "\n\nNot found: " + ", ".join(missing)
    return text


@mcp.resource("regulatory://stats")
def regulatory_stats() -> str:
    """Dataset statistics as JSON."""
    return json.dumps(get_store().stats(), indent=2)


@mcp.resource("regulatory://country/{iso2}")
def regulatory_country(iso2: str) -> str:
    """Full country regulatory record as JSON."""
    store = get_store()
    country = store.lookup(iso2)
    if not country:
        return json.dumps({"error": f"Unknown country: {iso2}"})
    return json.dumps(country.to_dict(), indent=2)


def main() -> None:
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
