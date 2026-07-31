from fastapi import APIRouter, Depends, HTTPException

from app.models import BfsiV2SendNotificationRequest, BfsiV2SendNotificationResponse
from app.openapi import get_bfsi_owner_email
from app.services.bfsi import database as db
from app.services.bfsi.notifications import send_notification_v2

v2_router = APIRouter(prefix="/v2", tags=["bfsi-v2"])


@v2_router.post(
    "/notifications/send",
    response_model=BfsiV2SendNotificationResponse,
    summary="Send notification (v2)",
    description=(
        "Send a notification from free-form message text.\n\n"
        "**Header:** `X-BFSI-Owner-Email` — account that owns the default configuration.\n\n"
        "**Routing logic:**\n"
        "1. AI classifies whether `message_body` is a transaction alert and extracts the amount.\n"
        "2. If transaction + amount + active default config → route by threshold rules.\n"
        "3. If non-transaction, paused/missing config, or no amount → SMS."
    ),
    openapi_extra={"security": [{"BfsiOwnerEmail": []}]},
)
async def bfsi_v2_send_notification(
    body: BfsiV2SendNotificationRequest,
    owner_email: str = Depends(get_bfsi_owner_email),
) -> BfsiV2SendNotificationResponse:
    if not db.get_user(owner_email):
        db.upsert_user(owner_email)

    result, error = await send_notification_v2(
        owner_email=owner_email,
        message_body=body.message_body,
        email=body.audience.email,
        phone=body.audience.phone,
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    if not result:
        raise HTTPException(status_code=500, detail="Could not send notification")
    return BfsiV2SendNotificationResponse(**result)
