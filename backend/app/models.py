from typing import Literal

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


NotificationChannel = Literal["sms", "email", "push"]


class BfsiSessionStartRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    client_id: str = Field(min_length=8, max_length=64)


class BfsiUserProfile(BaseModel):
    email: str


class BfsiSessionStartResponse(BaseModel):
    token: str
    user: BfsiUserProfile


class BfsiStatusResponse(BaseModel):
    user: BfsiUserProfile


class BfsiTemplateCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    content: str = Field(min_length=1, max_length=2000)
    amount_threshold: float = Field(ge=0, le=1_000_000_000)
    channel_if_above: NotificationChannel
    channel_if_below: NotificationChannel


class BfsiTemplateUpdateRequest(BfsiTemplateCreateRequest):
    pass


class BfsiTemplateResponse(BaseModel):
    id: str
    name: str
    content: str
    amount_threshold: float
    channel_if_above: NotificationChannel
    channel_if_below: NotificationChannel
    routing_summary: str
    created_at: str
    updated_at: str


class BfsiTemplateListResponse(BaseModel):
    templates: list[BfsiTemplateResponse]


class BfsiDefaultConfigUpsertRequest(BaseModel):
    amount_threshold: float = Field(ge=0, le=1_000_000_000)
    channel_if_above: NotificationChannel
    channel_if_below: NotificationChannel


class BfsiDefaultConfigResponse(BaseModel):
    email: str
    amount_threshold: float
    channel_if_above: NotificationChannel
    channel_if_below: NotificationChannel
    routing_summary: str
    paused: bool
    created_at: str
    updated_at: str


class BfsiDefaultConfigPauseRequest(BaseModel):
    paused: bool


class BfsiDefaultConfigStatusResponse(BaseModel):
    config: BfsiDefaultConfigResponse | None = None


class BfsiNotificationAudience(BaseModel):
    email: str | None = Field(
        default=None,
        max_length=254,
        description="Recipient email. Required when routing to the email channel.",
        examples=["customer@example.com"],
    )
    phone: str | None = Field(
        default=None,
        max_length=32,
        description="Recipient phone (E.164 recommended). Required for SMS and push.",
        examples=["+919876543210"],
    )


class BfsiSendNotificationRequest(BaseModel):
    template_id: str = Field(
        min_length=1,
        max_length=64,
        description="UUID of a template created in the dashboard.",
        examples=["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
    )
    amount: float = Field(
        ge=0,
        le=1_000_000_000,
        description="Transaction amount used to pick SMS, email, or push.",
        examples=[250],
    )
    audience: BfsiNotificationAudience


class BfsiSendNotificationResponse(BaseModel):
    notification_id: str
    template_id: str
    template_name: str
    amount: float
    channel: NotificationChannel
    message: str
    audience: BfsiNotificationAudience
    price_paise: int
    status: str
    routing_reason: str
    created_at: str


class BfsiV2SendNotificationRequest(BaseModel):
    message_body: str = Field(
        min_length=1,
        max_length=2000,
        description="Full notification text. AI extracts transaction amount when present.",
        examples=["Your UPI payment of Rs 250 to Merchant XYZ is successful."],
    )
    audience: BfsiNotificationAudience


class BfsiV2SendNotificationResponse(BaseModel):
    notification_id: str
    channel: NotificationChannel
    message: str
    audience: BfsiNotificationAudience
    amount: float | None = None
    is_transaction: bool
    used_default_config: bool
    classification_reason: str
    price_paise: int
    status: str
    routing_reason: str
    created_at: str


class BfsiNotificationLogItem(BaseModel):
    id: str
    template_id: str
    template_name: str
    amount: float
    channel: NotificationChannel
    message: str
    audience_email: str | None = None
    audience_phone: str | None = None
    routing_reason: str
    price_paise: int
    status: str
    created_at: str


class BfsiNotificationLogsResponse(BaseModel):
    items: list[BfsiNotificationLogItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    total_usage_paise: int


class BfsiUsageResponse(BaseModel):
    total_usage_paise: int
    send_count: int
    channel_prices: dict[str, int]
    channel_counts: dict[str, int]
    baseline_cost_paise: int
    savings_paise: int
    savings_percent: float
