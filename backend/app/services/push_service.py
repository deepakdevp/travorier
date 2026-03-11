# backend/app/services/push_service.py
"""
Expo Push Notifications service.
No Firebase credentials needed — Expo's push service handles FCM/APNs routing.
Expo push tokens look like: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
"""
import httpx
import logging

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push(token: str, title: str, body: str, data: dict | None = None) -> bool:
    """
    Send a push notification via Expo's push service.
    Returns True on success, False on failure (never raises).
    """
    if not token or not token.startswith("ExponentPushToken["):
        logger.warning("send_push: invalid or missing token: %s", token)
        return False

    payload = {
        "to": token,
        "title": title,
        "body": body,
        "sound": "default",
        "data": data or {},
    }

    try:
        response = httpx.post(
            EXPO_PUSH_URL,
            json=payload,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            timeout=10.0,
        )
        result = response.json()
        # Expo returns {"data": {"status": "ok"}} on success
        status = result.get("data", {}).get("status")
        if status == "ok":
            return True
        else:
            logger.warning("send_push: Expo returned non-ok status: %s", result)
            return False
    except Exception as e:
        logger.error("send_push: failed to send push: %s", e)
        return False


def send_push_batch(messages: list[dict]) -> None:
    """
    Send multiple push notifications in one Expo batch call.
    Each message: {"to": token, "title": ..., "body": ..., "data": ...}
    Fire-and-forget, never raises.
    """
    if not messages:
        return
    try:
        httpx.post(
            EXPO_PUSH_URL,
            json=messages,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            timeout=10.0,
        )
    except Exception as e:
        logger.error("send_push_batch: %s", e)
