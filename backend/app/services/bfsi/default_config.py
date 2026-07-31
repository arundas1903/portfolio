from __future__ import annotations

from app.services.bfsi import database as db
from app.services.bfsi.templates import format_routing_summary, validate_channels


def validate_default_config_fields(
    *,
    amount_threshold: float,
    channel_if_above: str,
    channel_if_below: str,
) -> str | None:
    channel_error = validate_channels(channel_if_above, channel_if_below)
    if channel_error:
        return channel_error

    if amount_threshold < 0:
        return "Amount threshold must be zero or greater."

    return None


def upsert_default_config_for_user(
    email: str,
    *,
    amount_threshold: float,
    channel_if_above: str,
    channel_if_below: str,
) -> tuple[dict | None, str | None]:
    error = validate_default_config_fields(
        amount_threshold=amount_threshold,
        channel_if_above=channel_if_above,
        channel_if_below=channel_if_below,
    )
    if error:
        return None, error

    config = db.upsert_default_config(
        email,
        amount_threshold=amount_threshold,
        channel_if_above=channel_if_above,
        channel_if_below=channel_if_below,
    )
    return config, None


def delete_default_config_for_user(email: str) -> tuple[bool, str | None]:
    deleted = db.delete_default_config(email)
    if not deleted:
        return False, "Default configuration not found."
    return True, None


def set_default_config_paused_for_user(email: str, *, paused: bool) -> tuple[dict | None, str | None]:
    config = db.set_default_config_paused(email, paused=paused)
    if not config:
        return None, "Default configuration not found."
    return config, None


def format_default_config_response(config: dict) -> dict:
    return {
        **config,
        "routing_summary": format_routing_summary(config),
    }
