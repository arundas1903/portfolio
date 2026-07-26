from __future__ import annotations

from typing import Any

import httpx

from app.config import settings


async def search_movie(query: str) -> dict[str, Any] | None:
    if not settings.tmdb_api_key:
        return None

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            "https://api.themoviedb.org/3/search/movie",
            params={"api_key": settings.tmdb_api_key, "query": query, "include_adult": "false"},
        )
        response.raise_for_status()
        results = response.json().get("results") or []
        if not results:
            return None
        top = results[0]
        movie_id = top.get("id")
        details = await _movie_details(client, movie_id)
        return details


async def _movie_details(client: httpx.AsyncClient, movie_id: int) -> dict[str, Any]:
    movie_resp = await client.get(
        f"https://api.themoviedb.org/3/movie/{movie_id}",
        params={"api_key": settings.tmdb_api_key},
    )
    movie_resp.raise_for_status()
    movie = movie_resp.json()

    reviews_resp = await client.get(
        f"https://api.themoviedb.org/3/movie/{movie_id}/reviews",
        params={"api_key": settings.tmdb_api_key},
    )
    reviews_resp.raise_for_status()
    reviews = reviews_resp.json().get("results") or []

    public_reviews = []
    for review in reviews[:3]:
        content = (review.get("content") or "").strip()
        if content:
            public_reviews.append(
                {
                    "author": review.get("author", "Reviewer"),
                    "excerpt": content[:400] + ("…" if len(content) > 400 else ""),
                }
            )

    return {
        "id": movie.get("id"),
        "title": movie.get("title"),
        "year": (movie.get("release_date") or "")[:4] or None,
        "overview": movie.get("overview") or "",
        "vote_average": movie.get("vote_average"),
        "genres": [genre.get("name") for genre in movie.get("genres") or [] if genre.get("name")],
        "public_reviews": public_reviews,
    }
