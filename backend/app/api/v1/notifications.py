# backend/app/api/v1/notifications.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.core.dependencies import get_current_user
from app.services.supabase import get_supabase_admin_client

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationItem(BaseModel):
    id: str
    title: str
    body: str
    notification_type: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    deep_link: Optional[str] = None
    read: bool
    created_at: datetime


class UpdatePushTokenRequest(BaseModel):
    token: str  # Expo push token: ExponentPushToken[xxx]


@router.get("")
async def list_notifications(
    current_user=Depends(get_current_user),
) -> list[NotificationItem]:
    """List current user's 50 most recent notifications (unread first)."""
    supabase = get_supabase_admin_client()
    user_id = str(current_user.id)

    result = (
        supabase.table("notifications")
        .select("id, title, body, notification_type, related_entity_type, related_entity_id, deep_link, read, created_at")
        .eq("user_id", user_id)
        .order("read", desc=False)          # unread first
        .order("created_at", desc=True)     # then newest first
        .limit(50)
        .execute()
    )
    return result.data or []


@router.patch("/read-all")
async def mark_all_read(
    current_user=Depends(get_current_user),
) -> dict:
    """Mark all of current user's notifications as read."""
    supabase = get_supabase_admin_client()
    user_id = str(current_user.id)

    supabase.table("notifications").update({
        "read": True,
        "read_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", user_id).eq("read", False).execute()

    return {"success": True}


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    current_user=Depends(get_current_user),
) -> dict:
    """Mark a single notification as read."""
    supabase = get_supabase_admin_client()
    user_id = str(current_user.id)

    supabase.table("notifications").update({
        "read": True,
        "read_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", notification_id).eq("user_id", user_id).execute()

    return {"success": True}


@router.post("/register-token")
async def register_push_token(
    body: UpdatePushTokenRequest,
    current_user=Depends(get_current_user),
) -> dict:
    """Save user's Expo push token to their profile for push delivery."""
    supabase = get_supabase_admin_client()
    user_id = str(current_user.id)

    supabase.table("profiles").update({
        "fcm_token": body.token,
    }).eq("id", user_id).execute()

    return {"success": True}
