from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from app.services.tasks.auth import hash_password, normalize_email, verify_password

BACKEND_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BACKEND_DIR / "data"
DB_PATH = DATA_DIR / "tasks.db"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                user_email TEXT NOT NULL,
                title TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                note_date TEXT NOT NULL,
                labels TEXT NOT NULL DEFAULT '[]',
                ai_analysis TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        _migrate_notes(conn)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_note_date ON notes(note_date)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_email)")


def _migrate_notes(conn: sqlite3.Connection) -> None:
    columns = {row[1] for row in conn.execute("PRAGMA table_info(notes)")}
    if "user_email" not in columns:
        conn.execute("ALTER TABLE notes ADD COLUMN user_email TEXT NOT NULL DEFAULT ''")


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def create_user(email: str, password: str) -> dict[str, Any] | None:
    normalized = normalize_email(email)
    if not normalized or "@" not in normalized:
        return None
    now = _utc_now()
    with get_connection() as conn:
        existing = conn.execute("SELECT email FROM users WHERE email = ?", (normalized,)).fetchone()
        if existing:
            return None
        conn.execute(
            "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
            (normalized, hash_password(password), now),
        )
        row = conn.execute("SELECT * FROM users WHERE email = ?", (normalized,)).fetchone()
    return {"email": row["email"], "created_at": row["created_at"]}


def authenticate_user(email: str, password: str) -> dict[str, Any] | None:
    normalized = normalize_email(email)
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (normalized,)).fetchone()
    if not row or not verify_password(password, row["password_hash"]):
        return None
    return {"email": row["email"], "created_at": row["created_at"]}


def get_user(email: str) -> dict[str, Any] | None:
    normalized = normalize_email(email)
    with get_connection() as conn:
        row = conn.execute("SELECT email, created_at FROM users WHERE email = ?", (normalized,)).fetchone()
    if not row:
        return None
    return {"email": row["email"], "created_at": row["created_at"]}


def _parse_labels(raw: str) -> list[str]:
    try:
        parsed = json.loads(raw or "[]")
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    return [str(label).strip() for label in parsed if str(label).strip()]


def _row_to_note(row: sqlite3.Row) -> dict[str, Any]:
    ai_analysis = None
    if row["ai_analysis"]:
        try:
            ai_analysis = json.loads(row["ai_analysis"])
        except json.JSONDecodeError:
            ai_analysis = None
    return {
        "id": row["id"],
        "title": row["title"],
        "content": row["content"],
        "note_date": row["note_date"],
        "labels": _parse_labels(row["labels"]),
        "ai_analysis": ai_analysis,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_notes(
    user_email: str,
    *,
    label: str | None = None,
    note_date: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    query: str | None = None,
) -> list[dict[str, Any]]:
    clauses = ["user_email = ?"]
    params: list[Any] = [normalize_email(user_email)]

    if date_from and date_to and date_from > date_to:
        date_from, date_to = date_to, date_from

    if note_date:
        clauses.append("note_date = ?")
        params.append(note_date)
    else:
        if date_from:
            clauses.append("note_date >= ?")
            params.append(date_from)
        if date_to:
            clauses.append("note_date <= ?")
            params.append(date_to)
    if query:
        clauses.append("(title LIKE ? OR content LIKE ?)")
        needle = f"%{query.strip()}%"
        params.extend([needle, needle])

    sql = "SELECT * FROM notes WHERE " + " AND ".join(clauses)
    sql += " ORDER BY datetime(updated_at) DESC"

    with get_connection() as conn:
        rows = conn.execute(sql, params).fetchall()

    notes = [_row_to_note(row) for row in rows]
    if label:
        normalized = label.strip().lower()
        notes = [note for note in notes if normalized in [item.lower() for item in note["labels"]]]
    return notes


def list_note_dates(user_email: str) -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT note_date, COUNT(*) AS note_count
            FROM notes
            WHERE user_email = ?
            GROUP BY note_date
            ORDER BY note_date DESC
            """,
            (normalize_email(user_email),),
        ).fetchall()
    return [{"note_date": row["note_date"], "note_count": int(row["note_count"])} for row in rows]


def list_labels(user_email: str) -> list[str]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT labels FROM notes WHERE user_email = ?",
            (normalize_email(user_email),),
        ).fetchall()
    labels: set[str] = set()
    for row in rows:
        labels.update(_parse_labels(row["labels"]))
    return sorted(labels, key=str.lower)


def get_note(user_email: str, note_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM notes WHERE id = ? AND user_email = ?",
            (note_id, normalize_email(user_email)),
        ).fetchone()
    return _row_to_note(row) if row else None


def create_note(
    user_email: str,
    *,
    title: str,
    content: str,
    note_date: str,
    labels: list[str],
) -> dict[str, Any]:
    note_id = str(uuid4())
    now = _utc_now()
    normalized_labels = sorted({label.strip() for label in labels if label.strip()}, key=str.lower)
    owner = normalize_email(user_email)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO notes (
                id, user_email, title, content, note_date, labels, ai_analysis, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
            """,
            (
                note_id,
                owner,
                title.strip(),
                content.strip(),
                note_date,
                json.dumps(normalized_labels),
                now,
                now,
            ),
        )
        row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    return _row_to_note(row)


def update_note(
    user_email: str,
    note_id: str,
    *,
    title: str,
    content: str,
    note_date: str,
    labels: list[str],
) -> dict[str, Any] | None:
    normalized_labels = sorted({label.strip() for label in labels if label.strip()}, key=str.lower)
    now = _utc_now()
    owner = normalize_email(user_email)
    with get_connection() as conn:
        updated = conn.execute(
            """
            UPDATE notes
            SET title = ?, content = ?, note_date = ?, labels = ?, updated_at = ?
            WHERE id = ? AND user_email = ?
            """,
            (
                title.strip(),
                content.strip(),
                note_date,
                json.dumps(normalized_labels),
                now,
                note_id,
                owner,
            ),
        ).rowcount
        if not updated:
            return None
        row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    return _row_to_note(row)


def set_note_analysis(user_email: str, note_id: str, analysis: dict[str, Any]) -> dict[str, Any] | None:
    now = _utc_now()
    owner = normalize_email(user_email)
    with get_connection() as conn:
        updated = conn.execute(
            """
            UPDATE notes
            SET ai_analysis = ?, updated_at = ?
            WHERE id = ? AND user_email = ?
            """,
            (json.dumps(analysis), now, note_id, owner),
        ).rowcount
        if not updated:
            return None
        row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    return _row_to_note(row)


def delete_note(user_email: str, note_id: str) -> bool:
    owner = normalize_email(user_email)
    with get_connection() as conn:
        deleted = conn.execute(
            "DELETE FROM notes WHERE id = ? AND user_email = ?",
            (note_id, owner),
        ).rowcount
    return bool(deleted)
