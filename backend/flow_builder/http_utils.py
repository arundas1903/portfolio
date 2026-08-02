from __future__ import annotations

import ipaddress
import json
import re
import socket
from typing import Any
from urllib.parse import urlparse

import httpx

REQUEST_TIMEOUT = 15.0
USER_AGENT = "PortfolioFlowBuilder/1.0 (+https://arundas.me/flow-builder)"

BLOCKED_HOSTNAMES = frozenset(
    {
        "localhost",
        "localhost.localdomain",
        "metadata.google.internal",
    }
)

ALLOWED_METHODS = frozenset({"GET", "POST", "PUT", "PATCH", "DELETE"})


class HttpRequestError(ValueError):
    pass


def render_template(value: str, data: dict[str, Any]) -> str:
    def replacer(match: re.Match[str]) -> str:
        key = match.group(1)
        return str(data.get(key, ""))

    return re.sub(r"\{\{(\w+)\}\}", replacer, value)


def parse_json_object(raw: str, label: str) -> dict[str, Any]:
    trimmed = raw.strip()
    if not trimmed:
        return {}
    try:
        parsed = json.loads(trimmed)
    except json.JSONDecodeError as exc:
        raise HttpRequestError(f"{label} must be valid JSON.") from exc
    if not isinstance(parsed, dict):
        raise HttpRequestError(f"{label} must be a JSON object.")
    return parsed


def normalize_url(raw: str) -> str:
    trimmed = raw.strip()
    if not trimmed:
        raise HttpRequestError("URL is required.")
    if not re.match(r"^https?://", trimmed, re.IGNORECASE):
        trimmed = f"https://{trimmed}"
    parsed = urlparse(trimmed)
    if parsed.scheme not in {"http", "https"}:
        raise HttpRequestError("Only http and https URLs are supported.")
    if not parsed.hostname:
        raise HttpRequestError("Could not parse hostname from URL.")
    return trimmed


def _hostname_blocked(hostname: str) -> bool:
    lowered = hostname.strip().lower().rstrip(".")
    if lowered in BLOCKED_HOSTNAMES:
        return True
    return lowered.endswith(".local") or lowered.endswith(".internal")


def _is_public_ip(value: str) -> bool:
    try:
        return ipaddress.ip_address(value).is_global
    except ValueError:
        return False


def _resolve_public_host(hostname: str) -> None:
    if _hostname_blocked(hostname):
        raise HttpRequestError("That hostname is not allowed.")

    try:
        infos = socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise HttpRequestError("Could not resolve hostname.") from exc

    if not any(
        _is_public_ip(info[4][0].rsplit(":", 1)[-1] if info[4] else "")
        for info in infos
        if info[4]
    ):
        raise HttpRequestError("URL points to a private or local network address.")


def safe_request(
    *,
    url: str,
    method: str,
    headers: dict[str, str] | None = None,
    json_body: Any | None = None,
) -> httpx.Response:
    normalized = normalize_url(url)
    parsed = urlparse(normalized)
    assert parsed.hostname
    _resolve_public_host(parsed.hostname)

    verb = method.upper()
    if verb not in ALLOWED_METHODS:
        raise HttpRequestError(f"Unsupported method: {method}")

    with httpx.Client(
        timeout=REQUEST_TIMEOUT,
        follow_redirects=False,
        headers={"User-Agent": USER_AGENT, **(headers or {})},
    ) as client:
        return client.request(verb, normalized, json=json_body)
