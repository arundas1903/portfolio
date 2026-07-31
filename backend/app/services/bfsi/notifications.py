from __future__ import annotations

from app.services.bfsi import database as db
from app.services.bfsi.intelligence import classify_transaction_message
from app.services.bfsi.pricing import get_channel_price_paise

AMOUNT_VARIABLE = "{amount}"
SMS_CHANNEL = "sms"
V2_TEMPLATE_ID = "v2"
V2_TEMPLATE_NAME = "V2 · AI routing"


def pick_channel(template: dict, amount: float) -> str:
    if amount > template["amount_threshold"]:
        return template["channel_if_above"]
    return template["channel_if_below"]


def render_message(content: str, amount: float) -> str:
    formatted_amount = f"{amount:g}"
    return content.replace(AMOUNT_VARIABLE, formatted_amount)


def validate_audience(channel: str, *, email: str | None, phone: str | None) -> str | None:
    normalized_email = (email or "").strip()
    normalized_phone = (phone or "").strip()

    if not normalized_email and not normalized_phone:
        return "Audience must include an email or phone number."

    if channel == "email" and not normalized_email:
        return "Email is required in audience when routing to the email channel."

    if channel in {"sms", "push"} and not normalized_phone:
        return f"Phone number is required in audience when routing to {channel}."

    return None


def send_notification(
    *,
    owner_email: str,
    template_id: str,
    amount: float,
    email: str | None,
    phone: str | None,
) -> tuple[dict | None, str | None]:
    template = db.get_template(owner_email, template_id)
    if not template:
        return None, "Template not found."

    channel = pick_channel(template, amount)
    audience_error = validate_audience(channel, email=email, phone=phone)
    if audience_error:
        return None, audience_error

    message = render_message(template["content"], amount)
    routing_reason = (
        f"Amount {amount:g} is {'greater than' if amount > template['amount_threshold'] else 'less than or equal to'} "
        f"threshold {template['amount_threshold']:g}"
    )
    price_paise = get_channel_price_paise(channel)
    record = db.create_notification(
        template_id=template_id,
        template_owner=template["email"],
        template_name=template["name"],
        amount=amount,
        channel=channel,
        message=message,
        audience_email=(email or "").strip() or None,
        audience_phone=(phone or "").strip() or None,
        routing_reason=routing_reason,
        price_paise=price_paise,
    )

    return {
        "notification_id": record["id"],
        "template_id": template_id,
        "template_name": template["name"],
        "amount": amount,
        "channel": channel,
        "message": message,
        "audience": {
            "email": record["audience_email"],
            "phone": record["audience_phone"],
        },
        "price_paise": price_paise,
        "status": record["status"],
        "routing_reason": routing_reason,
        "created_at": record["created_at"],
    }, None


async def send_notification_v2(
    *,
    owner_email: str,
    message_body: str,
    email: str | None,
    phone: str | None,
) -> tuple[dict | None, str | None]:
    trimmed_message = message_body.strip()
    if not trimmed_message:
        return None, "Message body is required."

    classification = await classify_transaction_message(trimmed_message)
    default_config = db.get_default_config(owner_email)
    active_config = db.get_active_default_config(owner_email)

    used_default_config = False
    amount = classification.get("amount")
    is_transaction = bool(classification.get("is_transaction"))

    if is_transaction and amount is not None and active_config:
        channel = pick_channel(active_config, amount)
        threshold = active_config["amount_threshold"]
        routing_reason = (
            f"{classification['reason']} Routed via default configuration: amount {amount:g} is "
            f"{'greater than' if amount > threshold else 'less than or equal to'} threshold {threshold:g}."
        )
        used_default_config = True
    elif not is_transaction:
        channel = SMS_CHANNEL
        routing_reason = f"{classification['reason']} Non-transaction message — routed to SMS."
        amount = amount if amount is not None else 0.0
    elif default_config and default_config["paused"]:
        channel = SMS_CHANNEL
        routing_reason = (
            f"{classification['reason']} Default configuration is paused — routed to SMS."
        )
        amount = amount if amount is not None else 0.0
    elif not default_config:
        channel = SMS_CHANNEL
        routing_reason = (
            f"{classification['reason']} Transaction detected but no default configuration — routed to SMS."
        )
        amount = amount if amount is not None else 0.0
    else:
        channel = SMS_CHANNEL
        routing_reason = f"{classification['reason']} Could not extract amount — routed to SMS."
        amount = 0.0

    audience_error = validate_audience(channel, email=email, phone=phone)
    if audience_error:
        return None, audience_error

    price_paise = get_channel_price_paise(channel)
    ai_usage = classification.get("ai_usage")
    record = db.create_notification(
        template_id=V2_TEMPLATE_ID,
        template_owner=db.normalize_email(owner_email),
        template_name=V2_TEMPLATE_NAME,
        amount=float(amount or 0),
        channel=channel,
        message=trimmed_message,
        audience_email=(email or "").strip() or None,
        audience_phone=(phone or "").strip() or None,
        routing_reason=routing_reason,
        price_paise=price_paise,
        ai_tokens=int(ai_usage["tokens"]) if ai_usage else None,
    )

    return {
        "notification_id": record["id"],
        "channel": channel,
        "message": trimmed_message,
        "audience": {
            "email": record["audience_email"],
            "phone": record["audience_phone"],
        },
        "amount": float(amount or 0) if is_transaction and amount is not None else None,
        "is_transaction": is_transaction,
        "used_default_config": used_default_config,
        "classification_reason": classification["reason"],
        "price_paise": price_paise,
        "status": record["status"],
        "routing_reason": routing_reason,
        "created_at": record["created_at"],
    }, None
