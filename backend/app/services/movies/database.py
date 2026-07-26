from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BACKEND_DIR / "data"
DB_PATH = DATA_DIR / "movies.db"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                interests_json TEXT NOT NULL DEFAULT '{}',
                onboarding_complete INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ip_bindings (
                ip TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS client_bindings (
                client_id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS movie_perspectives (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                movie_title TEXT NOT NULL,
                movie_year TEXT,
                tmdb_id INTEGER,
                user_take TEXT NOT NULL,
                public_review_summary TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_perspectives_email ON movie_perspectives(email);
            """
        )


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user(email: str) -> dict[str, Any] | None:
    email = normalize_email(email)
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if not row:
            return None
        return _row_to_user(row)


def upsert_user(email: str) -> dict[str, Any]:
    email = normalize_email(email)
    now = _utc_now()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO users (email, interests_json, onboarding_complete, created_at, updated_at)
            VALUES (?, '{}', 0, ?, ?)
            ON CONFLICT(email) DO NOTHING
            """,
            (email, now, now),
        )
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return _row_to_user(row)


def update_user_interests(email: str, interests: dict[str, Any], onboarding_complete: bool) -> dict[str, Any]:
    email = normalize_email(email)
    now = _utc_now()
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE users
            SET interests_json = ?, onboarding_complete = ?, updated_at = ?
            WHERE email = ?
            """,
            (json.dumps(interests), int(onboarding_complete), now, email),
        )
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return _row_to_user(row)


def get_ip_binding(ip: str) -> str | None:
    with get_connection() as conn:
        row = conn.execute("SELECT email FROM ip_bindings WHERE ip = ?", (ip,)).fetchone()
        return normalize_email(row["email"]) if row else None


def get_client_binding(client_id: str) -> str | None:
    with get_connection() as conn:
        row = conn.execute("SELECT email FROM client_bindings WHERE client_id = ?", (client_id,)).fetchone()
        return normalize_email(row["email"]) if row else None


def bind_ip(ip: str, email: str) -> None:
    email = normalize_email(email)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO ip_bindings (ip, email, created_at)
            VALUES (?, ?, ?)
            ON CONFLICT(ip) DO NOTHING
            """,
            (ip, email, _utc_now()),
        )


def bind_client(client_id: str, email: str) -> None:
    email = normalize_email(email)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO client_bindings (client_id, email, created_at)
            VALUES (?, ?, ?)
            ON CONFLICT(client_id) DO NOTHING
            """,
            (client_id, email, _utc_now()),
        )


def save_perspective(
    email: str,
    *,
    movie_title: str,
    movie_year: str | None,
    tmdb_id: int | None,
    user_take: str,
    public_review_summary: str,
) -> None:
    email = normalize_email(email)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO movie_perspectives
            (email, movie_title, movie_year, tmdb_id, user_take, public_review_summary, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (email, movie_title, movie_year, tmdb_id, user_take, public_review_summary, _utc_now()),
        )


def list_perspectives(email: str, limit: int = 20) -> list[dict[str, Any]]:
    email = normalize_email(email)
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT movie_title, movie_year, user_take, public_review_summary, created_at
            FROM movie_perspectives
            WHERE email = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (email, limit),
        ).fetchall()
    return [dict(row) for row in rows]


def _row_to_user(row: sqlite3.Row) -> dict[str, Any]:
    interests = json.loads(row["interests_json"] or "{}")
    return {
        "email": row["email"],
        "interests": interests,
        "onboarding_complete": bool(row["onboarding_complete"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }
