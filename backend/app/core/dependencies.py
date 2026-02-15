"""
FastAPI dependencies for authentication and common utilities
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client

from app.services.supabase import get_supabase_client
from app.core.security import decode_access_token


# HTTP Bearer token security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase_client)
) -> dict:
    """
    Dependency to get the current authenticated user

    Args:
        credentials: HTTP Bearer token from Authorization header
        supabase: Supabase client instance

    Returns:
        User data dictionary from Supabase Auth

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials

    try:
        # Verify token with Supabase
        user = supabase.auth.get_user(token)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user.user

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
) -> dict:
    """
    Dependency to get current user and verify they're active

    Args:
        current_user: Current user from get_current_user dependency
        supabase: Supabase client instance

    Returns:
        User profile data including verification status

    Raises:
        HTTPException: If user is inactive or deleted
    """
    # Fetch user profile from profiles table
    response = supabase.table("profiles").select("*").eq("id", current_user.id).single().execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )

    profile = response.data

    # Check if user is soft-deleted
    if profile.get("deleted_at"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return profile


async def get_verified_user(
    current_user: dict = Depends(get_current_active_user)
) -> dict:
    """
    Dependency to ensure user has completed ID verification

    Args:
        current_user: Current active user profile

    Returns:
        Verified user profile data

    Raises:
        HTTPException: If user is not verified
    """
    if not current_user.get("id_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ID verification required. Please complete KYC verification."
        )

    return current_user


async def get_phone_verified_user(
    current_user: dict = Depends(get_current_active_user)
) -> dict:
    """
    Dependency to ensure user has verified their phone number

    Args:
        current_user: Current active user profile

    Returns:
        Phone-verified user profile data

    Raises:
        HTTPException: If phone is not verified
    """
    if not current_user.get("phone_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Phone verification required. Please verify your phone number."
        )

    return current_user


# Optional user dependency (doesn't raise error if not authenticated)
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    supabase: Client = Depends(get_supabase_client)
) -> Optional[dict]:
    """
    Optional dependency to get current user (doesn't fail if not authenticated)

    Args:
        credentials: Optional HTTP Bearer token
        supabase: Supabase client instance

    Returns:
        User data if authenticated, None otherwise
    """
    if not credentials:
        return None

    try:
        user = supabase.auth.get_user(credentials.credentials)
        return user.user if user else None
    except:
        return None
