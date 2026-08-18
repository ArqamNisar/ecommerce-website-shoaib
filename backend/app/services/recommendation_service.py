"""
TechHaven Backend — Recommendation Service
Rule-based product recommendations using category, tags, and browsing history.
"""

from typing import Optional
from app.database import supabase


def get_similar_products(
    product_id: str, limit: int = 8
) -> list[dict]:
    """
    Get products similar to the given product.
    Matches by category, then by tags and price range.
    """
    # First, get the reference product
    product_result = (
        supabase.table("products")
        .select("category, subcategory, tags, price, brand")
        .eq("id", product_id)
        .single()
        .execute()
    )

    if not product_result.data:
        return []

    product = product_result.data
    category = product.get("category")
    price = product.get("price", 0)

    # Get products in the same category, excluding the current one
    result = (
        supabase.table("products")
        .select("*")
        .eq("category", category)
        .eq("is_active", True)
        .neq("id", product_id)
        .limit(limit)
        .execute()
    )

    similar = result.data or []

    # If we don't have enough, fill with products in a similar price range
    if len(similar) < limit:
        remaining = limit - len(similar)
        existing_ids = [p["id"] for p in similar] + [product_id]

        price_min = price * 0.5
        price_max = price * 1.5

        more_result = (
            supabase.table("products")
            .select("*")
            .eq("is_active", True)
            .gte("price", price_min)
            .lte("price", price_max)
            .not_.in_("id", existing_ids)
            .limit(remaining)
            .execute()
        )
        similar.extend(more_result.data or [])

    return similar[:limit]


def get_trending_products(limit: int = 8) -> list[dict]:
    """
    Get trending products based on recent views.
    Falls back to featured products if no view data.
    """
    # Try to get most-viewed products from last 7 days
    try:
        result = supabase.rpc(
            "get_trending_products", {"trending_limit": limit}
        ).execute()
        if result.data:
            return result.data
    except Exception:
        pass

    # Fallback: return featured products
    result = (
        supabase.table("products")
        .select("*")
        .eq("is_active", True)
        .eq("is_featured", True)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


def get_recently_viewed(session_id: str, limit: int = 8) -> list[dict]:
    """Get recently viewed products for a session."""
    views_result = (
        supabase.table("product_views")
        .select("product_id")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    if not views_result.data:
        return []

    product_ids = list(dict.fromkeys(
        item["product_id"] for item in views_result.data
    ))

    if not product_ids:
        return []

    products_result = (
        supabase.table("products")
        .select("*")
        .in_("id", product_ids)
        .eq("is_active", True)
        .execute()
    )

    # Preserve the order from views
    products_map = {p["id"]: p for p in (products_result.data or [])}
    return [products_map[pid] for pid in product_ids if pid in products_map]


def get_personalized_recommendations(
    session_id: str, limit: int = 8
) -> list[dict]:
    """
    Get personalized recommendations based on session history.
    Combines recently viewed categories with search history.
    """
    # Get categories from recently viewed products
    views_result = (
        supabase.table("product_views")
        .select("product_id")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    viewed_product_ids = []
    categories = set()

    if views_result.data:
        viewed_product_ids = [v["product_id"] for v in views_result.data]
        products_result = (
            supabase.table("products")
            .select("id, category")
            .in_("id", viewed_product_ids)
            .execute()
        )
        categories = set(p["category"] for p in (products_result.data or []))

    if not categories:
        # No history — return featured products
        return get_trending_products(limit)

    # Get products from viewed categories, excluding already-viewed ones
    result = (
        supabase.table("products")
        .select("*")
        .in_("category", list(categories))
        .eq("is_active", True)
        .not_.in_("id", viewed_product_ids)
        .order("rating", desc=True)
        .limit(limit)
        .execute()
    )

    return result.data or []


def log_product_view(session_id: str, product_id: str) -> None:
    """Log a product view for recommendation tracking."""
    try:
        supabase.table("product_views").insert({
            "session_id": session_id,
            "product_id": product_id,
        }).execute()
    except Exception:
        pass
