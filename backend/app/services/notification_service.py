# backend/app/services/notification_service.py
"""
Creates a notification record in DB and sends push if user has a token.
"""
import logging
from typing import Optional
from .push_service import send_push

logger = logging.getLogger(__name__)


def create_and_send_notification(
    supabase,
    *,
    user_id: str,
    title: str,
    body: str,
    notification_type: str,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[str] = None,
    deep_link: Optional[str] = None,
) -> None:
    """
    Insert a notification record and fire a push notification.
    Silently logs errors — never raises.

    notification_type must be one of:
    'match', 'message', 'handover', 'flight_update', 'payment', 'review', 'system'
    """
    try:
        # Insert notification record
        supabase.table("notifications").insert({
            "user_id": user_id,
            "title": title,
            "body": body,
            "notification_type": notification_type,
            "related_entity_type": related_entity_type,
            "related_entity_id": related_entity_id,
            "deep_link": deep_link,
            "push_sent": False,
        }).execute()
    except Exception as e:
        logger.error("create_and_send_notification: DB insert failed: %s", e)
        return

    try:
        # Fetch user's push token
        profile = supabase.table("profiles").select("fcm_token").eq("id", user_id).single().execute()
        token = profile.data.get("fcm_token") if profile.data else None
    except Exception as e:
        logger.error("create_and_send_notification: failed to fetch token: %s", e)
        return

    if not token:
        return  # No push token registered — notification is still stored in DB

    push_ok = send_push(
        token=token,
        title=title,
        body=body,
        data={
            "type": notification_type,
            "entity_type": related_entity_type,
            "entity_id": related_entity_id,
            "deep_link": deep_link,
        },
    )

    if push_ok:
        # Mark push_sent = True (best effort)
        try:
            supabase.table("notifications").update({"push_sent": True}).eq("user_id", user_id).eq("title", title).eq("push_sent", False).execute()
        except Exception:
            pass
