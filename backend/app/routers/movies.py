from fastapi import APIRouter, Depends, Header, HTTPException, Request

from app.dependencies import get_client_ip, require_movie_rate_limit
from app.models import (
    MovieChatRequest,
    MovieChatResponse,
    MovieSessionStartRequest,
    MovieSessionStartResponse,
    MovieStatusResponse,
    MovieUserProfile,
)
from app.services.movies import database as db
from app.services.movies.auth import start_session
from app.services.movies.intelligence import generate_reply
from app.services.movies.sessions import verify_session_token

router = APIRouter(prefix="/api/movies", tags=["movies"])


def get_movie_email(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")
    token = authorization.split(" ", 1)[1].strip()
    email = verify_session_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    return email


@router.post("/session/start", response_model=MovieSessionStartResponse)
async def movies_session_start(body: MovieSessionStartRequest, request: Request) -> MovieSessionStartResponse:
    token, user, error = start_session(
        body.email,
        ip=get_client_ip(request),
        client_id=body.client_id.strip(),
    )
    if error or not token or not user:
        raise HTTPException(status_code=403, detail=error or "Could not start session")

    return MovieSessionStartResponse(
        token=token,
        user=MovieUserProfile(**user),
    )


@router.get("/me", response_model=MovieStatusResponse)
async def movies_me(email: str = Depends(get_movie_email)) -> MovieStatusResponse:
    user = db.get_user(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return MovieStatusResponse(user=MovieUserProfile(**user))


@router.post("/chat", response_model=MovieChatResponse)
async def movies_chat(
    body: MovieChatRequest,
    email: str = Depends(get_movie_email),
    _: None = Depends(require_movie_rate_limit),
) -> MovieChatResponse:
    try:
        result = await generate_reply(
            email,
            body.message,
            history=[{"role": item.role, "content": item.content} for item in body.history],
        )
    except ValueError as exc:
        detail = str(exc)
        status = 503 if "OPENAI_API_KEY" in detail else 500
        raise HTTPException(status_code=status, detail=detail) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Movie chat failed: {exc}") from exc

    return MovieChatResponse(
        reply=result["reply"],
        onboarding_complete=result["onboarding_complete"],
        interests=result.get("interests") or {},
        saved_perspective=result.get("saved_perspective"),
        movie_context=result.get("movie_context"),
    )
