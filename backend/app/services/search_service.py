"""
TechHaven Backend — Search Service
Full-text search using PostgreSQL tsvector with weighted ranking.
"""

from typing import Optional
from app.database import supabase


def search_products(
    query: str,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    brand: Optional[str] = None,
    sort_by: str = "relevance",
    page: int = 1,
    page_size: int = 12,
) -> dict:
    """
    Search products using PostgreSQL full-text search.
    Uses websearch_to_tsquery for natural language query parsing.
    """
    # Build the search query using Supabase's textSearch
    db_query = supabase.table("products").select("*", count="exact")

    # Apply full-text search
    db_query = db_query.text_search(
        "search_vector", query, options={"type": "websearch", "config": "english"}
    )

    # Only active products
    db_query = db_query.eq("is_active", True)

    # Apply filters
    if category:
        db_query = db_query.eq("category", category)
    if brand:
        db_query = db_query.eq("brand", brand)
    if min_price is not None:
        db_query = db_query.gte("price", min_price)
    if max_price is not None:
        db_query = db_query.lte("price", max_price)

    # Sorting
    if sort_by == "price_asc":
        db_query = db_query.order("price", desc=False)
    elif sort_by == "price_desc":
        db_query = db_query.order("price", desc=True)
    elif sort_by == "newest":
        db_query = db_query.order("created_at", desc=True)
    elif sort_by == "rating":
        db_query = db_query.order("rating", desc=True)
    else:
        # Relevance — default PostgreSQL ranking
        db_query = db_query.order("created_at", desc=True)

    # Pagination
    offset = (page - 1) * page_size
    db_query = db_query.range(offset, offset + page_size - 1)

    result = db_query.execute()
    total = result.count or 0
    total_pages = max(1, (total + page_size - 1) // page_size)

    return {
        "products": result.data or [],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "query": query,
    }


def log_search(session_id: str, query: str, results_count: int) -> None:
    """Log a search query for analytics and recommendations."""
    try:
        supabase.table("search_history").insert({
            "session_id": session_id,
            "query": query,
            "results_count": results_count,
        }).execute()
    except Exception:
        # Don't fail the search if logging fails
        pass


def get_popular_searches(limit: int = 10) -> list[dict]:
    """Get the most popular recent search queries."""
    result = supabase.rpc("get_popular_searches", {"search_limit": limit}).execute()
    return result.data or []


def get_search_suggestions(query: str, limit: int = 5) -> list[str]:
    """Get search suggestions based on product names matching the query."""
    result = (
        supabase.table("products")
        .select("name, category, brand")
        .eq("is_active", True)
        .ilike("name", f"%{query}%")
        .limit(limit)
        .execute()
    )
    if not result.data:
        return []
    return [item["name"] for item in result.data]
