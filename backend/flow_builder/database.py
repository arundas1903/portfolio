from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
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
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS flow_webhook_waits (
                token TEXT PRIMARY KEY,
                owner_email TEXT NOT NULL DEFAULT '',
                flow_json TEXT NOT NULL,
                resume_node_id TEXT NOT NULL,
                context_json TEXT NOT NULL,
                trace_json TEXT NOT NULL,
                response_key TEXT NOT NULL DEFAULT 'webhook_payload',
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_flow_webhook_waits_status ON flow_webhook_waits(status, expires_at)"
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS flow_run_history (
                id TEXT PRIMARY KEY,
                config_id TEXT NOT NULL,
                owner_email TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'public_api',
                status TEXT NOT NULL,
                input_json TEXT NOT NULL,
                flow_json TEXT NOT NULL,
                result_json TEXT NOT NULL,
                webhook_payload_json TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_flow_run_history_config ON flow_run_history(config_id, created_at DESC)"
        )
        webhook_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(flow_webhook_waits)").fetchall()
        }
        if "config_id" not in webhook_columns:
            conn.execute("ALTER TABLE flow_webhook_waits ADD COLUMN config_id TEXT NOT NULL DEFAULT ''")
        if "run_history_id" not in webhook_columns:
            conn.execute("ALTER TABLE flow_webhook_waits ADD COLUMN run_history_id TEXT")
        if "timeout_node_id" not in webhook_columns:
            conn.execute("ALTER TABLE flow_webhook_waits ADD COLUMN timeout_node_id TEXT NOT NULL DEFAULT ''")
        if "webhook_node_id" not in webhook_columns:
            conn.execute("ALTER TABLE flow_webhook_waits ADD COLUMN webhook_node_id TEXT NOT NULL DEFAULT ''")
        if "public_base_url" not in webhook_columns:
            conn.execute("ALTER TABLE flow_webhook_waits ADD COLUMN public_base_url TEXT NOT NULL DEFAULT ''")


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
        conn.execute("DELETE FROM flow_run_history WHERE config_id = ?", (config_id,))
        cursor = conn.execute("DELETE FROM flow_configurations WHERE id = ?", (config_id,))
        return cursor.rowcount > 0


def create_webhook_wait(
    *,
    token: str,
    owner_email: str,
    flow: dict[str, Any],
    resume_node_id: str,
    timeout_node_id: str = "",
    webhook_node_id: str = "",
    context: dict[str, Any],
    trace: list[dict[str, Any]],
    response_key: str,
    timeout_minutes: int = 60,
    config_id: str = "",
    run_history_id: str | None = None,
    public_base_url: str = "",
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=max(1, timeout_minutes))
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO flow_webhook_waits (
                token, owner_email, flow_json, resume_node_id, timeout_node_id, webhook_node_id,
                context_json, trace_json, response_key, status, created_at, expires_at, config_id,
                run_history_id, public_base_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
            """,
            (
                token,
                owner_email,
                json.dumps(flow),
                resume_node_id,
                timeout_node_id,
                webhook_node_id,
                json.dumps(context),
                json.dumps(trace),
                response_key,
                now.isoformat(),
                expires_at.isoformat(),
                config_id,
                run_history_id,
                public_base_url,
            ),
        )
    record = get_webhook_wait(token)
    assert record is not None
    return record


def get_webhook_wait(token: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM flow_webhook_waits WHERE token = ?",
            (token,),
        ).fetchone()
    if not row:
        return None
    return {
        "token": row["token"],
        "owner_email": row["owner_email"],
        "flow": json.loads(row["flow_json"]),
        "resume_node_id": row["resume_node_id"],
        "timeout_node_id": row["timeout_node_id"],
        "webhook_node_id": row["webhook_node_id"],
        "context": json.loads(row["context_json"]),
        "trace": json.loads(row["trace_json"]),
        "response_key": row["response_key"],
        "status": row["status"],
        "created_at": row["created_at"],
        "expires_at": row["expires_at"],
        "config_id": row["config_id"],
        "run_history_id": row["run_history_id"],
        "public_base_url": row["public_base_url"],
    }


def complete_webhook_wait(token: str) -> bool:
    with get_connection() as conn:
        cursor = conn.execute(
            "UPDATE flow_webhook_waits SET status = 'completed' WHERE token = ? AND status = 'pending'",
            (token,),
        )
        return cursor.rowcount > 0


def expire_webhook_wait(token: str) -> bool:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE flow_webhook_waits
            SET status = 'expired'
            WHERE token = ? AND status = 'pending' AND expires_at <= ?
            """,
            (token, now),
        )
        return cursor.rowcount > 0


