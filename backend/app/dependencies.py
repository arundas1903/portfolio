from fastapi import Header, HTTPException

from app.config import settings


async def require_chat_password(
    x_chat_password: str | None = Header(default=None, alias="X-Chat-Password"),
) -> None:
    if not settings.chat_password_required:
        return

    if not x_chat_password or x_chat_password != settings.chat_access_password:
        raise HTTPException(status_code=401, detail="Invalid or missing chat password")
