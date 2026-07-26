import json

from openai import OpenAI

from app.config import settings


def get_client() -> OpenAI:
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not configured")
    return OpenAI(api_key=settings.openai_api_key)


async def classify_message(message: str) -> dict:
    client = get_client()

    response = client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You classify user messages for a multi-faith scripture chat app. "
                    "Return JSON with keys: is_religious (boolean), confidence (0-1), "
                    "search_query (short keywords for scripture search), "
                    "reason (brief explanation). "
                    "Mark is_religious true for questions about God, faith, morality from "
                    "religious perspective, rituals, afterlife, prayer, specific religions, "
                    "scriptures, prophets, spiritual practices, or comparative religion."
                ),
            },
            {"role": "user", "content": message},
        ],
        temperature=0,
    )

    content = response.choices[0].message.content or "{}"
    return json.loads(content)


async def generate_scripture_response(message: str, passages: list[dict]) -> str:
    client = get_client()

    if not passages:
        return (
            "Your question appears to be about faith, but I couldn't find closely matching "
            "passages in the Bible, Quran, or Hindu scriptures I searched. "
            "Try rephrasing with specific topics like forgiveness, charity, prayer, or duty."
        )

    context = "\n\n".join(
        f"[{p.get('tradition', 'Scripture')} — {p['reference']}]\n{p['text']}"
        for p in passages
    )

    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a respectful multi-faith discussion assistant. "
                    "Answer ONLY using the provided scripture passages. "
                    "Compare perspectives across traditions when relevant. "
                    "Always cite the tradition and reference inline, e.g. (Bible, John 3:16). "
                    "Do not invent verses. If passages disagree, present each view neutrally. "
                    "Be concise, warm, and non-judgmental."
                ),
            },
            {
                "role": "user",
                "content": f"Question: {message}\n\nScripture passages:\n{context}",
            },
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content or "I couldn't generate a response."
