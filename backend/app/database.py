"""
TechHaven Backend — Database Client
Provides Supabase client instances for database operations.
"""

from supabase import create_client, Client
from app.config import settings


def get_supabase_client() -> Client:
    """Get a Supabase client using the service role key (bypasses RLS)."""
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key
    )


def get_supabase_public_client() -> Client:
    """Get a Supabase client using the anon key (respects RLS)."""
    return create_client(
        settings.supabase_url,
        settings.supabase_anon_key
    )


# Singleton clients for reuse
supabase: Client = get_supabase_client()
supabase_public: Client = get_supabase_public_client()
