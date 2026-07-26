from __future__ import annotations

import json
from typing import Any

from openai import AsyncOpenAI

from app.config import settings
from app.services.movies import database as db
from app.services.movies.tmdb import search_movie

ONBOARDING_SYSTEM = """You are Movie Discuss — a warm, conversational movie companion on a portfolio site.
The user is new. Your job is to learn their taste through natural conversation before recommending films.

Ask about:
- Favorite genres and moods (e.g. thriller, feel-good, sci-fi, romance)
- A few movies they loved recently and why
- Things they avoid (horror, slow burns, subtitles, etc.)

Keep replies under 120 words. Ask one focused question at a time.
When you have enough to understand their taste (usually after 2-4 exchanges), set onboarding_ready=true in your analysis.
Do not recommend specific new movies until onboarding is complete unless they explicitly ask.
"""

CHAT_SYSTEM = """You are Movie Discuss — an interactive movie companion that remembers this user's taste and past reviews.

Use the user profile and saved perspectives to personalize recommendations.
When they mention a movie they watched:
1. Acknowledge their take
2. Share a concise public/critic sentiment (from TMDB context when provided)
3. Invite them to compare their view with popular opinion

When recommending, suggest 1-3 titles with a short reason tied to their interests.
Keep replies conversational and under 180 words unless they ask for detail.
"""


async def _client() -> AsyncOpenAI:
    if not settings.openai_configured:
        raise ValueError("OPENAI_API_KEY is not configured")
    return AsyncOpenAI(api_key=settings.openai_api_key)


async def analyze_message(message: str, user: dict[str, Any]) -> dict[str, Any]:
    client = await _client()
    onboarding = not user["onboarding_complete"]
    response = await client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "Analyze the user's movie chat message. Return JSON with keys: "
                    "mentions_movie (bool), movie_query (string|null), "
                    "is_sharing_review (bool), user_take (string|null), "
                    "onboarding_ready (bool), extracted_interests (object|null). "
                    "extracted_interests may include genres, favorite_movies, moods, avoids arrays/strings."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "onboarding_mode": onboarding,
                        "current_interests": user.get("interests") or {},
                        "message": message,
                    }
                ),
            },
        ],
        temperature=0,
    )
    return json.loads(response.choices[0].message.content or "{}")


def _merge_interests(existing: dict[str, Any], extracted: dict[str, Any] | None) -> dict[str, Any]:
    if not extracted:
        return existing
    merged = dict(existing)
    for key, value in extracted.items():
        if value is None:
            continue
        if isinstance(value, list):
            prior = merged.get(key, [])
            if not isinstance(prior, list):
                prior = [prior]
            merged[key] = list(dict.fromkeys([*prior, *value]))
        else:
            merged[key] = value
    return merged


def _format_context(user: dict[str, Any], movie: dict[str, Any] | None, perspectives: list[dict[str, Any]]) -> str:
    parts = [
        f"User email: {user['email']}",
        f"Onboarding complete: {user['onboarding_complete']}",
        f"Interests: {json.dumps(user.get('interests') or {})}",
    ]

    if perspectives:
        parts.append("Saved perspectives:")
        for item in perspectives[:8]:
            parts.append(
                f"- {item['movie_title']} ({item.get('movie_year') or 'n/a'}): "
                f"user said '{item['user_take']}' | public: {item.get('public_review_summary') or 'n/a'}"
            )

    if movie:
        parts.append("TMDB movie context:")
        parts.append(json.dumps(movie, indent=2))

    return "\n".join(parts)


async def generate_reply(
    email: str,
    message: str,
    *,
    history: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    user = db.get_user(email)
    if not user:
        raise ValueError("User not found")

    analysis = await analyze_message(message, user)
    movie = None
    saved_perspective = None

    if analysis.get("mentions_movie") and analysis.get("movie_query"):
        try:
            movie = await search_movie(str(analysis["movie_query"]))
        except Exception:
            movie = None

    if movie and analysis.get("is_sharing_review") and analysis.get("user_take"):
        review_bits = [
            review.get("excerpt", "")
            for review in movie.get("public_reviews") or []
            if review.get("excerpt")
        ]
        public_summary = review_bits[0] if review_bits else (movie.get("overview") or "")[:280]
        db.save_perspective(
            email,
            movie_title=movie.get("title") or str(analysis["movie_query"]),
            movie_year=movie.get("year"),
            tmdb_id=movie.get("id"),
            user_take=str(analysis["user_take"]),
            public_review_summary=public_summary,
        )
        saved_perspective = movie.get("title")

    extracted = analysis.get("extracted_interests")
    onboarding_ready = bool(analysis.get("onboarding_ready"))
    if extracted or (onboarding_ready and not user["onboarding_complete"]):
        merged = _merge_interests(user.get("interests") or {}, extracted if isinstance(extracted, dict) else None)
        complete = user["onboarding_complete"] or onboarding_ready
        user = db.update_user_interests(email, merged, onboarding_complete=complete)

    perspectives = db.list_perspectives(email)
    system = ONBOARDING_SYSTEM if not user["onboarding_complete"] else CHAT_SYSTEM
    context = _format_context(user, movie, perspectives)

    client = await _client()
    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    if history:
        messages.extend(history[-8:])
    messages.append(
        {
            "role": "user",
            "content": f"Context:\n{context}\n\nUser message:\n{message}",
        }
    )

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=messages,
        temperature=0.65,
    )

    reply = (response.choices[0].message.content or "").strip()

    return {
        "reply": reply,
        "onboarding_complete": user["onboarding_complete"],
        "interests": user.get("interests") or {},
        "saved_perspective": saved_perspective,
        "movie_context": movie.get("title") if movie else None,
    }
