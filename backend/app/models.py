from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class UnlockRequest(BaseModel):
    password: str = Field(min_length=1, max_length=128)


class UnlockResponse(BaseModel):
    unlocked: bool
    required: bool


class ChatLimitsResponse(BaseModel):
    limit: int
    window_minutes: int
    remaining: int
    retry_after_seconds: int


class SourceCitation(BaseModel):
    tradition: str
    reference: str
    text: str


class ChatResponse(BaseModel):
    is_religious: bool
    reply: str
    sources: list[SourceCitation] = []
    traditions_searched: list[str] = []
