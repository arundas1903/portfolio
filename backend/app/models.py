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


NotificationChannel = Literal["sms", "email", "push", "network"]


class BfsiSessionStartRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    client_id: str = Field(min_length=8, max_length=64)


class BfsiUserProfile(BaseModel):
    email: str


class BfsiSessionStartResponse(BaseModel):
    token: str
    user: BfsiUserProfile


class BfsiSessionResetRequest(BaseModel):
    client_id: str = Field(min_length=8, max_length=64)


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


class BfsiSimSwapEmailConfigUpsertRequest(BaseModel):
    email_content: str = Field(min_length=1, max_length=5000)


class BfsiSimSwapEmailConfigResponse(BaseModel):
    email: str
    email_content: str
    created_at: str
    updated_at: str


class BfsiSimSwapEmailConfigStatusResponse(BaseModel):
    config: BfsiSimSwapEmailConfigResponse | None = None


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
    ai_tokens: int | None = None
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
    total_ai_tokens: int = 0
    send_count: int
    notification_count: int
    channel_prices: dict[str, int]
    channel_counts: dict[str, int]
    baseline_cost_paise: int
    savings_paise: int
    savings_percent: float


class TaskNoteAnalysisTask(BaseModel):
    title: str
    priority: Literal["high", "medium", "low"] = "medium"


class TaskNoteAnalysis(BaseModel):
    summary: str
    tasks: list[TaskNoteAnalysisTask]
    focus: str
    source: str = "openai"


class TaskNoteItem(BaseModel):
    id: str
    title: str
    content: str
    note_date: str
    labels: list[str]
    ai_analysis: TaskNoteAnalysis | None = None
    created_at: str
    updated_at: str


class TaskNoteCreateRequest(BaseModel):
    title: str = Field(default="", max_length=200)
    content: str = Field(min_length=1, max_length=10000)
    note_date: str = Field(min_length=10, max_length=10, pattern=r"^\d{4}-\d{2}-\d{2}$")
    labels: list[str] = Field(default_factory=list, max_length=20)


class TaskNoteUpdateRequest(BaseModel):
    title: str = Field(default="", max_length=200)
    content: str = Field(min_length=1, max_length=10000)
    note_date: str = Field(min_length=10, max_length=10, pattern=r"^\d{4}-\d{2}-\d{2}$")
    labels: list[str] = Field(default_factory=list, max_length=20)


class TaskNoteListResponse(BaseModel):
    items: list[TaskNoteItem]
    total: int


class TaskNoteDateSummary(BaseModel):
    note_date: str
    note_count: int


class TaskNoteDatesResponse(BaseModel):
    dates: list[TaskNoteDateSummary]


class TaskNoteLabelsResponse(BaseModel):
    labels: list[str]


class TaskNoteAnalysisResponse(BaseModel):
    note: TaskNoteItem
    analysis: TaskNoteAnalysis


class TaskNoteSummarizeRequest(BaseModel):
    date_from: str = Field(min_length=10, max_length=10, pattern=r"^\d{4}-\d{2}-\d{2}$")
    date_to: str = Field(min_length=10, max_length=10, pattern=r"^\d{4}-\d{2}-\d{2}$")


class TaskNoteSummarySection(BaseModel):
    label: str
    summary: str
    highlights: list[str]
    tasks: list[TaskNoteAnalysisTask]


class TaskNoteSummarizeResponse(BaseModel):
    date_from: str
    date_to: str
    note_count: int
    overview: str
    sections: list[TaskNoteSummarySection]
    source: str


class TaskUserProfile(BaseModel):
    email: str
    created_at: str


class TaskAuthRegisterRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class TaskAuthLoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=1, max_length=128)


class TaskAuthResponse(BaseModel):
    token: str
    user: TaskUserProfile


class NetworkCheckRequest(BaseModel):
    phone_number: str = Field(
        min_length=10,
        max_length=20,
        description="Mobile number with country code or local 10-digit format.",
        examples=["9876543210", "+919876543210"],
    )
    sim_swap: bool = Field(
        default=True,
        description="When true, include SIM swap status and risk level in the response.",
    )
    location: bool = Field(
        default=True,
        description="When true, include approximate country, region, city, and carrier.",
    )


class SimSwapCheckResult(BaseModel):
    checked: bool
    status: Literal["no_swap", "recent_swap", "unknown"]
    swapped_within_days: int | None = Field(
        default=None,
        description="Days since last SIM swap when status is recent_swap.",
    )
    risk_level: Literal["low", "medium", "high"]


class LocationCheckResult(BaseModel):
    checked: bool
    country: str
    region: str
    city: str
    carrier: str


class NetworkCheckResponse(BaseModel):
    phone_number: str = Field(description="Normalized 10-digit mobile number.")
    checked_at: str = Field(description="ISO-8601 UTC timestamp of the check.")
    sim_swap: SimSwapCheckResult | None = None
    location: LocationCheckResult | None = None
    price_paise: int | None = Field(
        default=None,
        description="Usage cost in paise when a SIM swap check is performed (5 paise).",
    )


class PaymentRegisterVerifyRequest(BaseModel):
    phone_number: str = Field(min_length=10, max_length=20)
    email: str = Field(min_length=5, max_length=254)


class PaymentRegisterVerifyResponse(BaseModel):
    allowed: bool
    blocked_reason: str | None = None
    sim_swap: SimSwapCheckResult | None = None
    alert_email_sent: bool = False


class UrlStrengthLimitsResponse(BaseModel):
    limit: int
    remaining: int
    retry_after_seconds: int
    ai_unlocked: bool = False


class UrlStrengthAnalyzeRequest(BaseModel):
    url: str = Field(min_length=4, max_length=2048, description="Website URL to analyze.")
    use_ai: bool = Field(
        default=False,
        description="When true, run OpenAI risk synthesis. Requires a valid access password.",
    )


class UrlStrengthSignalItem(BaseModel):
    name: str
    value: str
    detail: str


class UrlStrengthAnalyzeResponse(BaseModel):
    input_url: str
    final_url: str
    risk_level: Literal["low", "medium", "high"]
    summary: str
    reasons: list[str]
    content_assessment: str
    recommendation: str
    technologies: list[str]
    technical_signals: list[UrlStrengthSignalItem]
    spam_flags: list[str]
    domain: str
    domain_age_days: int | None = None
    domain_registered_at: str | None = None
    source: str
    ai_tokens: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
