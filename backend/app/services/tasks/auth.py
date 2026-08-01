from __future__ import annotations

import hashlib
import hmac
import secrets
import time

from app.config import settings

PBKDF2_ITERATIONS = 260_000


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    )
    return f"pbkdf2_sha256${salt}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        scheme, salt, digest_hex = stored_hash.split("$", 2)
        if scheme != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            PBKDF2_ITERATIONS,
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except ValueError:
        return False


def create_session_token(email: str) -> str:
    email = normalize_email(email)
    expires = int(time.time()) + settings.bfsi_session_ttl_seconds
    payload = f"tasks|{email}|{expires}"
    signature = hmac.new(
        settings.resolved_bfsi_session_secret.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload}|{signature}"


def verify_session_token(token: str) -> str | None:
    try:
        prefix, email, expires_str, signature = token.rsplit("|", 3)
        if prefix != "tasks":
            return None
        expires = int(expires_str)
    except ValueError:
        return None

    if expires < int(time.time()):
        return None

    payload = f"tasks|{email}|{expires}"
    expected = hmac.new(
        settings.resolved_bfsi_session_secret.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        return None
    return normalize_email(email)
