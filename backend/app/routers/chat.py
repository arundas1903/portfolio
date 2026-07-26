from fastapi import APIRouter, HTTPException

from app.models import ChatRequest, ChatResponse, SourceCitation
from app.services.chat import classify_message, generate_scripture_response
from app.services.scripture.search import search_all_traditions

router = APIRouter(prefix="/api", tags=["chat"])


OFF_TOPIC_REPLY = (
    "I'm here to discuss questions related to religion and spirituality, drawing from "
    "the Bible, Quran, and Hindu scriptures. Try asking about topics like prayer, "
    "compassion, purpose, forgiveness, or what these traditions teach on a subject."
)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    try:
        classification = await classify_message(request.message)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
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
