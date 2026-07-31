from __future__ import annotations

import json
import re

from openai import AsyncOpenAI

from app.config import settings

TRANSACTION_KEYWORDS = re.compile(
    r"\b(transaction|payment|paid|debited|credited|transfer|purchase|withdrawn|deposit|upi|txn)\b",
    re.IGNORECASE,
)
AMOUNT_PATTERN = re.compile(
    r"(?:₹|rs\.?|inr|rupees?)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:₹|rs\.?|inr|rupees?)",
    re.IGNORECASE,
)


def _parse_amount(raw: str) -> float:
    return float(raw.replace(",", ""))


def classify_message_fallback(message_body: str) -> dict:
    trimmed = message_body.strip()
    amount: float | None = None
    match = AMOUNT_PATTERN.search(trimmed)
    if match:
        amount = _parse_amount(match.group(1) or match.group(2))
    elif TRANSACTION_KEYWORDS.search(trimmed):
        number_match = re.search(r"\b([\d,]+(?:\.\d+)?)\b", trimmed)
        if number_match:
            amount = _parse_amount(number_match.group(1))

    is_transaction = amount is not None and (
        bool(TRANSACTION_KEYWORDS.search(trimmed)) or bool(AMOUNT_PATTERN.search(trimmed))
    )

    return {
        "is_transaction": is_transaction,
        "amount": amount,
        "confidence": 0.55 if is_transaction else 0.35,
        "reason": "Heuristic classification (OpenAI unavailable).",
    }


async def classify_transaction_message(message_body: str) -> dict:
    trimmed = message_body.strip()
    if not trimmed:
        return {
            "is_transaction": False,
            "amount": None,
            "confidence": 1.0,
            "reason": "Message body is empty.",
        }

    if not settings.openai_configured:
        return classify_message_fallback(trimmed)

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "Classify whether an SMS/notification is a financial transaction alert. "
                    "Return JSON with keys: is_transaction (boolean), amount (number|null — "
                    "transaction amount in rupees if present), confidence (0-1 float), "
                    "reason (short string). Transaction messages mention payments, debits, "
                    "credits, transfers, purchases, or UPI with a monetary amount. "
                    "Marketing, OTP, reminders without amounts, and generic alerts are not transactions."
                ),
            },
            {"role": "user", "content": trimmed},
        ],
        temperature=0,
    )

    content = response.choices[0].message.content or "{}"
    parsed = json.loads(content)

    amount = parsed.get("amount")
    if amount is not None:
        try:
            amount = float(amount)
            if amount < 0:
                amount = None
        except (TypeError, ValueError):
            amount = None

    is_transaction = bool(parsed.get("is_transaction")) and amount is not None

    return {
        "is_transaction": is_transaction,
        "amount": amount,
        "confidence": float(parsed.get("confidence", 0.0)),
        "reason": str(parsed.get("reason", "AI classification.")).strip() or "AI classification.",
    }
