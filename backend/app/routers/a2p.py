from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import require_chat_password, require_chat_rate_limit
from app.models import A2PChatRequest, A2PChatResponse, A2PCountryResponse, A2PStatsResponse
from app.services.a2p.intelligence import classify_a2p_query, generate_a2p_response
from a2p_regulatory.guidance import format_country_summary
from a2p_regulatory.store import get_store

router = APIRouter(prefix="/api/a2p", tags=["a2p"])

OFF_TOPIC_REPLY = (
    "I focus on A2P SMS regulatory intelligence — country support, sender channels, registration, "
    "and onboarding. Try asking about alphanumeric sender IDs in Brazil, which countries require "
    "short-code registration, or how to launch OTP traffic in Germany."
)


@router.get("/stats", response_model=A2PStatsResponse)
async def a2p_stats() -> A2PStatsResponse:
    stats = get_store().stats()
    return A2PStatsResponse(**stats)


@router.get("/countries/{query}", response_model=A2PCountryResponse)
async def a2p_country(query: str) -> A2PCountryResponse:
    country = get_store().lookup(query)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return A2PCountryResponse(
        country=country.to_dict(),
        summary=format_country_summary(country),
    )


@router.post("/chat", response_model=A2PChatResponse)
async def a2p_chat(
    request: A2PChatRequest,
    _: None = Depends(require_chat_password),
    __: None = Depends(require_chat_rate_limit),
) -> A2PChatResponse:
    try:
        classification = await classify_a2p_query(request.message)
    except ValueError as exc:
        detail = str(exc)
        status = 503 if "OPENAI_API_KEY" in detail else 500
        raise HTTPException(status_code=status, detail=detail) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Classification failed: {exc}") from exc

    is_a2p = bool(classification.get("is_a2p"))
    confidence = float(classification.get("confidence", 0))

    if not is_a2p or confidence < 0.55:
        return A2PChatResponse(is_a2p=False, reply=OFF_TOPIC_REPLY, countries=[])

    countries = [str(item) for item in classification.get("countries") or []]

    try:
        reply = await generate_a2p_response(request.message, classification)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Response generation failed: {exc}") from exc

    return A2PChatResponse(is_a2p=True, reply=reply, countries=countries)
