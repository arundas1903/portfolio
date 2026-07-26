from __future__ import annotations

import hashlib
import hmac
import time

from app.config import settings


def create_session_token(email: str) -> str:
    email = email.strip().lower()
    expires = int(time.time()) + settings.movie_session_ttl_seconds
    payload = f"{email}|{expires}"
    signature = hmac.new(
        settings.resolved_movie_session_secret.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload}|{signature}"


def verify_session_token(token: str) -> str | None:
    try:
        email, expires_str, signature = token.rsplit("|", 2)
        expires = int(expires_str)
    except ValueError:
        return None

    if expires < int(time.time()):
        return None

    payload = f"{email}|{expires}"
    expected = hmac.new(
        settings.resolved_movie_session_secret.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        return None

    return email.strip().lower()
