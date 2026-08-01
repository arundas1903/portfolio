from __future__ import annotations

import json

from openai import AsyncOpenAI

from app.config import settings
from app.services.url_strength.fetcher import FetchedPage
from app.services.url_strength.signals import collect_url_signals


def _fallback_analysis(page: FetchedPage, signals: dict) -> dict:
    spam_flags = signals.get("spam_flags") or []
    domain_age = signals.get("domain_info", {}).get("domain_age_days")
    risk = "low"
    reasons = []

    if domain_age is not None and domain_age < 30:
        risk = "medium"
        reasons.append(f"Domain is only {domain_age} days old.")

    if spam_flags:
        risk = "high" if len(spam_flags) >= 2 else "medium"
        reasons.extend(spam_flags[:4])

    if page.has_login_form and urlparse_scheme_is_http(page.final_url):
        risk = "medium" if risk == "low" else risk
        reasons.append("Login form served without HTTPS.")

    if not reasons:
        reasons.append("No major heuristic risk flags were detected.")

    return {
        "risk_level": risk,
        "summary": (
            "Heuristic scan completed without AI. Review the technical signals and treat this "
            "as guidance, not a guarantee of safety."
        ),
        "reasons": reasons,
        "content_assessment": signals.get("text_excerpt", "")[:280] or "No readable page text found.",
        "recommendation": "Use caution with unfamiliar links, especially if they ask for credentials.",
        "source": "heuristic",
        "ai_tokens": 0,
        "prompt_tokens": 0,
        "completion_tokens": 0,
    }


def urlparse_scheme_is_http(url: str) -> bool:
    return url.lower().startswith("http://")


async def analyze_url_strength(page: FetchedPage, *, use_ai: bool = False) -> dict:
    signals = await collect_url_signals(page)

    if not use_ai or not settings.openai_configured:
        result = _fallback_analysis(page, signals)
        return {**result, **signals}

    prompt_payload = {
        "input_url": page.input_url,
        "final_url": page.final_url,
        "redirect_count": page.redirect_count,
        "status_code": page.status_code,
        "title": page.title,
        "meta_description": page.meta_description,
        "has_login_form": page.has_login_form,
        "domain_info": signals["domain_info"],
        "technologies": signals["technologies"],
        "spam_flags": signals["spam_flags"],
        "text_excerpt": signals["text_excerpt"],
    }

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You assess website trust and spam/phishing risk for a public URL checker. "
                    "Use only the provided technical signals and page excerpt — do not claim certainty. "
                    "Return JSON with keys: risk_level (low|medium|high), summary (2-3 sentences), "
                    "reasons (array of short bullet strings explaining the score), "
                    "content_assessment (what the page appears to be about), "
                    "recommendation (one practical sentence for the visitor). "
                    "Weight very new domains, credential forms on mismatched brands, spam language, "
                    "and missing HTTPS heavily. Never say a site is 100% safe."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(prompt_payload, ensure_ascii=True),
            },
        ],
        temperature=0.2,
    )

    usage = response.usage
    prompt_tokens = int(usage.prompt_tokens or 0) if usage else 0
    completion_tokens = int(usage.completion_tokens or 0) if usage else 0
    ai_tokens = prompt_tokens + completion_tokens

    parsed = json.loads(response.choices[0].message.content or "{}")
    risk_level = str(parsed.get("risk_level", "medium")).lower()
    if risk_level not in {"low", "medium", "high"}:
        risk_level = "medium"

    reasons = [str(item).strip() for item in (parsed.get("reasons") or []) if str(item).strip()][:8]
    if not reasons:
        reasons = ["Review the technical signals below before trusting this link."]

    return {
        "risk_level": risk_level,
        "summary": str(parsed.get("summary", "")).strip() or "Analysis complete.",
        "reasons": reasons,
        "content_assessment": str(parsed.get("content_assessment", "")).strip() or "No assessment.",
        "recommendation": str(parsed.get("recommendation", "")).strip() or "Proceed with caution.",
        "source": "openai",
        "ai_tokens": ai_tokens,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        **signals,
    }
