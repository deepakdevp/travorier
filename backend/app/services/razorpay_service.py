# backend/app/services/razorpay_service.py
"""
Razorpay payment service.
Flow: create_order → mobile opens checkout → verify_signature → add credits.
"""
import hmac
import hashlib
import razorpay
from app.core.config import settings
from app.services.stripe_service import get_pack  # reuse pack definitions


def _client() -> razorpay.Client:
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_order(pack_id: str, user_id: str) -> dict:
    """Create a Razorpay order. Returns the full order dict with id, amount, currency."""
    pack = get_pack(pack_id)
    if pack is None:
        raise ValueError(f"Unknown pack_id: {pack_id}")
    client = _client()
    order = client.order.create({
        "amount": pack["amount_paise"],
        "currency": "INR",
        "receipt": f"{user_id[:8]}_{pack_id}",
        "notes": {"user_id": user_id, "pack_id": pack_id, "credits": str(pack["credits"])},
    })
    return order


def verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify Razorpay HMAC-SHA256 payment signature. Returns True if valid."""
    msg = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(), msg, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """Verify Razorpay webhook signature."""
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
