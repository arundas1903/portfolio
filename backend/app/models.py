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


class A2PChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class A2PChatResponse(BaseModel):
    is_a2p: bool
    reply: str
    countries: list[str] = []


class A2PStatsResponse(BaseModel):
    country_count: int
    data_path: str
    channels: dict[str, dict[str, int]]
    registration_required_alphanumeric: int
    registration_required_short_code: int


class A2PCountryResponse(BaseModel):
    country: dict
    summary: str
