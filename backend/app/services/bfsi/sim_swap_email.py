from __future__ import annotations

from app.services.bfsi import database as db

SIM_SWAP_TEMPLATE_ID = "sim-swap"
SIM_SWAP_TEMPLATE_NAME = "SIM swap alert email"


def validate_email_content(content: str) -> str | None:
    trimmed = content.strip()
    if not trimmed:
        return "Email content is required."
    if len(trimmed) > 5000:
        return "Email content must be 5000 characters or fewer."
    return None


def upsert_sim_swap_email_config(email: str, *, email_content: str) -> tuple[dict | None, str | None]:
    error = validate_email_content(email_content)
    if error:
        return None, error
    return db.upsert_sim_swap_email_config(email, email_content=email_content.strip()), None


def delete_sim_swap_email_config(email: str) -> tuple[bool, str | None]:
    deleted = db.delete_sim_swap_email_config(email)
    if not deleted:
        return False, "SIM swap email configuration not found."
    return True, None
