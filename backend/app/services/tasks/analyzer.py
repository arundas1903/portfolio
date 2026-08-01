from __future__ import annotations

import json

from openai import AsyncOpenAI

from app.config import settings


def _fallback_analysis(content: str) -> dict:
    lines = [line.strip("- •*\t ") for line in content.splitlines() if line.strip()]
    tasks = []
    for line in lines[:8]:
        lowered = line.lower()
        if any(word in lowered for word in ("todo", "task", "need to", "must", "should", "finish", "call", "email")):
            tasks.append({"title": line[:120], "priority": "medium"})
    if not tasks and lines:
        tasks.append({"title": lines[0][:120], "priority": "low"})
    return {
        "summary": lines[0][:180] if lines else "Empty note.",
        "tasks": tasks,
        "focus": "Review and prioritize the items in this note.",
        "source": "heuristic",
    }


async def analyze_note(*, title: str, content: str) -> dict:
    trimmed = content.strip()
    if not trimmed and not title.strip():
        return {
            "summary": "Empty note.",
            "tasks": [],
            "focus": "Add content before analyzing.",
            "source": "empty",
        }

    if not settings.openai_configured:
        return _fallback_analysis(f"{title}\n{content}".strip())

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You analyze daily notes and extract actionable tasks. "
                    "Return JSON with keys: summary (1-2 sentences), tasks (array of "
                    "{title, priority} where priority is high|medium|low), "
                    "focus (one short recommendation for today)."
                ),
            },
            {
                "role": "user",
                "content": f"Title: {title.strip() or '(untitled)'}\n\nNote:\n{trimmed}",
            },
        ],
        temperature=0.2,
    )

    parsed = json.loads(response.choices[0].message.content or "{}")
    tasks = parsed.get("tasks") or []
    normalized_tasks = []
    if isinstance(tasks, list):
        for item in tasks[:12]:
            if not isinstance(item, dict):
                continue
            title_text = str(item.get("title", "")).strip()
            if not title_text:
                continue
            priority = str(item.get("priority", "medium")).lower()
            if priority not in {"high", "medium", "low"}:
                priority = "medium"
            normalized_tasks.append({"title": title_text, "priority": priority})

    return {
        "summary": str(parsed.get("summary", "")).strip() or "Analysis complete.",
        "tasks": normalized_tasks,
        "focus": str(parsed.get("focus", "")).strip() or "Pick one task and start.",
        "source": "openai",
    }


def _group_notes_by_label(notes: list[dict]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {}
    for note in notes:
        labels = note.get("labels") or []
        if not labels:
            grouped.setdefault("General", []).append(note)
            continue
        for label in labels:
            grouped.setdefault(str(label), []).append(note)
    return grouped


def _format_notes_for_label(label: str, notes: list[dict]) -> str:
    chunks = []
    for note in notes:
        title = str(note.get("title") or "").strip() or "(untitled)"
        content = str(note.get("content") or "").strip()
        date = str(note.get("note_date") or "")
        chunks.append(f"- [{date}] {title}\n{content}")
    return f"Label: {label}\n" + "\n\n".join(chunks)


def _fallback_range_summary(*, date_from: str, date_to: str, grouped: dict[str, list[dict]]) -> dict:
    sections = []
    for label, label_notes in sorted(grouped.items(), key=lambda item: item[0].lower()):
        bullet_tasks = []
        for note in label_notes[:6]:
            first_line = str(note.get("content") or note.get("title") or "").strip().splitlines()[0]
            if first_line:
                bullet_tasks.append(first_line[:120])
        sections.append(
            {
                "label": label,
                "summary": f"{len(label_notes)} note(s) captured under {label}.",
                "highlights": bullet_tasks[:4],
                "tasks": [{"title": item, "priority": "medium"} for item in bullet_tasks[:6]],
            }
        )
    total = sum(len(items) for items in grouped.values())
    return {
        "date_from": date_from,
        "date_to": date_to,
        "note_count": total,
        "overview": f"Summarized {total} note entries across {len(sections)} label groups.",
        "sections": sections,
        "source": "heuristic",
    }


async def summarize_notes_in_range(
    *,
    notes: list[dict],
    date_from: str,
    date_to: str,
) -> dict:
    grouped = _group_notes_by_label(notes)
    if not grouped:
        return {
            "date_from": date_from,
            "date_to": date_to,
            "note_count": 0,
            "overview": "No notes found in this date range.",
            "sections": [],
            "source": "empty",
        }

    if not settings.openai_configured:
        return _fallback_range_summary(date_from=date_from, date_to=date_to, grouped=grouped)

    label_blocks = [_format_notes_for_label(label, label_notes) for label, label_notes in grouped.items()]
    combined = "\n\n---\n\n".join(label_blocks)

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You summarize daily notes grouped by label for a personal task tracker. "
                    "Return JSON with keys: overview (2-3 friendly sentences for the whole period), "
                    "sections (array ordered by importance, each with: label, summary (2-3 sentences), "
                    "highlights (array of short strings — key themes), tasks (array of {title, priority} "
                    "where priority is high|medium|low — actionable items only)). "
                    "Keep tone clear and practical. Merge duplicate tasks across notes."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Date range: {date_from} to {date_to}\n\n"
                    f"Notes grouped by label:\n\n{combined}"
                ),
            },
        ],
        temperature=0.25,
    )

    parsed = json.loads(response.choices[0].message.content or "{}")
    sections = []
    for item in parsed.get("sections") or []:
        if not isinstance(item, dict):
            continue
        label = str(item.get("label", "")).strip() or "General"
        highlights = [str(h).strip() for h in (item.get("highlights") or []) if str(h).strip()][:6]
        tasks = []
        for task in item.get("tasks") or []:
            if not isinstance(task, dict):
                continue
            title = str(task.get("title", "")).strip()
            if not title:
                continue
            priority = str(task.get("priority", "medium")).lower()
            if priority not in {"high", "medium", "low"}:
                priority = "medium"
            tasks.append({"title": title, "priority": priority})
        sections.append(
            {
                "label": label,
                "summary": str(item.get("summary", "")).strip() or f"Activity under {label}.",
                "highlights": highlights,
                "tasks": tasks[:10],
            }
        )

    unique_note_ids = {note["id"] for note in notes}
    return {
        "date_from": date_from,
        "date_to": date_to,
        "note_count": len(unique_note_ids),
        "overview": str(parsed.get("overview", "")).strip() or "Summary ready.",
        "sections": sections,
        "source": "openai",
    }
