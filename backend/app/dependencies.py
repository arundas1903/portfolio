from fastapi import Header, HTTPException, Request

from app.config import settings
from app.services.rate_limit import chat_rate_limiter


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


async def require_chat_password(
    x_chat_password: str | None = Header(default=None, alias="X-Chat-Password"),
) -> None:
    if not settings.chat_password_required:
        return

    if not x_chat_password or x_chat_password != settings.chat_access_password:
        raise HTTPException(status_code=401, detail="Invalid or missing chat password")


async def require_chat_rate_limit(request: Request) -> None:
    chat_rate_limiter.max_requests = settings.chat_rate_limit
    chat_rate_limiter.window_seconds = settings.chat_rate_window_seconds

    client_ip = get_client_ip(request)
    allowed, _, retry_after = chat_rate_limiter.consume(client_ip)

    if allowed:
        return

    retry_minutes = max(1, (retry_after + 59) // 60)
    raise HTTPException(
        status_code=429,
        detail=(
            f"Free chat limit reached ({settings.chat_rate_limit} messages per "
            f"{settings.chat_rate_window_minutes} minutes). "
            f"Try again in about {retry_minutes} minute{'s' if retry_minutes != 1 else ''}."
        ),
        headers={"Retry-After": str(retry_after)},
    )
