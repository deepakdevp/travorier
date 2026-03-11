# backend/app/api/v1/handover.py
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user
from app.schemas.handover import (
    ScheduleHandoverRequest, ScheduleHandoverResponse,
    GenerateQRResponse, ScanQRRequest, ScanQRResponse,
    InspectionCreateRequest, InspectionResponse,
)
from app.services.qr_service import generate_qr_png, generate_match_qr_payload, generate_secret
from app.services.supabase import get_supabase_admin_client
from app.services.notification_service import create_and_send_notification

router = APIRouter(prefix="/handover", tags=["Handover"])


@router.patch("/matches/{match_id}/schedule")
async def schedule_handover(
    match_id: str,
    body: ScheduleHandoverRequest,
    current_user=Depends(get_current_user),
) -> ScheduleHandoverResponse:
    """Confirm handover location and time. Transitions match to handover_scheduled."""
    supabase = get_supabase_admin_client()

    match = supabase.table("matches").select("*").eq("id", match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found")

    m = match.data
    user_id = str(current_user.id)
    if m["traveler_id"] != user_id and m["sender_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not a match participant")

    if m["status"] != "agreed":
        raise HTTPException(status_code=400, detail=f"Cannot schedule handover from status: {m['status']}")

    result = supabase.table("matches").update({
        "handover_location": body.handover_location,
        "handover_time": body.handover_time.isoformat(),
        "status": "handover_scheduled",
    }).eq("id", match_id).execute()

    updated = result.data[0]

    # Notify the other party about handover scheduling
    other_user_id = m["sender_id"] if user_id == m["traveler_id"] else m["traveler_id"]
    create_and_send_notification(
        supabase,
        user_id=other_user_id,
        title="Handover Scheduled",
        body=f"Pickup confirmed at {body.handover_location}",
        notification_type="handover",
        related_entity_type="match",
        related_entity_id=match_id,
        deep_link="/request-detail",
    )

    return ScheduleHandoverResponse(
        match_id=match_id,
        status=updated["status"],
        handover_location=updated["handover_location"],
        handover_time=updated["handover_time"],
    )


@router.post("/matches/{match_id}/qr")
async def generate_qr(
    match_id: str,
    current_user=Depends(get_current_user),
) -> GenerateQRResponse:
    """Generate and store QR code for match handover. Traveler only."""
    supabase = get_supabase_admin_client()

    match = supabase.table("matches").select("*").eq("id", match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found")

    m = match.data
    user_id = str(current_user.id)
    if m["traveler_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the traveler can generate QR")

    if m["status"] not in ("agreed", "handover_scheduled"):
        raise HTTPException(status_code=400, detail=f"Cannot generate QR from status: {m['status']}")

    # Idempotent: return existing if already generated
    if m.get("qr_code") and m.get("qr_code_url"):
        return GenerateQRResponse(match_id=match_id, qr_code_url=m["qr_code_url"])

    # Generate new secret + payload + PNG
    secret = generate_secret()
    payload = generate_match_qr_payload(match_id, secret)
    png_bytes = generate_qr_png(payload)

    # Upload PNG to Supabase Storage
    storage_path = f"qr/{match_id}.png"
    supabase.storage.from_("inspections").upload(
        path=storage_path,
        file=png_bytes,
        file_options={"content-type": "image/png", "upsert": "true"},
    )

    # Get signed URL valid 7 days
    signed = supabase.storage.from_("inspections").create_signed_url(storage_path, 604800)
    qr_url = signed["signedURL"]

    # Save to match
    supabase.table("matches").update({
        "qr_code": secret,
        "qr_code_url": qr_url,
        "status": "handover_scheduled",
    }).eq("id", match_id).execute()

    return GenerateQRResponse(match_id=match_id, qr_code_url=qr_url)


@router.get("/matches/{match_id}/qr")
async def get_qr(
    match_id: str,
    current_user=Depends(get_current_user),
) -> GenerateQRResponse:
    """Fetch the QR code URL for an existing match."""
    supabase = get_supabase_admin_client()
    match = supabase.table("matches").select("qr_code, qr_code_url, traveler_id, sender_id").eq("id", match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found")

    m = match.data
    user_id = str(current_user.id)
    if m["traveler_id"] != user_id and m["sender_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not a match participant")

    if not m.get("qr_code_url"):
        raise HTTPException(status_code=404, detail="QR not yet generated")

    return GenerateQRResponse(match_id=match_id, qr_code_url=m["qr_code_url"])


@router.post("/matches/{match_id}/scan-qr")
async def scan_qr(
    match_id: str,
    body: ScanQRRequest,
    current_user=Depends(get_current_user),
) -> ScanQRResponse:
    """Verify scanned QR payload and mark match as delivered."""
    supabase = get_supabase_admin_client()

    match = supabase.table("matches").select("*").eq("id", match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found")

    m = match.data
    user_id = str(current_user.id)
    if m["traveler_id"] != user_id and m["sender_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not a match participant")

    if m["status"] == "delivered":
        return ScanQRResponse(success=True, match_id=match_id, message="Already delivered")

    if m["status"] != "in_transit":
        raise HTTPException(status_code=400, detail=f"Cannot scan QR from status: {m['status']}")

    # Verify payload format: "travorier:match_id:secret"
    parts = body.qr_payload.split(":")
    if len(parts) != 3 or parts[0] != "travorier" or parts[1] != match_id:
        raise HTTPException(status_code=400, detail="Invalid QR payload format")

    scanned_secret = parts[2]
    if scanned_secret != m["qr_code"]:
        raise HTTPException(status_code=400, detail="QR code verification failed")

    delivered_at = datetime.now(timezone.utc)
    supabase.table("matches").update({
        "status": "delivered",
        "delivered_at": delivered_at.isoformat(),
    }).eq("id", match_id).execute()

    # Notify sender that package was delivered
    create_and_send_notification(
        supabase,
        user_id=m["sender_id"],
        title="Package Delivered! 🎉",
        body="Your package has been successfully delivered.",
        notification_type="handover",
        related_entity_type="match",
        related_entity_id=match_id,
        deep_link="/request-detail",
    )

    return ScanQRResponse(
        success=True,
        match_id=match_id,
        delivered_at=delivered_at,
        message="Package delivered successfully!",
    )


@router.post("/inspections")
async def create_inspection(
    body: InspectionCreateRequest,
    current_user=Depends(get_current_user),
) -> InspectionResponse:
    """Record inspection photos for a match handover. Traveler only."""
    supabase = get_supabase_admin_client()

    match = supabase.table("matches").select("traveler_id, sender_id, status").eq("id", body.match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found")

    m = match.data
    user_id = str(current_user.id)
    if m["traveler_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the traveler can submit inspection")

    if m["status"] not in ("handover_scheduled", "agreed"):
        raise HTTPException(status_code=400, detail="Match not in handover state")

    result = supabase.table("inspections").insert({
        "match_id": body.match_id,
        "traveler_id": user_id,
        "sender_id": m["sender_id"],
        "media_type": body.media_type,
        "media_urls": body.media_urls,
        "notes": body.notes,
        "approved": True,
    }).execute()

    # Transition match to in_transit after inspection
    supabase.table("matches").update({
        "status": "in_transit",
        "inspection_completed": True,
    }).eq("id", body.match_id).execute()

    row = result.data[0]
    return InspectionResponse(**row)


@router.get("/inspections/{match_id}")
async def get_inspections(
    match_id: str,
    current_user=Depends(get_current_user),
) -> list[InspectionResponse]:
    """Fetch inspection records for a match."""
    supabase = get_supabase_admin_client()

    match = supabase.table("matches").select("traveler_id, sender_id").eq("id", match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found")

    m = match.data
    user_id = str(current_user.id)
    if m["traveler_id"] != user_id and m["sender_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not a match participant")

    result = supabase.table("inspections").select("*").eq("match_id", match_id).order("inspected_at").execute()
    return result.data or []