def list_expired_pending_waits(*, limit: int = 50) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM flow_webhook_waits
            WHERE status = 'pending' AND expires_at <= ?
            ORDER BY expires_at ASC
            LIMIT ?
            """,
            (now, limit),
        ).fetchall()
    return [
        {
            "token": row["token"],
            "owner_email": row["owner_email"],
            "flow": json.loads(row["flow_json"]),
            "resume_node_id": row["resume_node_id"],
            "timeout_node_id": row["timeout_node_id"],
            "webhook_node_id": row["webhook_node_id"],
            "context": json.loads(row["context_json"]),
            "trace": json.loads(row["trace_json"]),
            "response_key": row["response_key"],
            "status": row["status"],
            "created_at": row["created_at"],
            "expires_at": row["expires_at"],
            "config_id": row["config_id"],
            "run_history_id": row["run_history_id"],
            "public_base_url": row["public_base_url"],
        }
        for row in rows
    ]


def link_webhook_wait_to_run(token: str, run_history_id: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE flow_webhook_waits SET run_history_id = ? WHERE token = ?",
            (run_history_id, token),
        )


def create_run_history(
    *,
    config_id: str,
    owner_email: str,
    source: str,
    input_data: dict[str, Any],
    flow: dict[str, Any],
    result: dict[str, Any],
    webhook_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    run_id = str(uuid4())
    now = _utc_now()
    completed_at = now if result.get("status") != "waiting" else None
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO flow_run_history (
                id, config_id, owner_email, source, status, input_json, flow_json,
                result_json, webhook_payload_json, created_at, completed_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                run_id,
                config_id,
                owner_email,
                source,
                result.get("status", "error"),
                json.dumps(input_data),
                json.dumps(flow),
                json.dumps(result),
                json.dumps(webhook_payload) if webhook_payload else None,
                now,
                completed_at,
            ),
        )
    record = get_run_history(run_id)
    assert record is not None
    return record


def update_run_history(
    run_id: str,
    *,
    result: dict[str, Any],
    webhook_payload: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    existing = get_run_history(run_id)
    if not existing:
        return None

    now = _utc_now()
    completed_at = now if result.get("status") != "waiting" else existing.get("completed_at")
    payload_json = (
        json.dumps(webhook_payload)
        if webhook_payload is not None
        else json.dumps(existing["webhook_payload"]) if existing["webhook_payload"] else None
    )
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE flow_run_history
            SET status = ?, result_json = ?, webhook_payload_json = ?, completed_at = ?
            WHERE id = ?
            """,
            (
                result.get("status", "error"),
                json.dumps(result),
                payload_json,
                completed_at,
                run_id,
            ),
        )
    return get_run_history(run_id)


def _run_history_row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "config_id": row["config_id"],
        "owner_email": row["owner_email"],
        "source": row["source"],
        "status": row["status"],
        "input_data": json.loads(row["input_json"]),
        "flow": json.loads(row["flow_json"]),
        "result": json.loads(row["result_json"]),
        "webhook_payload": json.loads(row["webhook_payload_json"]) if row["webhook_payload_json"] else None,
        "created_at": row["created_at"],
        "completed_at": row["completed_at"],
    }


def get_run_history(run_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM flow_run_history WHERE id = ?",
            (run_id,),
        ).fetchone()
    if not row:
        return None
    return _run_history_row_to_dict(row)


def list_run_history(config_id: str, owner_email: str, *, limit: int = 50) -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM flow_run_history
            WHERE config_id = ? AND owner_email = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (config_id, owner_email, limit),
        ).fetchall()
    return [_run_history_row_to_dict(row) for row in rows]
