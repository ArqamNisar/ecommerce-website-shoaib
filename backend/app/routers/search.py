"""
TechHaven Backend — Search Router
Product search endpoints using PostgreSQL full-text search.
"""

from fastapi import APIRouter, Query
from typing import Optional

from app.services import search_service

router = APIRouter(prefix="/api/search", tags=["Search"])


@router.get("")
async def search_products(
    q: str = Query(..., min_length=1, description="Search query"),
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = Query(
        "relevance",
        regex="^(relevance|price_asc|price_desc|newest|rating)$",
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    session_id: Optional[str] = None,
):
    """
    Search products using full-text search.
    Supports natural language queries like 'wireless headphones under $50'.
    """
    result = search_service.search_products(
        query=q,
        category=category,
        min_price=min_price,
        max_price=max_price,
        brand=brand,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )

    # Log search for analytics
    if session_id:
        search_service.log_search(session_id, q, result.get("total", 0))

    return result


@router.get("/suggestions")
async def get_suggestions(
    q: str = Query(..., min_length=1, description="Partial search query"),
    limit: int = Query(5, ge=1, le=10),
):
    """Get search suggestions as the user types."""
    suggestions = search_service.get_search_suggestions(q, limit)
    return {"suggestions": suggestions}


@router.get("/popular")
async def get_popular_searches(limit: int = Query(10, ge=1, le=20)):
    """Get the most popular recent search queries."""
    popular = search_service.get_popular_searches(limit)
    return {"searches": popular}
