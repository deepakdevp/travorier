# backend/app/services/qr_service.py
import qrcode
import io
import secrets
from PIL import Image


def generate_qr_png(data: str) -> bytes:
    """Generate a QR code PNG image for the given data string."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img: Image.Image = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_match_qr_payload(match_id: str, secret: str) -> str:
    """Return the string encoded in the QR: 'travorier:match_id:secret'"""
    return f"travorier:{match_id}:{secret}"


def generate_secret() -> str:
    """Generate a cryptographically secure 32-char hex secret."""
    return secrets.token_hex(16)
