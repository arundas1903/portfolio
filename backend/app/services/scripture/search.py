import json
import re
from pathlib import Path

import httpx

DATA_DIR = Path(__file__).resolve().parents[3] / "data"


def _load_json(name: str) -> list[dict]:
    path = DATA_DIR / name
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _score_passage(passage: dict, terms: list[str]) -> int:
    haystack = " ".join(
        [
            passage.get("reference", ""),
            passage.get("text", ""),
            " ".join(passage.get("keywords", [])),
        ]
    ).lower()
    return sum(1 for term in terms if term in haystack)


async def search_bible(query: str, limit: int = 3) -> list[dict]:
    terms = [t.lower() for t in re.findall(r"[a-zA-Z']+", query) if len(t) > 2]
    passages = _load_json("bible_passages.json")
    ranked = sorted(passages, key=lambda p: _score_passage(p, terms), reverse=True)
    results = [p for p in ranked if _score_passage(p, terms) > 0][:limit]

    # Try live fetch if query looks like a reference (e.g. John 3:16)
    ref_match = re.search(
        r"\b([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+(?:-\d+)?)\b",
        query,
        re.IGNORECASE,
    )
    if ref_match:
        book, chapter, verse = ref_match.groups()
        ref = f"{book.strip()} {chapter}:{verse}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"https://bible-api.com/{ref}")
                if resp.status_code == 200:
                    data = resp.json()
                    live = {
                        "reference": data.get("reference", ref),
                        "text": data.get("text", "").strip(),
                        "tradition": "Christianity (Bible)",
                    }
                    if live["text"] and live not in results:
                        results = [live, *results[: limit - 1]]
        except httpx.HTTPError:
            pass

    return results[:limit]


async def search_quran(query: str, limit: int = 3) -> list[dict]:
    keyword = query.split()[0] if query.split() else query
    if len(keyword) < 3:
        keyword = query[:20]

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(
                f"https://api.alquran.cloud/v1/search/{keyword}/en.asad"
            )
            if resp.status_code != 200:
                return _fallback_quran(query, limit)

            data = resp.json()
            matches = data.get("data", {}).get("matches", [])[:limit]
            return [
                {
                    "reference": f"Quran {m['surah']['englishName']} ({m['surah']['number']}:{m['numberInSurah']})",
                    "text": m.get("text", "").strip(),
                    "tradition": "Islam (Quran)",
                }
                for m in matches
                if m.get("text")
            ]
    except httpx.HTTPError:
        return _fallback_quran(query, limit)


def _fallback_quran(query: str, limit: int) -> list[dict]:
    terms = [t.lower() for t in re.findall(r"[a-zA-Z']+", query) if len(t) > 2]
    passages = _load_json("quran_passages.json")
    ranked = sorted(passages, key=lambda p: _score_passage(p, terms), reverse=True)
    return [p for p in ranked if _score_passage(p, terms) > 0][:limit]


async def search_hindu(query: str, limit: int = 3) -> list[dict]:
    terms = [t.lower() for t in re.findall(r"[a-zA-Z']+", query) if len(t) > 2]
    passages = _load_json("hindu_passages.json")
    ranked = sorted(passages, key=lambda p: _score_passage(p, terms), reverse=True)
    results = [p for p in ranked if _score_passage(p, terms) > 0][:limit]
    return [
        {
            "reference": p["reference"],
            "text": p["text"],
            "tradition": p.get("tradition", "Hinduism"),
        }
        for p in results
    ]


async def search_all_traditions(query: str, limit_per_tradition: int = 2) -> list[dict]:
    bible = await search_bible(query, limit_per_tradition)
    quran = await search_quran(query, limit_per_tradition)
    hindu = await search_hindu(query, limit_per_tradition)
    return bible + quran + hindu
