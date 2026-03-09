# backend/app/services/stripe_service.py
import stripe
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

CREDIT_PACKS = [
    {"id": "pack_5",  "credits": 5,  "amount_paise": 24900,  "label": "5 Credits"},
    {"id": "pack_10", "credits": 10, "amount_paise": 44900,  "label": "10 Credits"},
    {"id": "pack_20", "credits": 20, "amount_paise": 79900,  "label": "20 Credits"},
]

def get_pack(pack_id: str) -> dict | None:
    return next((p for p in CREDIT_PACKS if p["id"] == pack_id), None)

def create_payment_intent(pack_id: str, user_id: str) -> stripe.PaymentIntent:
    pack = get_pack(pack_id)
    if pack is None:
        raise ValueError(f"Unknown pack_id: {pack_id}")
    return stripe.PaymentIntent.create(
        amount=pack["amount_paise"],
        currency="inr",
        metadata={"user_id": user_id, "pack_id": pack_id, "credits": pack["credits"]},
    )

def retrieve_payment_intent(payment_intent_id: str) -> stripe.PaymentIntent:
    return stripe.PaymentIntent.retrieve(payment_intent_id)

def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
    return stripe.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )
