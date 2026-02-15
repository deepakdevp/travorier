"""
Authentication API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.services.supabase import get_supabase_client
from app.core.dependencies import get_current_user

router = APIRouter()


@router.post("/auth/signup")
async def signup(
    supabase: Client = Depends(get_supabase_client)
):
    """Register a new user"""
    # TODO: Implement signup logic
    return {"message": "Signup endpoint - To be implemented"}


@router.post("/auth/login")
async def login(
    supabase: Client = Depends(get_supabase_client)
):
    """Login with email and password"""
    # TODO: Implement login logic
    return {"message": "Login endpoint - To be implemented"}


@router.post("/auth/google")
async def google_oauth(
    supabase: Client = Depends(get_supabase_client)
):
    """Google OAuth callback"""
    # TODO: Implement Google OAuth
    return {"message": "Google OAuth endpoint - To be implemented"}


@router.post("/auth/otp/send")
async def send_otp(
    supabase: Client = Depends(get_supabase_client)
):
    """Send OTP to phone number"""
    # TODO: Implement OTP sending
    return {"message": "Send OTP endpoint - To be implemented"}


@router.post("/auth/otp/verify")
async def verify_otp(
    supabase: Client = Depends(get_supabase_client)
):
    """Verify OTP code"""
    # TODO: Implement OTP verification
    return {"message": "Verify OTP endpoint - To be implemented"}


@router.get("/auth/me")
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    """Get current user information"""
    return current_user
