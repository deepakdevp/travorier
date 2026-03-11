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
    # Insert notification record — capture id for later update
    notification_id: Optional[str] = None
    try:
        insert_result = supabase.table("notifications").insert({
            "user_id": user_id,
            "title": title,
            "body": body,
            "notification_type": notification_type,
            "related_entity_type": related_entity_type,
            "related_entity_id": related_entity_id,
            "deep_link": deep_link,
            "push_sent": False,
        }).execute()
        notification_id = insert_result.data[0]["id"]
    except Exception as e:
        logger.error("create_and_send_notification: DB insert failed: %s", e)
        return

    # Fetch user's push token
    token: Optional[str] = None
    try:
        profile = supabase.table("profiles").select("fcm_token").eq("id", user_id).single().execute()
        token = profile.data.get("fcm_token") if profile.data else None
    except Exception as e:
        logger.error("create_and_send_notification: failed to fetch token: %s", e)
        return

    if not token:
        return  # No push token registered — notification is still stored in DB

    # Build data payload, omitting None values
    push_data: dict = {"type": notification_type}
    if related_entity_type is not None:
        push_data["entity_type"] = related_entity_type
    if related_entity_id is not None:
        push_data["entity_id"] = related_entity_id
    if deep_link is not None:
        push_data["deep_link"] = deep_link

    # Send push — wrapped in try/except to preserve never-raises guarantee
    push_ok = False
    try:
        push_ok = send_push(token=token, title=title, body=body, data=push_data)
    except Exception as e:
        logger.error("create_and_send_notification: push send failed unexpectedly: %s", e)

    if push_ok and notification_id:
        # Mark push_sent = True using the specific notification id (best effort)
        try:
            supabase.table("notifications").update({"push_sent": True}).eq("id", notification_id).execute()
        except Exception:
            pass
