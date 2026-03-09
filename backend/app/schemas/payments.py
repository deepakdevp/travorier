# backend/app/schemas/payments.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreditPackSchema(BaseModel):
    id: str
    credits: int
    amount_paise: int
    label: str


class CreateIntentRequest(BaseModel):
    pack_id: str  # "pack_5" | "pack_10" | "pack_20"


class CreateIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    pack: CreditPackSchema


class ConfirmPaymentRequest(BaseModel):
    payment_intent_id: str


class ConfirmPaymentResponse(BaseModel):
    success: bool
    credits_added: int
    new_balance: int


class CreditsResponse(BaseModel):
    balance: int
    total_purchased: int


class TransactionItem(BaseModel):
    id: str
    transaction_type: str
    amount: float
    credits_purchased: Optional[int] = None
    credits_used: Optional[int] = None
    payment_status: str
    created_at: datetime
