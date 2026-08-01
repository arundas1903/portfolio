from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin

import httpx

IANA_BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json"
RDAP_PROXY_URL = "https://rdap.org/domain/{domain}"
USER_AGENT = "PortfolioUrlStrength/1.0 (+https://arundas.me/url-strength)"
BOOTSTRAP_TTL_SECONDS = 60 * 60 * 24

EXTRA_REGISTRY_BASES = (
    "https://rdap.identitydigital.services/rdap/",
    "https://pubapi.registry.google/rdap/",
)

_bootstrap_cache: dict[str, list[str]] | None = None
_bootstrap_loaded_at: float = 0.0
_bootstrap_lock = asyncio.Lock()


def normalize_hostname(hostname: str) -> str:
    host = hostname.lower().strip(".")
    if host.startswith("www."):
        host = host[4:]
    return host


def _registration_date_from_rdap(payload: dict[str, Any]) -> str | None:
    events = payload.get("events") or []
    for action in ("registration", "registered", "reregistration"):
        for event in events:
            if str(event.get("eventAction", "")).lower() == action:
                event_date = event.get("eventDate")
                if event_date:
                    return str(event_date)
    return None


def _domain_query_names(host: str) -> list[str]:
    upper = host.upper()
    lower = host.lower()
    if upper == lower:
        return [lower]
    return [upper, lower]


def _build_rdap_urls(base_url: str, host: str) -> list[str]:
    base = base_url if base_url.endswith("/") else f"{base_url}/"
    urls: list[str] = []
    for domain in _domain_query_names(host):
        urls.append(urljoin(base, f"domain/{domain}"))
    return urls


def _parse_bootstrap(payload: dict[str, Any]) -> dict[str, list[str]]:
    lookup: dict[str, list[str]] = {}
    for service in payload.get("services") or []:
        if not isinstance(service, list) or len(service) != 2:
            continue
        tlds, bases = service
        if not isinstance(tlds, list) or not isinstance(bases, list):
            continue
        for tld in tlds:
            key = str(tld).lower()
            lookup.setdefault(key, [])
            for base in bases:
                base_url = str(base).strip()
                if base_url and base_url not in lookup[key]:
                    lookup[key].append(base_url)
    return lookup


async def _load_bootstrap() -> dict[str, list[str]]:
    global _bootstrap_cache, _bootstrap_loaded_at

    now = time.monotonic()
    if _bootstrap_cache is not None and now - _bootstrap_loaded_at < BOOTSTRAP_TTL_SECONDS:
        return _bootstrap_cache

    async with _bootstrap_lock:
        now = time.monotonic()
        if _bootstrap_cache is not None and now - _bootstrap_loaded_at < BOOTSTRAP_TTL_SECONDS:
            return _bootstrap_cache

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(
                IANA_BOOTSTRAP_URL,
                headers={"Accept": "application/json", "User-Agent": USER_AGENT},
            )
            response.raise_for_status()
            payload = response.json()

        _bootstrap_cache = _parse_bootstrap(payload if isinstance(payload, dict) else {})
        _bootstrap_loaded_at = time.monotonic()
        return _bootstrap_cache


def _bootstrap_bases_for_host(host: str, lookup: dict[str, list[str]]) -> list[str]:
    labels = host.split(".")
    bases: list[str] = []
    seen: set[str] = set()

    suffixes = [".".join(labels[index:]) for index in range(1, len(labels))]
    suffixes.sort(key=len, reverse=True)

    for suffix in suffixes:
        for base in lookup.get(suffix, []):
            if base not in seen:
                seen.add(base)
                bases.append(base)

    return bases


def _heuristic_bases_for_host(host: str) -> list[str]:
    labels = host.split(".")
    if len(labels) < 2:
        return []

    tld = labels[-1].lower()
    bases: list[str] = []

    if 2 <= len(tld) <= 12 and tld.isalnum():
        bases.append(f"https://rdap.nic.{tld}/")

    bases.extend(EXTRA_REGISTRY_BASES)
    return bases


def _lookup_urls_for_host(host: str, bootstrap: dict[str, list[str]]) -> list[str]:
    seen: set[str] = set()
    urls: list[str] = []

    def add_urls(base: str) -> None:
        for url in _build_rdap_urls(base, host):
            if url not in seen:
                seen.add(url)
                urls.append(url)

    for base in _bootstrap_bases_for_host(host, bootstrap):
        add_urls(base)

    for base in _heuristic_bases_for_host(host):
        add_urls(base)

    proxy_url = RDAP_PROXY_URL.format(domain=host)
    if proxy_url not in seen:
        seen.add(proxy_url)
        urls.append(proxy_url)

    return urls


async def _fetch_rdap_payload(client: httpx.AsyncClient, url: str) -> dict[str, Any] | None:
    response = await client.get(
        url,
        headers={
            "Accept": "application/rdap+json, application/json",
            "User-Agent": USER_AGENT,
        },
    )
    if response.status_code in {404, 422, 400}:
        return None
    response.raise_for_status()
    payload = response.json()
    return payload if isinstance(payload, dict) else None


async def _lookup_from_urls(urls: list[str]) -> str | None:
    if not urls:
        return None

    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        for url in urls:
            try:
                payload = await _fetch_rdap_payload(client, url)
            except Exception:
                continue
            if not payload:
                continue
            registered_at = _registration_date_from_rdap(payload)
            if registered_at:
                return registered_at

    return None


async def lookup_domain_registration(host: str) -> dict[str, Any]:
    host = normalize_hostname(host)
    registered_at: str | None = None
    source = "unavailable"

    try:
        bootstrap = await _load_bootstrap()
        lookup_urls = _lookup_urls_for_host(host, bootstrap)
    except Exception:
        lookup_urls = _lookup_urls_for_host(host, {})

    registered_at = await _lookup_from_urls(lookup_urls)
    if registered_at:
        source = "rdap"

    age_days = None
    if registered_at:
        try:
            created = datetime.fromisoformat(str(registered_at).replace("Z", "+00:00"))
            age_days = max(0, (datetime.now(timezone.utc) - created).days)
        except ValueError:
            age_days = None

    return {
        "domain": host,
        "registered_at": registered_at,
        "domain_age_days": age_days,
        "source": source,
    }
