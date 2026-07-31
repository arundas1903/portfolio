from __future__ import annotations

import hashlib
import hmac
import time

from app.config import settings


def create_session_token(email: str) -> str:
    email = email.strip().lower()
    expires = int(time.time()) + settings.bfsi_session_ttl_seconds
    payload = f"bfsi|{email}|{expires}"
    signature = hmac.new(
        settings.resolved_bfsi_session_secret.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload}|{signature}"


def verify_session_token(token: str) -> str | None:
    try:
        prefix, email, expires_str, signature = token.rsplit("|", 3)
        if prefix != "bfsi":
            return None
        expires = int(expires_str)
    except ValueError:
        return None

    if expires < int(time.time()):
        return None

    payload = f"bfsi|{email}|{expires}"
    expected = hmac.new(
        settings.resolved_bfsi_session_secret.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        return None

    return email.strip().lower()
