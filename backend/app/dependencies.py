from fastapi import Header, HTTPException, Request

from app.config import settings
from app.services.rate_limit import SlidingWindowRateLimiter

assistant_rate_limiter = SlidingWindowRateLimiter(max_requests=20, window_seconds=30 * 60)


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _rate_limit_settings() -> tuple[int, int]:
    return settings.chat_rate_limit, settings.chat_rate_window_seconds


def peek_assistant_limits(assistant_id: str, subject: str) -> tuple[int, int]:
    limit, window_seconds = _rate_limit_settings()
    assistant_rate_limiter.max_requests = limit
    assistant_rate_limiter.window_seconds = window_seconds
    return assistant_rate_limiter.peek(f"{assistant_id}:{subject}")


def consume_assistant_limit(assistant_id: str, subject: str) -> tuple[bool, int, int]:
    limit, window_seconds = _rate_limit_settings()
    assistant_rate_limiter.max_requests = limit
    assistant_rate_limiter.window_seconds = window_seconds
    return assistant_rate_limiter.consume(f"{assistant_id}:{subject}")


async def require_chat_password(
    x_chat_password: str | None = Header(default=None, alias="X-Chat-Password"),
) -> None:
    if not settings.chat_password_required:
        return

    if not x_chat_password or x_chat_password != settings.chat_access_password:
        raise HTTPException(status_code=401, detail="Invalid or missing chat password")


async def require_faith_rate_limit(request: Request) -> None:
    await _require_assistant_rate_limit("faith-discuss", get_client_ip(request))


async def require_a2p_rate_limit(request: Request) -> None:
    await _require_assistant_rate_limit("a2p-regulatory", get_client_ip(request))


async def require_movie_rate_limit(
    request: Request,
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> None:
    from app.services.movies.sessions import verify_session_token

    subject = get_client_ip(request)
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        email = verify_session_token(token)
        if email:
            subject = email

    await _require_assistant_rate_limit("movie-discuss", subject)


async def _require_assistant_rate_limit(assistant_id: str, subject: str) -> None:
    allowed, _, retry_after = consume_assistant_limit(assistant_id, subject)
    if allowed:
        return

    _, window_seconds = _rate_limit_settings()
    window_minutes = window_seconds // 60
    retry_minutes = max(1, (retry_after + 59) // 60)
    limit, _ = _rate_limit_settings()
    raise HTTPException(
        status_code=429,
        detail=(
            f"Message limit reached ({limit} messages per {window_minutes} minutes for this assistant). "
            f"Try again in about {retry_minutes} minute(s)."
        ),
        headers={"Retry-After": str(retry_after)},
    )
