import re
import secrets
from fastapi import Depends, Header, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.services.rate_limit import SlidingWindowRateLimiter

assistant_rate_limiter = SlidingWindowRateLimiter(max_requests=20, window_seconds=30 * 60)
url_strength_rate_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=24 * 60 * 60)
unlock_rate_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=15 * 60)
_task_bearer = HTTPBearer(auto_error=False)

FLOW_BUILDER_EMAIL_HEADER = "X-Flow-Builder-Email"
_OWNER_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


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

    if not x_chat_password or not secrets.compare_digest(
        x_chat_password, settings.chat_access_password
    ):
        raise HTTPException(status_code=401, detail="Invalid or missing chat password")


def chat_password_valid(x_chat_password: str | None) -> bool:
    if not settings.chat_password_required:
        return True
    if not x_chat_password:
        return False
    return secrets.compare_digest(x_chat_password, settings.chat_access_password)


def normalize_owner_email(email: str | None) -> str:
    return (email or "").strip().lower()


def is_valid_owner_email(email: str | None) -> bool:
    normalized = normalize_owner_email(email)
    return 5 <= len(normalized) <= 254 and bool(_OWNER_EMAIL_RE.match(normalized))


def flow_builder_access_valid(
    x_chat_password: str | None,
    x_flow_builder_email: str | None,
) -> bool:
    if not is_valid_owner_email(x_flow_builder_email):
        return False
    return chat_password_valid(x_chat_password)


async def require_flow_builder_owner(
    x_chat_password: str | None = Header(default=None, alias="X-Chat-Password"),
    x_flow_builder_email: str | None = Header(default=None, alias=FLOW_BUILDER_EMAIL_HEADER),
) -> str:
    if settings.chat_password_required and not chat_password_valid(x_chat_password):
        raise HTTPException(status_code=401, detail="Invalid or missing chat password")

    owner_email = normalize_owner_email(x_flow_builder_email)
    if not is_valid_owner_email(owner_email):
        raise HTTPException(status_code=401, detail="Invalid or missing owner email")

    return owner_email


async def require_faith_rate_limit(request: Request) -> None:
    await _require_assistant_rate_limit("faith-discuss", get_client_ip(request))


async def require_a2p_rate_limit(request: Request) -> None:
    await _require_assistant_rate_limit("a2p-regulatory", get_client_ip(request))


def _url_strength_rate_key(request: Request) -> str:
    return f"url-strength:{get_client_ip(request)}"


def peek_url_strength_limits(request: Request) -> tuple[int, int, int]:
    url_strength_rate_limiter.max_requests = settings.url_strength_daily_limit
    url_strength_rate_limiter.window_seconds = settings.url_strength_window_seconds
    remaining, retry_after = url_strength_rate_limiter.peek(_url_strength_rate_key(request))
    return settings.url_strength_daily_limit, remaining, retry_after


async def require_unlock_rate_limit(request: Request) -> None:
    unlock_rate_limiter.max_requests = settings.chat_unlock_rate_limit
    unlock_rate_limiter.window_seconds = settings.chat_unlock_window_seconds
    allowed, _, retry_after = unlock_rate_limiter.consume(f"unlock:{get_client_ip(request)}")
    if allowed:
        return

    retry_minutes = max(1, (retry_after + 59) // 60)
    raise HTTPException(
        status_code=429,
        detail=(
            f"Too many unlock attempts ({settings.chat_unlock_rate_limit} per "
            f"{settings.chat_unlock_window_minutes} minutes). "
            f"Try again in about {retry_minutes} minute(s)."
        ),
        headers={"Retry-After": str(retry_after)},
    )


async def require_url_strength_rate_limit(request: Request) -> None:
    url_strength_rate_limiter.max_requests = settings.url_strength_daily_limit
    url_strength_rate_limiter.window_seconds = settings.url_strength_window_seconds
    allowed, _, retry_after = url_strength_rate_limiter.consume(_url_strength_rate_key(request))
    if allowed:
        return

    limit = settings.url_strength_daily_limit
    retry_hours = max(1, (retry_after + 3599) // 3600)
    raise HTTPException(
        status_code=429,
        detail=(
            f"Daily URL analysis limit reached ({limit} per day for this personal demo). "
            f"Try again in about {retry_hours} hour(s)."
        ),
        headers={"Retry-After": str(retry_after)},
    )


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


async def get_task_user_email(
    credentials: HTTPAuthorizationCredentials | None = Depends(_task_bearer),
) -> str:
    from app.services.tasks import database as task_db
    from app.services.tasks.auth import verify_session_token

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authentication required.")

    email = verify_session_token(credentials.credentials)
    if not email:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")

    user = task_db.get_user(email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    return email
