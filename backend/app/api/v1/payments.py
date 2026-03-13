# backend/app/api/v1/payments.py
import json
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from typing import Optional

from app.core.dependencies import get_current_user
from app.schemas.payments import (
    CreateIntentRequest, CreateIntentResponse, CreditPackSchema,
    ConfirmPaymentRequest, ConfirmPaymentResponse,
    CreditsResponse, TransactionItem,
    RazorpayOrderRequest, RazorpayOrderResponse,
    RazorpayVerifyRequest, RazorpayVerifyResponse,
)
from app.services.stripe_service import (
    CREDIT_PACKS, get_pack,
    create_payment_intent, retrieve_payment_intent, construct_webhook_event,
)
from app.services.supabase import get_supabase_admin_client
from app.services.razorpay_service import (
    create_order as razorpay_create_order,
    verify_signature as razorpay_verify_signature,
    verify_webhook_signature as razorpay_verify_webhook,
)
from app.core.config import settings

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/packs")
async def list_packs() -> list[CreditPackSchema]:
    return [CreditPackSchema(**p) for p in CREDIT_PACKS]


@router.post("/create-intent", response_model=CreateIntentResponse)
async def create_intent(
    body: CreateIntentRequest,
    current_user=Depends(get_current_user),
):
    pack = get_pack(body.pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack_id")
    try:
        intent = create_payment_intent(body.pack_id, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return CreateIntentResponse(
        client_secret=intent.client_secret,
        payment_intent_id=intent.id,
        pack=CreditPackSchema(**pack),
    )


@router.post("/confirm-payment", response_model=ConfirmPaymentResponse)
async def confirm_payment(
    body: ConfirmPaymentRequest,
    current_user=Depends(get_current_user),
):
    """Called by mobile after PaymentSheet succeeds. Verifies with Stripe and credits user."""
    try:
        intent = retrieve_payment_intent(body.payment_intent_id)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if intent.status != "succeeded":
        raise HTTPException(status_code=400, detail=f"Payment not succeeded: {intent.status}")

    # Guard: metadata must match calling user
    if intent.metadata.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="User mismatch")

    pack_id = intent.metadata.get("pack_id")
    pack = get_pack(pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Unknown pack in metadata")

    credits_to_add = pack["credits"]
    supabase = get_supabase_admin_client()

    # Idempotency: check if this intent was already processed
    existing = supabase.table("transactions").select("id").eq(
        "stripe_payment_intent_id", intent.id
    ).execute()
    if existing.data:
        # Already processed — return current balance
        profile = supabase.table("profiles").select("credit_balance, total_credits_purchased").eq(
            "id", current_user.id
        ).single().execute()
        return ConfirmPaymentResponse(
            success=True,
            credits_added=0,
            new_balance=profile.data["credit_balance"],
        )

    # Insert transaction record
    supabase.table("transactions").insert({
        "user_id": current_user.id,
        "transaction_type": "credit_purchase",
        "amount": pack["amount_paise"] / 100,
        "currency": "INR",
        "credits_purchased": credits_to_add,
        "credit_pack_size": credits_to_add,
        "stripe_payment_intent_id": intent.id,
        "payment_status": "succeeded",
    }).execute()

    # Update credit balance atomically via RPC
    result = supabase.rpc("add_credits", {
        "p_user_id": current_user.id,
        "p_credits": credits_to_add,
    }).execute()

    new_balance = result.data if isinstance(result.data, int) else credits_to_add

    return ConfirmPaymentResponse(
        success=True,
        credits_added=credits_to_add,
        new_balance=new_balance,
    )


@router.get("/credits", response_model=CreditsResponse)
async def get_credits(current_user=Depends(get_current_user)):
    supabase = get_supabase_admin_client()
    profile = supabase.table("profiles").select(
        "credit_balance, total_credits_purchased"
    ).eq("id", current_user.id).single().execute()
    data = profile.data or {}
    return CreditsResponse(
        balance=data.get("credit_balance", 0),
        total_purchased=data.get("total_credits_purchased", 0),
    )


@router.get("/transactions", response_model=list[TransactionItem])
async def get_transactions(
    current_user=Depends(get_current_user),
    limit: int = 20,
):
    supabase = get_supabase_admin_client()
    result = supabase.table("transactions").select("*").eq(
        "user_id", current_user.id
    ).order("created_at", desc=True).limit(limit).execute()
    return result.data or []


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
):
    payload = await request.body()
    try:
        event = construct_webhook_event(payload, stripe_signature or "")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        user_id = intent["metadata"].get("user_id")
        pack_id = intent["metadata"].get("pack_id")
        pack = get_pack(pack_id)
        if not user_id or not pack:
            return {"status": "ignored"}

        supabase = get_supabase_admin_client()
        # Idempotency check
        existing = supabase.table("transactions").select("id").eq(
            "stripe_payment_intent_id", intent["id"]
        ).execute()
        if existing.data:
            return {"status": "already_processed"}

        supabase.table("transactions").insert({
            "user_id": user_id,
            "transaction_type": "credit_purchase",
            "amount": pack["amount_paise"] / 100,
            "currency": "INR",
            "credits_purchased": pack["credits"],
            "credit_pack_size": pack["credits"],
            "stripe_payment_intent_id": intent["id"],
            "payment_status": "succeeded",
        }).execute()

        supabase.rpc("add_credits", {
            "p_user_id": user_id,
            "p_credits": pack["credits"],
        }).execute()

    return {"status": "ok"}


@router.post("/razorpay/create-order", response_model=RazorpayOrderResponse)
async def razorpay_create_order_endpoint(
    body: RazorpayOrderRequest,
    current_user=Depends(get_current_user),
):
    pack = get_pack(body.pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack_id")
    try:
        order = razorpay_create_order(body.pack_id, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return RazorpayOrderResponse(
        order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        key_id=settings.RAZORPAY_KEY_ID,
        pack=CreditPackSchema(**pack),
    )


@router.post("/razorpay/verify", response_model=RazorpayVerifyResponse)
async def razorpay_verify_payment(
    body: RazorpayVerifyRequest,
    current_user=Depends(get_current_user),
):
    """Called by mobile after Razorpay checkout succeeds. Verifies signature and credits user."""
    if not razorpay_verify_signature(
        body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature
    ):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    pack = get_pack(body.pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Unknown pack_id")

    supabase = get_supabase_admin_client()

    # Idempotency: check if this payment was already processed
    existing = supabase.table("transactions").select("id").eq(
        "razorpay_payment_id", body.razorpay_payment_id
    ).execute()
    if existing.data:
        profile = supabase.table("profiles").select("credit_balance").eq(
            "id", current_user.id
        ).single().execute()
        return RazorpayVerifyResponse(
            success=True, credits_added=0,
            new_balance=profile.data["credit_balance"],
        )

    supabase.table("transactions").insert({
        "user_id": current_user.id,
        "transaction_type": "credit_purchase",
        "amount": pack["amount_paise"] / 100,
        "currency": "INR",
        "credits_purchased": pack["credits"],
        "credit_pack_size": pack["credits"],
        "razorpay_payment_id": body.razorpay_payment_id,
        "razorpay_order_id": body.razorpay_order_id,
        "payment_status": "succeeded",
    }).execute()

    result = supabase.rpc("add_credits", {
        "p_user_id": current_user.id,
        "p_credits": pack["credits"],
    }).execute()

    new_balance = result.data if isinstance(result.data, int) else pack["credits"]

    return RazorpayVerifyResponse(
        success=True,
        credits_added=pack["credits"],
        new_balance=new_balance,
    )


@router.post("/razorpay/webhook")
async def razorpay_webhook(request: Request):
    """Razorpay webhook for async payment events (backup to verify endpoint)."""
    payload = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    if not razorpay_verify_webhook(payload, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event = json.loads(payload)
    if event.get("event") != "payment.captured":
        return {"status": "ignored"}

    payment = event["payload"]["payment"]["entity"]
    notes = payment.get("notes", {})
    user_id = notes.get("user_id")
    pack_id = notes.get("pack_id")
    payment_id = payment.get("id")

    pack = get_pack(pack_id)
    if not user_id or not pack:
        return {"status": "ignored"}

    supabase = get_supabase_admin_client()
    existing = supabase.table("transactions").select("id").eq(
        "razorpay_payment_id", payment_id
    ).execute()
    if existing.data:
        return {"status": "already_processed"}

    supabase.table("transactions").insert({
        "user_id": user_id,
        "transaction_type": "credit_purchase",
        "amount": pack["amount_paise"] / 100,
        "currency": "INR",
        "credits_purchased": pack["credits"],
        "credit_pack_size": pack["credits"],
        "razorpay_payment_id": payment_id,
        "payment_status": "succeeded",
    }).execute()

    supabase.rpc("add_credits", {
        "p_user_id": user_id,
        "p_credits": pack["credits"],
    }).execute()

    return {"status": "ok"}
