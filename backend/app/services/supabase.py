"""
Supabase client service
"""
from functools import lru_cache
from supabase import create_client, Client

from app.core.config import settings


@lru_cache()
def get_supabase_client() -> Client:
    """
    Create and cache a Supabase client instance

    Returns:
        Supabase Client instance configured with service role key
    """
    supabase: Client = create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_KEY
    )
    return supabase


def get_supabase_admin() -> Client:
    """
    Get Supabase client with admin privileges (service role)

    Use this for operations that bypass RLS policies

    Returns:
        Supabase Client with service role key
    """
    return get_supabase_client()
