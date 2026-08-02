from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

BACKEND_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BACKEND_DIR / "data"
DB_PATH = DATA_DIR / "flow_builder.db"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS flow_configurations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                flow_json TEXT NOT NULL,
                owner_email TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_flow_configurations_updated ON flow_configurations(updated_at DESC)"
        )
        columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(flow_configurations)").fetchall()
        }
        if "owner_email" not in columns:
            conn.execute(
                "ALTER TABLE flow_configurations ADD COLUMN owner_email TEXT NOT NULL DEFAULT ''"
            )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_flow_configurations_owner ON flow_configurations(owner_email, updated_at DESC)"
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


def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "owner_email": row["owner_email"],
        "flow": json.loads(row["flow_json"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_configurations(owner_email: str) -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, name, description, owner_email, created_at, updated_at
            FROM flow_configurations
            WHERE owner_email = ?
            ORDER BY updated_at DESC
            """,
            (owner_email,),
        ).fetchall()
    return [dict(row) for row in rows]


def get_configuration(config_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM flow_configurations WHERE id = ?",
            (config_id,),
        ).fetchone()
    if not row:
        return None
    return _row_to_dict(row)


def get_configuration_for_owner(config_id: str, owner_email: str) -> dict[str, Any] | None:
    record = get_configuration(config_id)
    if not record or record.get("owner_email") != owner_email:
        return None
    return record


def create_configuration(
    name: str,
    flow: dict[str, Any],
    owner_email: str,
    description: str = "",
) -> dict[str, Any]:
    config_id = str(uuid4())
    now = _utc_now()
    trimmed_name = name.strip() or "Untitled flow"
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO flow_configurations (
                id, name, description, flow_json, owner_email, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                config_id,
                trimmed_name,
                description.strip(),
                json.dumps(flow),
                owner_email,
                now,
                now,
            ),
        )
    result = get_configuration(config_id)
    assert result is not None
    return result


def update_configuration(
    config_id: str,
    *,
    name: str | None = None,
    description: str | None = None,
    flow: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    existing = get_configuration(config_id)
    if not existing:
        return None

    next_name = name.strip() if name is not None else existing["name"]
    next_description = description.strip() if description is not None else existing["description"]
    next_flow = flow if flow is not None else existing["flow"]
    now = _utc_now()

    with get_connection() as conn:
        conn.execute(
            """
            UPDATE flow_configurations
            SET name = ?, description = ?, flow_json = ?, updated_at = ?
            WHERE id = ?
            """,
            (next_name or "Untitled flow", next_description, json.dumps(next_flow), now, config_id),
        )
    return get_configuration(config_id)


def delete_configuration(config_id: str) -> bool:
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM flow_configurations WHERE id = ?", (config_id,))
        return cursor.rowcount > 0
