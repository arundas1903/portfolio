from __future__ import annotations

import json

from openai import AsyncOpenAI

from app.config import settings
from a2p_regulatory.guidance import build_onboarding_guidance, format_country_summary
from a2p_regulatory.store import get_store

SYSTEM_PROMPT = """You are A2P Regulatory Intel — an expert assistant for global A2P SMS onboarding.
You help product managers, solution architects, and compliance teams understand sender-channel
support, registration requirements, and launch steps across 190+ countries.

Rules:
- Ground answers in the regulatory context provided below.
- Be practical: mention registration lead times, alternative channels, and pilot recommendations.
- If the context does not cover a question, say so and suggest verifying with the CPaaS provider.
- Keep replies concise (under 220 words unless the user asks for a detailed checklist).
- Use bullet points for multi-step guidance.
"""


async def classify_a2p_query(message: str) -> dict:
    if not settings.openai_configured:
        raise ValueError("OPENAI_API_KEY is not configured")

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "Classify the user message about A2P SMS regulations. Return JSON with keys: "
                    "is_a2p (boolean), confidence (0-1 float), countries (array of ISO-2 codes or "
                    "country names mentioned), channel (alphanumeric|shortCode|longCode|tollFree|null), "
                    "needs_checklist (boolean)."
                ),
            },
            {"role": "user", "content": message},
        ],
        temperature=0,
    )

    content = response.choices[0].message.content or "{}"
    return json.loads(content)


def build_regulatory_context(message: str, countries_hint: list[str] | None = None) -> str:
    store = get_store()
    selected = []

    if countries_hint:
        for hint in countries_hint:
            record = store.lookup(hint)
            if record:
                selected.append(record)

    if not selected:
        selected = store.extract_countries_from_text(message)

    if not selected:
        stats = store.stats()
        return (
            f"Dataset covers {stats['country_count']} countries. "
            "No specific country was detected in the message — answer at a general A2P SMS level "
            "or ask which market they are launching in."
        )

    blocks = [format_country_summary(country) for country in selected[:3]]
    return "\n\n---\n\n".join(blocks)


async def generate_a2p_response(message: str, classification: dict) -> str:
    if not settings.openai_configured:
        raise ValueError("OPENAI_API_KEY is not configured")

    store = get_store()
    countries_hint = classification.get("countries") or []
    channel = classification.get("channel")
    context = build_regulatory_context(message, countries_hint)

    checklist = ""
    if classification.get("needs_checklist") and countries_hint and channel:
        record = store.lookup(str(countries_hint[0]))
        if record and channel in {"alphanumeric", "shortCode", "longCode", "tollFree"}:
            try:
                checklist = build_onboarding_guidance(record, channel, message)
            except ValueError:
                checklist = ""

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"User question:\n{message}\n\n"
                    f"Regulatory context:\n{context}\n\n"
                    + (f"Onboarding checklist draft:\n{checklist}\n\n" if checklist else "")
                    + "Reply to the user."
                ),
            },
        ],
        temperature=0.35,
    )

    return (response.choices[0].message.content or "").strip()
