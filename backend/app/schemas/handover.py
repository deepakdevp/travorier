# backend/app/schemas/handover.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ScheduleHandoverRequest(BaseModel):
    handover_location: str
    handover_time: datetime


class ScheduleHandoverResponse(BaseModel):
    match_id: str
    status: str
    handover_location: str
    handover_time: datetime


class GenerateQRResponse(BaseModel):
    match_id: str
    qr_code_url: str  # Public URL of QR image in Supabase Storage


class ScanQRRequest(BaseModel):
    qr_payload: str  # The decoded string from camera: "travorier:match_id:secret"


class ScanQRResponse(BaseModel):
    success: bool
    match_id: str
    delivered_at: Optional[datetime] = None
    message: str


class InspectionCreateRequest(BaseModel):
    match_id: str
    media_urls: list[str]
    media_type: str = "photo"
    notes: Optional[str] = None


class InspectionResponse(BaseModel):
    id: str
    match_id: str
    traveler_id: str
    sender_id: str
    media_urls: list[str]
    media_type: str
    inspected_at: datetime
    approved: bool
    notes: Optional[str] = None
