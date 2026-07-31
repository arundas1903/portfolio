from __future__ import annotations

from app.services.bfsi import database as db
from app.services.bfsi.sessions import create_session_token


def start_session(email: str, *, ip: str, client_id: str) -> tuple[str | None, dict | None, str | None]:
    normalized = db.normalize_email(email)
    if not normalized or "@" not in normalized:
        return None, None, "Enter a valid email address."

    ip_email = db.get_ip_binding(ip)
    if ip_email and ip_email != normalized:
        return None, None, f"This network is already linked to {ip_email}. One email per network."

    client_email = db.get_client_binding(client_id)
    if client_email and client_email != normalized:
        return None, None, f"This browser is already linked to {client_email}. One email per browser."

    db.bind_ip(ip, normalized)
    db.bind_client(client_id, normalized)
    user = db.upsert_user(normalized)
    token = create_session_token(normalized)
    return token, {"email": user["email"]}, None
