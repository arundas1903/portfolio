from __future__ import annotations

import ipaddress
import re
import socket
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

import httpx

MAX_REDIRECTS = 5
REQUEST_TIMEOUT = 12.0
MAX_HTML_BYTES = 120_000
USER_AGENT = "PortfolioUrlStrength/1.0 (+https://arundas.me/url-strength)"

BLOCKED_HOSTNAMES = frozenset(
    {
        "localhost",
        "localhost.localdomain",
        "metadata.google.internal",
    }
)


class UrlFetchError(ValueError):
    pass


@dataclass
class FetchedPage:
    input_url: str
    final_url: str
    redirect_count: int
    status_code: int
    headers: dict[str, str]
    html: str
    title: str | None
    meta_description: str | None
    has_password_form: bool
    has_login_form: bool


def normalize_url(raw: str) -> str:
    trimmed = raw.strip()
    if not trimmed:
        raise UrlFetchError("Enter a URL to analyze.")
    if not re.match(r"^https?://", trimmed, re.IGNORECASE):
        trimmed = f"https://{trimmed}"
    parsed = urlparse(trimmed)
    if parsed.scheme not in {"http", "https"}:
        raise UrlFetchError("Only http and https URLs are supported.")
    if not parsed.hostname:
        raise UrlFetchError("Could not parse the hostname from that URL.")
    return trimmed


def _hostname_blocked(hostname: str) -> bool:
    lowered = hostname.strip().lower().rstrip(".")
    if lowered in BLOCKED_HOSTNAMES:
        return True
    if lowered.endswith(".local") or lowered.endswith(".internal"):
        return True
    return False


def _is_public_ip(value: str) -> bool:
    try:
        ip = ipaddress.ip_address(value)
    except ValueError:
        return False
    return ip.is_global


def _resolve_public_host(hostname: str) -> None:
    if _hostname_blocked(hostname):
        raise UrlFetchError("That hostname is not allowed.")

    try:
        infos = socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise UrlFetchError("Could not resolve the hostname.") from exc

    if not infos:
        raise UrlFetchError("Could not resolve the hostname.")

    for info in infos:
        sockaddr = info[4]
        if not sockaddr:
            continue
        ip_value = sockaddr[0]
        if ip_value.startswith("::ffff:"):
            ip_value = ip_value.rsplit(":", 1)[-1]
        if not _is_public_ip(ip_value):
            raise UrlFetchError("That URL points to a private or local network address.")


def _extract_title(html: str) -> str | None:
    match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    title = re.sub(r"\s+", " ", match.group(1)).strip()
    return title[:240] or None


def _extract_meta_description(html: str) -> str | None:
    match = re.search(
        r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']',
        html,
        re.IGNORECASE | re.DOTALL,
    )
    if not match:
        match = re.search(
            r'<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']description["\']',
            html,
            re.IGNORECASE | re.DOTALL,
        )
    if not match:
        return None
    description = re.sub(r"\s+", " ", match.group(1)).strip()
    return description[:400] or None


def _has_input_type(html: str, input_type: str) -> bool:
    pattern = rf'<input[^>]+type=["\']{re.escape(input_type)}["\']'
    return bool(re.search(pattern, html, re.IGNORECASE))


def _strip_html_text(html: str) -> str:
    cleaned = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", html)
    cleaned = re.sub(r"(?s)<[^>]+>", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


async def fetch_page(url: str) -> FetchedPage:
    normalized = normalize_url(url)
    parsed = urlparse(normalized)
    assert parsed.hostname
    _resolve_public_host(parsed.hostname)

    redirect_count = 0
    current_url = normalized

    async with httpx.AsyncClient(
        follow_redirects=False,
        timeout=REQUEST_TIMEOUT,
        headers={"User-Agent": USER_AGENT},
    ) as client:
        while True:
            current_parsed = urlparse(current_url)
            if not current_parsed.hostname:
                raise UrlFetchError("Invalid redirect target.")
            _resolve_public_host(current_parsed.hostname)

            response = await client.get(current_url)
            if response.status_code in {301, 302, 303, 307, 308}:
                redirect_count += 1
                if redirect_count > MAX_REDIRECTS:
                    raise UrlFetchError("Too many redirects.")
                location = response.headers.get("location")
                if not location:
                    raise UrlFetchError("Redirect response missing a Location header.")
                current_url = str(response.url.join(location))
                continue

            html_bytes = response.content[:MAX_HTML_BYTES]
            html = html_bytes.decode(response.encoding or "utf-8", errors="replace")
            headers = {key.lower(): value for key, value in response.headers.items()}

            return FetchedPage(
                input_url=normalized,
                final_url=str(response.url),
                redirect_count=redirect_count,
                status_code=response.status_code,
                headers=headers,
                html=html,
                title=_extract_title(html),
                meta_description=_extract_meta_description(html),
                has_password_form=_has_input_type(html, "password"),
                has_login_form=_has_input_type(html, "password") or bool(
                    re.search(r"type=[\"']email[\"']", html, re.IGNORECASE)
                ),
            )


def page_text_excerpt(html: str, limit: int = 1800) -> str:
    return _strip_html_text(html)[:limit]
