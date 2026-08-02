import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from openai import OpenAIError

from app.config import settings
from app.dependencies import (
    chat_password_valid,
    peek_url_strength_limits,
    require_url_strength_rate_limit,
)
from app.models import (
    UrlStrengthAnalyzeRequest,
    UrlStrengthAnalyzeResponse,
    UrlStrengthLimitsResponse,
    UrlStrengthSignalItem,
)
from app.services.url_strength.analyzer import analyze_url_strength
from app.services.url_strength.fetcher import UrlFetchError, fetch_page

router = APIRouter(prefix="/api/url-strength", tags=["url-strength"])


@router.get("/limits", response_model=UrlStrengthLimitsResponse)
async def url_strength_limits(
    request: Request,
    x_chat_password: str | None = Header(default=None, alias="X-Chat-Password"),
) -> UrlStrengthLimitsResponse:
    limit, remaining, retry_after = peek_url_strength_limits(request)
    return UrlStrengthLimitsResponse(
        limit=limit,
        remaining=remaining,
        retry_after_seconds=retry_after,
        ai_unlocked=chat_password_valid(x_chat_password),
    )


async def _analyze_url_impl(
    body: UrlStrengthAnalyzeRequest,
    x_chat_password: str | None,
) -> UrlStrengthAnalyzeResponse:
    use_ai = body.use_ai
    if use_ai:
        if not chat_password_valid(x_chat_password):
            raise HTTPException(
                status_code=401,
                detail="Valid access password required for AI analysis.",
            )
        if not settings.openai_configured:
            raise HTTPException(
                status_code=503,
                detail="AI analysis is not available right now.",
            )

    try:
        page = await fetch_page(body.url)
        result = await analyze_url_strength(page, use_ai=use_ai)
    except UrlFetchError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except OpenAIError as exc:
        raise HTTPException(status_code=503, detail=f"AI analysis failed: {exc}") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=422, detail=f"Could not fetch that URL: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc

    domain_info = result.get("domain_info") or {}
    return UrlStrengthAnalyzeResponse(
        input_url=page.input_url,
        final_url=page.final_url,
        risk_level=result["risk_level"],
        summary=result["summary"],
        reasons=result["reasons"],
        content_assessment=result["content_assessment"],
        recommendation=result["recommendation"],
        technologies=result.get("technologies") or [],
        technical_signals=[
            UrlStrengthSignalItem(**item) for item in (result.get("technical_signals") or [])
        ],
        spam_flags=result.get("spam_flags") or [],
        domain=str(domain_info.get("domain") or ""),
        domain_age_days=domain_info.get("domain_age_days"),
        domain_registered_at=domain_info.get("registered_at"),
        source=result.get("source") or "unknown",
        ai_tokens=int(result.get("ai_tokens") or 0),
        prompt_tokens=int(result.get("prompt_tokens") or 0),
        completion_tokens=int(result.get("completion_tokens") or 0),
    )


@router.post(
    "/analyze",
    response_model=UrlStrengthAnalyzeResponse,
    summary="Analyze a URL for trust and spam signals",
)
async def analyze_url(
    body: UrlStrengthAnalyzeRequest,
    request: Request,
    x_chat_password: str | None = Header(default=None, alias="X-Chat-Password"),
    _: None = Depends(require_url_strength_rate_limit),
) -> UrlStrengthAnalyzeResponse:
    return await _analyze_url_impl(body, x_chat_password)


@router.post(
    "/analyse",
    response_model=UrlStrengthAnalyzeResponse,
    summary="Analyze a URL for trust and spam signals (UK spelling alias)",
    include_in_schema=False,
)
async def analyse_url(
    body: UrlStrengthAnalyzeRequest,
    request: Request,
    x_chat_password: str | None = Header(default=None, alias="X-Chat-Password"),
    _: None = Depends(require_url_strength_rate_limit),
) -> UrlStrengthAnalyzeResponse:
    return await _analyze_url_impl(body, x_chat_password)
