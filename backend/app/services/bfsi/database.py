from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

BACKEND_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BACKEND_DIR / "data"
DB_PATH = DATA_DIR / "bfsi.db"

NOTIFICATION_CHANNELS = frozenset({"sms", "email", "push"})


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
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

            CREATE TABLE IF NOT EXISTS templates (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                content TEXT NOT NULL,
                amount_threshold REAL NOT NULL,
                channel_if_above TEXT NOT NULL,
                channel_if_below TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_templates_email ON templates(email);

            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                template_id TEXT NOT NULL,
                template_owner TEXT NOT NULL,
                template_name TEXT NOT NULL DEFAULT '',
                amount REAL NOT NULL,
                channel TEXT NOT NULL,
                message TEXT NOT NULL,
                audience_email TEXT,
                audience_phone TEXT,
                routing_reason TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_notifications_template ON notifications(template_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_owner ON notifications(template_owner);

            CREATE TABLE IF NOT EXISTS default_configs (
                email TEXT PRIMARY KEY,
                amount_threshold REAL NOT NULL,
                channel_if_above TEXT NOT NULL,
                channel_if_below TEXT NOT NULL,
                paused INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        _migrate_notifications(conn)
        _migrate_default_configs(conn)


def _migrate_default_configs(conn: sqlite3.Connection) -> None:
    columns = {row[1] for row in conn.execute("PRAGMA table_info(default_configs)")}
    if "paused" not in columns:
        conn.execute("ALTER TABLE default_configs ADD COLUMN paused INTEGER NOT NULL DEFAULT 0")


def _migrate_notifications(conn: sqlite3.Connection) -> None:
    from app.services.bfsi.pricing import CHANNEL_PRICE_PAISE

    columns = {row[1] for row in conn.execute("PRAGMA table_info(notifications)")}
    if "template_name" not in columns:
        conn.execute("ALTER TABLE notifications ADD COLUMN template_name TEXT NOT NULL DEFAULT ''")
    if "routing_reason" not in columns:
        conn.execute("ALTER TABLE notifications ADD COLUMN routing_reason TEXT NOT NULL DEFAULT ''")
    if "price_paise" not in columns:
        conn.execute("ALTER TABLE notifications ADD COLUMN price_paise INTEGER NOT NULL DEFAULT 0")
    if "ai_prompt_tokens" not in columns:
        conn.execute("ALTER TABLE notifications ADD COLUMN ai_prompt_tokens INTEGER")
    if "ai_completion_tokens" not in columns:
        conn.execute("ALTER TABLE notifications ADD COLUMN ai_completion_tokens INTEGER")
    if "ai_model" not in columns:
        conn.execute("ALTER TABLE notifications ADD COLUMN ai_model TEXT")
    if "ai_cost_micro_paise" not in columns:
        conn.execute("ALTER TABLE notifications ADD COLUMN ai_cost_micro_paise INTEGER NOT NULL DEFAULT 0")

    for channel, price in CHANNEL_PRICE_PAISE.items():
        conn.execute(
            """
            UPDATE notifications
            SET price_paise = ?
            WHERE channel = ? AND (price_paise = 0 OR price_paise IS NULL)
            """,
            (price, channel),
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
        return dict(row) if row else None


def upsert_user(email: str) -> dict[str, Any]:
    email = normalize_email(email)
    now = _utc_now()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO users (email, created_at, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(email) DO NOTHING
            """,
            (email, now, now),
        )
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row)


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


def unbind_ip(ip: str) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM ip_bindings WHERE ip = ?", (ip,))


def unbind_client(client_id: str) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM client_bindings WHERE client_id = ?", (client_id,))


def list_templates(email: str) -> list[dict[str, Any]]:
    email = normalize_email(email)
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, email, name, content, amount_threshold,
                   channel_if_above, channel_if_below, created_at, updated_at
            FROM templates
            WHERE email = ?
            ORDER BY created_at DESC
            """,
            (email,),
        ).fetchall()
    return [_row_to_template(row) for row in rows]


def create_template(
    email: str,
    *,
    name: str,
    content: str,
    amount_threshold: float,
    channel_if_above: str,
    channel_if_below: str,
) -> dict[str, Any]:
    email = normalize_email(email)
    template_id = str(uuid4())
    now = _utc_now()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO templates (
                id, email, name, content, amount_threshold,
                channel_if_above, channel_if_below, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                template_id,
                email,
                name.strip(),
                content.strip(),
                amount_threshold,
                channel_if_above,
                channel_if_below,
                now,
                now,
            ),
        )
        row = conn.execute("SELECT * FROM templates WHERE id = ?", (template_id,)).fetchone()
    return _row_to_template(row)


def get_template_by_id(template_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM templates WHERE id = ?", (template_id,)).fetchone()
    return _row_to_template(row) if row else None


def get_template(email: str, template_id: str) -> dict[str, Any] | None:
    email = normalize_email(email)
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM templates WHERE id = ? AND email = ?",
            (template_id, email),
        ).fetchone()
    return _row_to_template(row) if row else None


def update_template(
    email: str,
    template_id: str,
    *,
    name: str,
    content: str,
    amount_threshold: float,
    channel_if_above: str,
    channel_if_below: str,
) -> dict[str, Any] | None:
    email = normalize_email(email)
    now = _utc_now()
    with get_connection() as conn:
        updated = conn.execute(
            """
            UPDATE templates
            SET name = ?, content = ?, amount_threshold = ?,
                channel_if_above = ?, channel_if_below = ?, updated_at = ?
            WHERE id = ? AND email = ?
            """,
            (
                name.strip(),
                content.strip(),
                amount_threshold,
                channel_if_above,
                channel_if_below,
                now,
                template_id,
                email,
            ),
        ).rowcount
        if not updated:
            return None
        row = conn.execute("SELECT * FROM templates WHERE id = ?", (template_id,)).fetchone()
    return _row_to_template(row) if row else None


def get_default_config(email: str) -> dict[str, Any] | None:
    email = normalize_email(email)
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM default_configs WHERE email = ?", (email,)).fetchone()
    return _row_to_default_config(row) if row else None


def upsert_default_config(
    email: str,
    *,
    amount_threshold: float,
    channel_if_above: str,
    channel_if_below: str,
) -> dict[str, Any]:
    email = normalize_email(email)
    now = _utc_now()
    with get_connection() as conn:
        existing = conn.execute(
            "SELECT email FROM default_configs WHERE email = ?",
            (email,),
        ).fetchone()
        if existing:
            conn.execute(
                """
                UPDATE default_configs
                SET amount_threshold = ?, channel_if_above = ?, channel_if_below = ?, updated_at = ?
                WHERE email = ?
                """,
                (amount_threshold, channel_if_above, channel_if_below, now, email),
            )
        else:
            conn.execute(
                """
                INSERT INTO default_configs (
                    email, amount_threshold, channel_if_above, channel_if_below, paused,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, 0, ?, ?)
                """,
                (email, amount_threshold, channel_if_above, channel_if_below, now, now),
            )
        row = conn.execute("SELECT * FROM default_configs WHERE email = ?", (email,)).fetchone()
    return _row_to_default_config(row)


def delete_default_config(email: str) -> bool:
    email = normalize_email(email)
    with get_connection() as conn:
        deleted = conn.execute("DELETE FROM default_configs WHERE email = ?", (email,)).rowcount
    return deleted > 0


def set_default_config_paused(email: str, *, paused: bool) -> dict[str, Any] | None:
    email = normalize_email(email)
    now = _utc_now()
    with get_connection() as conn:
        updated = conn.execute(
            """
            UPDATE default_configs
            SET paused = ?, updated_at = ?
            WHERE email = ?
            """,
            (1 if paused else 0, now, email),
        ).rowcount
        if not updated:
            return None
        row = conn.execute("SELECT * FROM default_configs WHERE email = ?", (email,)).fetchone()
    return _row_to_default_config(row) if row else None


def get_active_default_config(email: str) -> dict[str, Any] | None:
    config = get_default_config(email)
    if not config or config["paused"]:
        return None
    return config


def create_notification(
    *,
    template_id: str,
    template_owner: str,
    template_name: str,
    amount: float,
    channel: str,
    message: str,
    audience_email: str | None,
    audience_phone: str | None,
    routing_reason: str,
    price_paise: int,
    status: str = "sent",
    ai_prompt_tokens: int | None = None,
    ai_completion_tokens: int | None = None,
    ai_model: str | None = None,
    ai_cost_micro_paise: int = 0,
) -> dict[str, Any]:
    notification_id = str(uuid4())
    now = _utc_now()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO notifications (
                id, template_id, template_owner, template_name, amount, channel, message,
                audience_email, audience_phone, routing_reason, price_paise, status, created_at,
                ai_prompt_tokens, ai_completion_tokens, ai_model, ai_cost_micro_paise
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                notification_id,
                template_id,
                normalize_email(template_owner),
                template_name.strip(),
                amount,
                channel,
                message,
                audience_email,
                audience_phone,
                routing_reason,
                price_paise,
                status,
                now,
                ai_prompt_tokens,
                ai_completion_tokens,
                ai_model,
                ai_cost_micro_paise,
            ),
        )
        row = conn.execute("SELECT * FROM notifications WHERE id = ?", (notification_id,)).fetchone()
    return _row_to_notification(row)


def list_notifications(email: str, *, page: int = 1, page_size: int = 10) -> tuple[list[dict[str, Any]], int]:
    email = normalize_email(email)
    page = max(1, page)
    page_size = max(1, min(page_size, 50))
    offset = (page - 1) * page_size
    with get_connection() as conn:
        total = conn.execute(
            "SELECT COUNT(*) FROM notifications WHERE template_owner = ?",
            (email,),
        ).fetchone()[0]
        rows = conn.execute(
            """
            SELECT * FROM notifications
            WHERE template_owner = ?
            ORDER BY datetime(created_at) DESC
            LIMIT ? OFFSET ?
            """,
            (email, page_size, offset),
        ).fetchall()
    return [_row_to_notification(row) for row in rows], int(total)


def get_usage_summary(email: str) -> dict[str, Any]:
    email = normalize_email(email)
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT
                COALESCE(SUM(price_paise), 0) AS total_usage_paise,
                COALESCE(SUM(ai_cost_micro_paise), 0) AS total_ai_cost_micro_paise,
                COUNT(*) AS send_count,
                COALESCE(SUM(CASE WHEN channel = 'sms' THEN 1 ELSE 0 END), 0) AS sms_count,
                COALESCE(SUM(CASE WHEN channel = 'email' THEN 1 ELSE 0 END), 0) AS email_count,
                COALESCE(SUM(CASE WHEN channel = 'push' THEN 1 ELSE 0 END), 0) AS push_count
            FROM notifications
            WHERE template_owner = ?
            """,
            (email,),
        ).fetchone()
    return {
        "total_usage_paise": int(row["total_usage_paise"]),
        "total_ai_cost_micro_paise": int(row["total_ai_cost_micro_paise"]),
        "send_count": int(row["send_count"]),
        "channel_counts": {
            "sms": int(row["sms_count"]),
            "email": int(row["email_count"]),
            "push": int(row["push_count"]),
        },
    }


def _row_to_notification(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "template_id": row["template_id"],
        "template_owner": row["template_owner"],
        "template_name": row["template_name"],
        "amount": float(row["amount"]),
        "channel": row["channel"],
        "message": row["message"],
        "audience_email": row["audience_email"],
        "audience_phone": row["audience_phone"],
        "routing_reason": row["routing_reason"],
        "price_paise": int(row["price_paise"]),
        "ai_prompt_tokens": row["ai_prompt_tokens"],
        "ai_completion_tokens": row["ai_completion_tokens"],
        "ai_model": row["ai_model"],
        "ai_cost_micro_paise": int(row["ai_cost_micro_paise"] or 0),
        "status": row["status"],
        "created_at": row["created_at"],
    }


def _row_to_default_config(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "email": row["email"],
        "amount_threshold": float(row["amount_threshold"]),
        "channel_if_above": row["channel_if_above"],
        "channel_if_below": row["channel_if_below"],
        "paused": bool(row["paused"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _row_to_template(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "content": row["content"],
        "amount_threshold": float(row["amount_threshold"]),
        "channel_if_above": row["channel_if_above"],
        "channel_if_below": row["channel_if_below"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }
