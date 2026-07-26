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


class MovieSessionStartRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    client_id: str = Field(min_length=8, max_length=64)


class MovieUserProfile(BaseModel):
    email: str
    interests: dict = {}
    onboarding_complete: bool = False


class MovieSessionStartResponse(BaseModel):
    token: str
    user: MovieUserProfile


class MovieStatusResponse(BaseModel):
    user: MovieUserProfile


class MovieChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=4000)


class MovieChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[MovieChatMessage] = []


class MovieChatResponse(BaseModel):
    reply: str
    onboarding_complete: bool
    interests: dict = {}
    saved_perspective: str | None = None
    movie_context: str | None = None
