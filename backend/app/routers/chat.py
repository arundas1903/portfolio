import secrets

from fastapi import APIRouter, Depends, HTTPException, Request

from app.config import settings
from app.dependencies import get_client_ip, require_chat_password, require_faith_rate_limit, require_unlock_rate_limit
from app.models import (
    ChatLimitsResponse,
    ChatRequest,
    ChatResponse,
    SourceCitation,
    UnlockRequest,
    UnlockResponse,
)
from app.services.chat import classify_message, generate_scripture_response
from app.services.scripture.search import search_all_traditions

router = APIRouter(prefix="/api", tags=["chat"])


OFF_TOPIC_REPLY = (
    "I'm here to discuss questions related to religion and spirituality, drawing from "
    "the Bible, Quran, and Hindu scriptures. Try asking about topics like prayer, "
    "compassion, purpose, forgiveness, or what these traditions teach on a subject."
)


@router.get("/chat/access", response_model=UnlockResponse)
async def chat_access_status() -> UnlockResponse:
    return UnlockResponse(unlocked=not settings.chat_password_required, required=settings.chat_password_required)


@router.post("/chat/unlock", response_model=UnlockResponse)
async def unlock_chat(
    request: UnlockRequest,
    _: None = Depends(require_unlock_rate_limit),
) -> UnlockResponse:
    if not settings.chat_password_required:
        return UnlockResponse(unlocked=True, required=False)

    if not secrets.compare_digest(request.password, settings.chat_access_password):
        raise HTTPException(status_code=401, detail="Incorrect password")

    return UnlockResponse(unlocked=True, required=True)


@router.get("/chat/limits", response_model=ChatLimitsResponse)
async def chat_limits(request: Request) -> ChatLimitsResponse:
    from app.dependencies import peek_assistant_limits

    remaining, retry_after = peek_assistant_limits("faith-discuss", get_client_ip(request))
    return ChatLimitsResponse(
        limit=settings.chat_rate_limit,
        window_minutes=settings.chat_rate_window_minutes,
        remaining=remaining,
        retry_after_seconds=retry_after,
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    _: None = Depends(require_chat_password),
    __: None = Depends(require_faith_rate_limit),
) -> ChatResponse:
    try:
        classification = await classify_message(request.message)
    except ValueError as exc:
        detail = str(exc)
        status = 503 if "OPENAI_API_KEY" in detail else 500
        raise HTTPException(status_code=status, detail=detail) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Classification failed: {exc}") from exc

    is_religious = bool(classification.get("is_religious"))
    confidence = float(classification.get("confidence", 0))

    if not is_religious or confidence < 0.55:
        return ChatResponse(
            is_religious=False,
            reply=OFF_TOPIC_REPLY,
            sources=[],
            traditions_searched=[],
        )

    search_query = classification.get("search_query") or request.message

    try:
        passages = await search_all_traditions(search_query)
        reply = await generate_scripture_response(request.message, passages)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Response generation failed: {exc}") from exc

    sources = [
        SourceCitation(
            tradition=p.get("tradition", "Scripture"),
            reference=p["reference"],
            text=p["text"],
        )
        for p in passages
    ]

    traditions = sorted({s.tradition for s in sources})

    return ChatResponse(
        is_religious=True,
        reply=reply,
        sources=sources,
        traditions_searched=traditions,
    )
