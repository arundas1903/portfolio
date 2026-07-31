from __future__ import annotations

import re

from app.services.bfsi import database as db

AMOUNT_VARIABLE = "{amount}"
CHANNEL_LABELS = {
    "sms": "SMS",
    "email": "Email",
    "push": "Push notification",
}


def validate_template_content(content: str) -> str | None:
    trimmed = content.strip()
    if not trimmed:
        return "Template content is required."

    if AMOUNT_VARIABLE not in trimmed:
        return f'Template content must include the {AMOUNT_VARIABLE} variable (e.g. "Your transaction of {AMOUNT_VARIABLE} rupees is successful").'

    if re.search(r"\{\{\s*amount\s*\}\}|\{amount\s+\}|\{\s+amount\}", trimmed, re.IGNORECASE):
        return f"Use a single curly-brace variable exactly as {AMOUNT_VARIABLE}."

    return None


def validate_channels(channel_if_above: str, channel_if_below: str) -> str | None:
    for label, value in (("above threshold", channel_if_above), ("below threshold", channel_if_below)):
        if value not in db.NOTIFICATION_CHANNELS:
            allowed = ", ".join(sorted(db.NOTIFICATION_CHANNELS))
            return f"Invalid channel for {label}. Choose one of: {allowed}."
    return None


def _validate_template_fields(
    *,
    name: str,
    content: str,
    amount_threshold: float,
    channel_if_above: str,
    channel_if_below: str,
) -> str | None:
    if not name.strip():
        return "Template name is required."

    content_error = validate_template_content(content)
    if content_error:
        return content_error

    channel_error = validate_channels(channel_if_above, channel_if_below)
    if channel_error:
        return channel_error

    if amount_threshold < 0:
        return "Amount threshold must be zero or greater."

    return None


def create_template_for_user(
    email: str,
    *,
    name: str,
    content: str,
    amount_threshold: float,
    channel_if_above: str,
    channel_if_below: str,
) -> tuple[dict | None, str | None]:
    error = _validate_template_fields(
        name=name,
        content=content,
        amount_threshold=amount_threshold,
        channel_if_above=channel_if_above,
        channel_if_below=channel_if_below,
    )
    if error:
        return None, error

    template = db.create_template(
        email,
        name=name,
        content=content,
        amount_threshold=amount_threshold,
        channel_if_above=channel_if_above,
        channel_if_below=channel_if_below,
    )
    return template, None


def update_template_for_user(
    email: str,
    template_id: str,
    *,
    name: str,
    content: str,
    amount_threshold: float,
    channel_if_above: str,
    channel_if_below: str,
) -> tuple[dict | None, str | None]:
    error = _validate_template_fields(
        name=name,
        content=content,
        amount_threshold=amount_threshold,
        channel_if_above=channel_if_above,
        channel_if_below=channel_if_below,
    )
    if error:
        return None, error

    template = db.update_template(
        email,
        template_id,
        name=name,
        content=content,
        amount_threshold=amount_threshold,
        channel_if_above=channel_if_above,
        channel_if_below=channel_if_below,
    )
    if not template:
        return None, "Template not found."
    return template, None


def format_routing_summary(template: dict) -> str:
    threshold = template["amount_threshold"]
    above = CHANNEL_LABELS.get(template["channel_if_above"], template["channel_if_above"])
    below = CHANNEL_LABELS.get(template["channel_if_below"], template["channel_if_below"])
    return f"Amount > {threshold:g} → {above}; amount ≤ {threshold:g} → {below}"
