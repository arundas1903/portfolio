from fastapi import APIRouter, Depends, HTTPException

from app.models import (
    NetworkCheckRequest,
    NetworkCheckResponse,
    PaymentRegisterVerifyRequest,
    PaymentRegisterVerifyResponse,
)
from app.openapi import get_bfsi_owner_email
from app.services.bfsi import database as bfsi_db
from app.services.bfsi.notifications import log_sim_swap_network_check, send_sim_swap_alert_email
from app.services.bfsi.pricing import get_sim_swap_price_paise
from app.services.payment.network import check_network
from app.services.payment.registration import SIM_SWAP_BLOCK_MESSAGE, is_recent_sim_swap

router = APIRouter(prefix="/api/payment", tags=["payment"])


def _ensure_owner(owner_email: str) -> None:
    if not bfsi_db.get_user(owner_email):
        bfsi_db.upsert_user(owner_email)


@router.post(
    "/network/check",
    response_model=NetworkCheckResponse,
    summary="Check SIM swap and location",
    description=(
        "Run carrier network intelligence for a mobile number. Requires `X-BFSI-Owner-Email`. "
        "SIM swap checks are billed at 5 paise and appear in notification logs."
    ),
)
async def network_check(
    body: NetworkCheckRequest,
    owner_email: str = Depends(get_bfsi_owner_email),
) -> NetworkCheckResponse:
    if not body.sim_swap and not body.location:
        raise HTTPException(status_code=400, detail="Enable at least one check: sim_swap or location.")

    _ensure_owner(owner_email)

    try:
        result = check_network(
            body.phone_number,
            sim_swap=body.sim_swap,
            location=body.location,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    price_paise = None
    if body.sim_swap and result.get("sim_swap"):
        log_sim_swap_network_check(
            owner_email=owner_email,
            phone_number=result["phone_number"],
            sim_swap_status=result["sim_swap"]["status"],
        )
        price_paise = get_sim_swap_price_paise()

    return NetworkCheckResponse(**result, price_paise=price_paise)


@router.post(
    "/register/verify",
    response_model=PaymentRegisterVerifyResponse,
    summary="Verify UPI registration against SIM swap rules",
    description="Requires `X-BFSI-Owner-Email` for SIM swap configuration and billing.",
)
async def verify_registration(
    body: PaymentRegisterVerifyRequest,
    owner_email: str = Depends(get_bfsi_owner_email),
) -> PaymentRegisterVerifyResponse:
    _ensure_owner(owner_email)

    try:
        network_result = check_network(body.phone_number, sim_swap=True, location=False)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    sim_swap = network_result.get("sim_swap")
    if sim_swap:
        log_sim_swap_network_check(
            owner_email=owner_email,
            phone_number=network_result["phone_number"],
            sim_swap_status=sim_swap["status"],
        )

    if not is_recent_sim_swap(sim_swap):
        return PaymentRegisterVerifyResponse(
            allowed=True,
            sim_swap=sim_swap,
            alert_email_sent=False,
        )

    alert_email_sent = False
    sim_swap_config = bfsi_db.get_sim_swap_email_config(owner_email)
    if sim_swap_config:
        _, send_error = send_sim_swap_alert_email(
            owner_email=owner_email,
            customer_email=body.email.strip(),
            customer_phone=network_result["phone_number"],
            message=sim_swap_config["email_content"],
        )
        alert_email_sent = send_error is None

    return PaymentRegisterVerifyResponse(
        allowed=False,
        blocked_reason=SIM_SWAP_BLOCK_MESSAGE,
        sim_swap=sim_swap,
        alert_email_sent=alert_email_sent,
    )
