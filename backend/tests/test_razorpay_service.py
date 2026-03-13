import hmac
import hashlib
import pytest
from unittest.mock import patch, MagicMock


def test_create_order_returns_order_id():
    mock_order = {"id": "order_abc123", "amount": 24900, "currency": "INR"}
    with patch("razorpay.Client") as MockClient:
        MockClient.return_value.order.create.return_value = mock_order
        from app.services.razorpay_service import create_order
        result = create_order("pack_5", "user_123")
        assert result["id"] == "order_abc123"


def test_verify_signature_valid():
    key_secret = "test_secret"
    order_id = "order_abc123"
    payment_id = "pay_xyz789"
    msg = f"{order_id}|{payment_id}".encode()
    sig = hmac.new(key_secret.encode(), msg, hashlib.sha256).hexdigest()

    with patch("app.services.razorpay_service.settings") as mock_settings:
        mock_settings.RAZORPAY_KEY_SECRET = key_secret
        from app.services.razorpay_service import verify_signature
        assert verify_signature(order_id, payment_id, sig) is True


def test_verify_signature_invalid():
    with patch("app.services.razorpay_service.settings") as mock_settings:
        mock_settings.RAZORPAY_KEY_SECRET = "test_secret"
        from app.services.razorpay_service import verify_signature
        assert verify_signature("order_abc", "pay_xyz", "bad_sig") is False
