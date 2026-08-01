from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlparse

from app.services.url_strength.fetcher import FetchedPage, page_text_excerpt
from app.services.url_strength.rdap import lookup_domain_registration


async def lookup_domain_age_days(hostname: str) -> dict[str, Any]:
    return await lookup_domain_registration(hostname)


def detect_technologies(page: FetchedPage) -> list[str]:
    html_lower = page.html.lower()
    headers = page.headers
    detected: list[str] = []

    def add(label: str) -> None:
        if label not in detected:
            detected.append(label)

    server = headers.get("server", "")
    if server:
        add(f"Server: {server.split('/')[0][:40]}")

    powered_by = headers.get("x-powered-by", "")
    if powered_by:
        add(f"X-Powered-By: {powered_by[:40]}")

    if "cloudflare" in server.lower() or "cf-ray" in headers:
        add("Cloudflare")
    if "wp-content" in html_lower or "wordpress" in html_lower:
        add("WordPress")
    if "__next_data__" in html_lower:
        add("Next.js")
    if "react" in html_lower and ("react-dom" in html_lower or "_react" in html_lower):
        add("React")
    if "shopify" in html_lower:
        add("Shopify")
    if "wix.com" in html_lower:
        add("Wix")
    if "squarespace" in html_lower:
        add("Squarespace")
    if "bootstrap" in html_lower:
        add("Bootstrap")
    if "google-analytics.com" in html_lower or "googletagmanager.com" in html_lower:
        add("Google Analytics")

    return detected[:12]


def build_technical_signals(page: FetchedPage, domain_info: dict[str, Any]) -> list[dict[str, str]]:
    parsed = urlparse(page.final_url)
    hostname = parsed.hostname or ""
    signals: list[dict[str, str]] = [
        {
            "name": "Final URL",
            "value": page.final_url,
            "detail": f"{page.redirect_count} redirect(s)" if page.redirect_count else "No redirects",
        },
        {
            "name": "HTTP status",
            "value": str(page.status_code),
            "detail": "Homepage response code",
        },
        {
            "name": "HTTPS",
            "value": "Yes" if parsed.scheme == "https" else "No",
            "detail": "Transport encryption on final URL",
        },
    ]

    age_days = domain_info.get("domain_age_days")
    if age_days is None:
        signals.append(
            {
                "name": "Domain age",
                "value": "Unknown",
                "detail": "Registration date unavailable from RDAP",
            }
        )
    else:
        signals.append(
            {
                "name": "Domain age",
                "value": f"{age_days} days",
                "detail": f"Registered {domain_info.get('registered_at') or 'via RDAP'}",
            }
        )

    if page.title:
        signals.append({"name": "Page title", "value": page.title, "detail": "Extracted from HTML"})
    if page.meta_description:
        signals.append(
            {
                "name": "Meta description",
                "value": page.meta_description[:120],
                "detail": "Marketing/description tag",
            }
        )

    signals.append(
        {
            "name": "Login form",
            "value": "Detected" if page.has_login_form else "Not detected",
            "detail": "Password or email input on page",
        }
    )

    return signals


def heuristic_spam_flags(page: FetchedPage) -> list[str]:
    text = page_text_excerpt(page.html, limit=4000).lower()
    flags: list[str] = []

    spammy_phrases = (
        "act now",
        "limited time",
        "you have won",
        "claim your prize",
        "crypto giveaway",
        "double your money",
        "verify your account immediately",
        "suspended account",
        "click here to unlock",
    )
    for phrase in spammy_phrases:
        if phrase in text:
            flags.append(f'Contains urgency/spam phrase: "{phrase}"')

    if page.has_password_form and page.title:
        title_lower = page.title.lower()
        brand_words = ("paypal", "apple", "google", "microsoft", "amazon", "bank")
        for brand in brand_words:
            if brand in title_lower:
                parsed = urlparse(page.final_url)
                host = (parsed.hostname or "").lower()
                if brand not in host:
                    flags.append(f'Page mentions "{brand}" but domain does not match')
                break

    return flags[:8]


async def collect_url_signals(page: FetchedPage) -> dict[str, Any]:
    parsed = urlparse(page.final_url)
    hostname = parsed.hostname or ""
    domain_info = await lookup_domain_age_days(hostname)
    technologies = detect_technologies(page)
    technical_signals = build_technical_signals(page, domain_info)
    spam_flags = heuristic_spam_flags(page)
    text_excerpt = page_text_excerpt(page.html)

    return {
        "domain_info": domain_info,
        "technologies": technologies,
        "technical_signals": technical_signals,
        "spam_flags": spam_flags,
        "text_excerpt": text_excerpt,
    }
