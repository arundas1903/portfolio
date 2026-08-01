from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_task_user_email
from app.models import (
    TaskAuthLoginRequest,
    TaskAuthRegisterRequest,
    TaskAuthResponse,
    TaskNoteAnalysisResponse,
    TaskNoteCreateRequest,
    TaskNoteDatesResponse,
    TaskNoteItem,
    TaskNoteLabelsResponse,
    TaskNoteListResponse,
    TaskNoteSummarizeRequest,
    TaskNoteSummarizeResponse,
    TaskNoteUpdateRequest,
    TaskUserProfile,
)
from app.services.tasks import database as db
from app.services.tasks.analyzer import analyze_note, summarize_notes_in_range
from app.services.tasks.auth import create_session_token

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("/auth/register", response_model=TaskAuthResponse, status_code=201)
async def register_task_user(body: TaskAuthRegisterRequest) -> TaskAuthResponse:
    user = db.create_user(body.email, body.password)
    if not user:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    token = create_session_token(user["email"])
    return TaskAuthResponse(token=token, user=TaskUserProfile(**user))


@router.post("/auth/login", response_model=TaskAuthResponse)
async def login_task_user(body: TaskAuthLoginRequest) -> TaskAuthResponse:
    user = db.authenticate_user(body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_session_token(user["email"])
    return TaskAuthResponse(token=token, user=TaskUserProfile(**user))


@router.get("/auth/me", response_model=TaskUserProfile)
async def task_user_me(email: str = Depends(get_task_user_email)) -> TaskUserProfile:
    user = db.get_user(email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return TaskUserProfile(**user)


@router.get("/notes", response_model=TaskNoteListResponse)
async def list_task_notes(
    email: str = Depends(get_task_user_email),
    label: str | None = Query(default=None),
    note_date: str | None = Query(default=None, alias="date"),
    date_from: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    date_to: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    q: str | None = Query(default=None, min_length=1, max_length=200),
) -> TaskNoteListResponse:
    items = db.list_notes(
        email,
        label=label,
        note_date=note_date,
        date_from=date_from,
        date_to=date_to,
        query=q,
    )
    return TaskNoteListResponse(items=items, total=len(items))


@router.get("/notes/dates", response_model=TaskNoteDatesResponse)
async def list_task_note_dates(email: str = Depends(get_task_user_email)) -> TaskNoteDatesResponse:
    return TaskNoteDatesResponse(dates=db.list_note_dates(email))


@router.get("/labels", response_model=TaskNoteLabelsResponse)
async def list_task_labels(email: str = Depends(get_task_user_email)) -> TaskNoteLabelsResponse:
    return TaskNoteLabelsResponse(labels=db.list_labels(email))


@router.post("/notes", response_model=TaskNoteItem, status_code=201)
async def create_task_note(
    body: TaskNoteCreateRequest,
    email: str = Depends(get_task_user_email),
) -> TaskNoteItem:
    note = db.create_note(
        email,
        title=body.title,
        content=body.content,
        note_date=body.note_date,
        labels=body.labels,
    )
    return TaskNoteItem(**note)


@router.put("/notes/{note_id}", response_model=TaskNoteItem)
async def update_task_note(
    note_id: str,
    body: TaskNoteUpdateRequest,
    email: str = Depends(get_task_user_email),
) -> TaskNoteItem:
    note = db.update_note(
        email,
        note_id,
        title=body.title,
        content=body.content,
        note_date=body.note_date,
        labels=body.labels,
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")
    return TaskNoteItem(**note)


@router.delete("/notes/{note_id}", status_code=204)
async def delete_task_note(note_id: str, email: str = Depends(get_task_user_email)) -> None:
    if not db.delete_note(email, note_id):
        raise HTTPException(status_code=404, detail="Note not found.")


@router.post("/notes/{note_id}/analyze", response_model=TaskNoteAnalysisResponse)
async def analyze_task_note(
    note_id: str,
    email: str = Depends(get_task_user_email),
) -> TaskNoteAnalysisResponse:
    note = db.get_note(email, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")

    try:
        analysis = await analyze_note(title=note["title"], content=note["content"])
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Analysis failed: {exc}") from exc

    updated = db.set_note_analysis(email, note_id, analysis)
    if not updated:
        raise HTTPException(status_code=404, detail="Note not found.")
    return TaskNoteAnalysisResponse(note=TaskNoteItem(**updated), analysis=analysis)


@router.post("/summarize", response_model=TaskNoteSummarizeResponse)
async def summarize_task_notes(
    body: TaskNoteSummarizeRequest,
    email: str = Depends(get_task_user_email),
) -> TaskNoteSummarizeResponse:
    date_from = body.date_from
    date_to = body.date_to
    if date_from > date_to:
        date_from, date_to = date_to, date_from

    notes = db.list_notes(email, date_from=date_from, date_to=date_to)
    if not notes:
        raise HTTPException(status_code=404, detail="No notes found in this date range.")

    try:
        summary = await summarize_notes_in_range(notes=notes, date_from=date_from, date_to=date_to)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Summary failed: {exc}") from exc

    return TaskNoteSummarizeResponse(**summary)
