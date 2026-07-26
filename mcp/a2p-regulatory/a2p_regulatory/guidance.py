from __future__ import annotations

from a2p_regulatory.models import CHANNEL_LABELS, SUPPORT_LABELS, ChannelKey
from a2p_regulatory.store import CountryRecord


def format_country_summary(country: CountryRecord) -> str:
    lines = [
        f"{country.name} ({country.iso2}) · dial code +{country.dial_code}",
        "",
        "Sender channels:",
    ]
    for key, label in CHANNEL_LABELS.items():
        level = country.channels[key]
        lines.append(f"  • {label}: {SUPPORT_LABELS[level]} ({level})")

    lines.extend(
        [
            "",
            f"Two-way SMS: {SUPPORT_LABELS[country.two_way_sms]}",
            f"International sending: {SUPPORT_LABELS[country.international_sending]}",
        ]
    )

    if country.twilio_alpha is not None:
        lines.append(f"Twilio alphanumeric reference: {SUPPORT_LABELS[country.twilio_alpha]}")

    if country.sources:
        lines.append("")
        lines.append("Sources: " + ", ".join(country.sources))

    return "\n".join(lines)


def build_onboarding_guidance(
    country: CountryRecord,
    channel: ChannelKey,
    use_case: str | None = None,
) -> str:
    label = CHANNEL_LABELS[channel]
    level = country.channels[channel]
    use_case_line = f"\nUse case: {use_case.strip()}" if use_case and use_case.strip() else ""

    steps: list[str] = [
        f"# A2P onboarding — {country.name} ({country.iso2})",
        f"Channel: {label}{use_case_line}",
        "",
        f"Current status: {SUPPORT_LABELS[level]}",
        "",
    ]

    if level == "registration":
        steps.extend(
            [
                "## Recommended steps",
                "1. Confirm the exact sender type with your CPaaS provider and local aggregator.",
                "2. Collect business registration, authorized signatory, and use-case documentation.",
                "3. Submit a sender registration request for this market before launching traffic.",
                "4. Plan a 2–6 week lead time; some markets require operator-by-operator approval.",
                "5. Prepare opt-in, opt-out, and content templates that match local telecom rules.",
                "6. Run a small pilot on the approved sender before scaling campaigns.",
            ]
        )
    elif level == "yes":
        steps.extend(
            [
                "## Recommended steps",
                "1. Validate sender formatting rules with your provider for this country.",
                "2. Confirm opt-in/opt-out and promotional vs transactional content restrictions.",
                "3. Configure message templates and throughput limits in your CPaaS account.",
                "4. Start with a controlled pilot and monitor delivery + error codes.",
            ]
        )
    elif level in {"partial", "varies"}:
        steps.extend(
            [
                "## Recommended steps",
                "1. Treat support as conditional — confirm carrier-specific rules before launch.",
                "2. Ask your provider which MNOs support this sender type in this market.",
                "3. Document exceptions and fallback channels (often long code or another sender type).",
                "4. Pilot with one carrier segment before broad rollout.",
            ]
        )
    elif level == "no":
        alternatives = [
            f"{CHANNEL_LABELS[key]}: {SUPPORT_LABELS[country.channels[key]]}"
            for key in CHANNEL_LABELS
            if key != channel and country.channels[key] in {"yes", "registration", "partial", "varies"}
        ]
        steps.extend(
            [
                "## Recommended steps",
                f"1. {label} is not supported for origination in {country.name}.",
                "2. Evaluate alternative sender types for this market:",
            ]
        )
        if alternatives:
            steps.extend(f"   • {item}" for item in alternatives)
        else:
            steps.append("   • No strong alternative sender types in the dataset — consult your CPaaS provider.")
        steps.append("3. If the use case requires this channel, consider a local entity or partner route.")
    else:
        steps.extend(
            [
                "## Recommended steps",
                "1. Treat this market as unknown in the public dataset.",
                "2. Open a regulatory review with your CPaaS provider before committing to launch dates.",
                "3. Cross-check operator bulletins and recent registration policy changes.",
            ]
        )

    if country.two_way_sms == "no" and use_case and "reply" in use_case.lower():
        steps.extend(["", "Note: two-way SMS appears unsupported — plan one-way flows or another channel for replies."])

    if country.international_sending == "no":
        steps.extend(["", "Note: international sending may be restricted — confirm routing from your sending region."])

    steps.extend(["", "## Quick reference", format_country_summary(country)])
    return "\n".join(steps)


def compare_countries(countries: list[CountryRecord], channel: ChannelKey | None = None) -> str:
    if not countries:
        return "No countries to compare."

    lines = ["# Country comparison", ""]
    keys: tuple[ChannelKey, ...] = (channel,) if channel else tuple(CHANNEL_LABELS.keys())

    for country in countries:
        lines.append(f"## {country.name} ({country.iso2})")
        for key in keys:
            level = country.channels[key]
            lines.append(f"- {CHANNEL_LABELS[key]}: {SUPPORT_LABELS[level]}")
        lines.append(f"- Two-way SMS: {SUPPORT_LABELS[country.two_way_sms]}")
        lines.append(f"- International sending: {SUPPORT_LABELS[country.international_sending]}")
        lines.append("")

    return "\n".join(lines).strip()
