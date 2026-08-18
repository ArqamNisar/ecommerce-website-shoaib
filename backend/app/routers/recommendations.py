"""
TechHaven Backend — Recommendations Router
Product recommendation endpoints.
"""

from fastapi import APIRouter, Query
from typing import Optional

from app.services import recommendation_service

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("/similar/{product_id}")
async def get_similar_products(
    product_id: str,
    limit: int = Query(8, ge=1, le=20),
):
    """Get products similar to the given product."""
    products = recommendation_service.get_similar_products(product_id, limit)
    return {"products": products}


@router.get("/trending")
async def get_trending_products(limit: int = Query(8, ge=1, le=20)):
    """Get trending/most-viewed products."""
    products = recommendation_service.get_trending_products(limit)
    return {"products": products}


@router.get("/recently-viewed")
async def get_recently_viewed(
    session_id: str = Query(..., description="User session ID"),
    limit: int = Query(8, ge=1, le=20),
):
    """Get recently viewed products for a session."""
    products = recommendation_service.get_recently_viewed(session_id, limit)
    return {"products": products}


@router.get("/personalized")
async def get_personalized(
    session_id: str = Query(..., description="User session ID"),
    limit: int = Query(8, ge=1, le=20),
):
    """Get personalized recommendations based on browsing history."""
    products = recommendation_service.get_personalized_recommendations(
        session_id, limit
    )
    return {"products": products}
