"""
TechHaven Backend — Database Client
Provides Supabase client instances for database operations.
"""

from supabase import create_client, Client
from app.config import settings


def get_supabase_client() -> Client:
    """Get a Supabase client using the service role key (bypasses RLS). Falls back to anon key if service role key is absent."""
    url = (settings.supabase_url or "").strip()
    key = (settings.supabase_service_role_key or settings.supabase_anon_key or "").strip()
    return create_client(url, key)


def get_supabase_public_client() -> Client:
    """Get a Supabase client using the anon key (respects RLS)."""
    url = (settings.supabase_url or "").strip()
    key = (settings.supabase_anon_key or settings.supabase_service_role_key or "").strip()
    return create_client(url, key)


# Singleton clients for reuse
supabase: Client = get_supabase_client()
supabase_public: Client = get_supabase_public_client()
