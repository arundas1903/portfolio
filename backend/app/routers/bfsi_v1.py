from fastapi import APIRouter, Depends, HTTPException

from app.models import BfsiSendNotificationRequest, BfsiSendNotificationResponse
from app.openapi import get_bfsi_owner_email
from app.services.bfsi import database as db
from app.services.bfsi.notifications import send_notification

v1_router = APIRouter(prefix="/v1", tags=["bfsi-v1"])


@v1_router.post(
    "/notifications/send",
    response_model=BfsiSendNotificationResponse,
    summary="Send notification (v1)",
    description=(
        "Route a notification using a saved template and explicit transaction amount.\n\n"
        "**Header:** `X-BFSI-Owner-Email` — must match the account that owns the template.\n\n"
        "**Routing:** compares `amount` to the template threshold and picks SMS, email, or push."
    ),
    openapi_extra={"security": [{"BfsiOwnerEmail": []}]},
)
async def bfsi_v1_send_notification(
    body: BfsiSendNotificationRequest,
    owner_email: str = Depends(get_bfsi_owner_email),
) -> BfsiSendNotificationResponse:
    if not db.get_user(owner_email):
        db.upsert_user(owner_email)

    result, error = send_notification(
        owner_email=owner_email,
        template_id=body.template_id.strip(),
        amount=body.amount,
        email=body.audience.email,
        phone=body.audience.phone,
    )
    if error:
        status = 404 if error == "Template not found." else 400
        raise HTTPException(status_code=status, detail=error)
    if not result:
        raise HTTPException(status_code=500, detail="Could not send notification")
    return BfsiSendNotificationResponse(**result)
