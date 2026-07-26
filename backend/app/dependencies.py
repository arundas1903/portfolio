from fastapi import Header, HTTPException, Request

from app.config import settings
from app.services.rate_limit import SlidingWindowRateLimiter, chat_rate_limiter


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


movie_chat_rate_limiter = SlidingWindowRateLimiter(max_requests=30, window_seconds=30 * 60)


async def require_movie_rate_limit(
    request: Request,
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> None:
    from app.services.movies.sessions import verify_session_token

    movie_chat_rate_limiter.max_requests = settings.movie_chat_rate_limit
    movie_chat_rate_limiter.window_seconds = settings.movie_chat_rate_window_seconds

    rate_key = get_client_ip(request)
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        email = verify_session_token(token)
        if email:
            rate_key = f"movie:{email}"

    allowed, _, retry_after = movie_chat_rate_limiter.consume(rate_key)
    if allowed:
        return

    retry_minutes = max(1, (retry_after + 59) // 60)
    raise HTTPException(
        status_code=429,
        detail=(
            f"Message limit reached ({settings.movie_chat_rate_limit} messages per "
            f"{settings.movie_chat_rate_window_minutes} minutes). "
            f"Try again in about {retry_minutes} minute(s)."
        ),
        headers={"Retry-After": str(retry_after)},
    )
