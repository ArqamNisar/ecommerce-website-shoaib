"""
TechHaven Backend — Products Router
CRUD endpoints for product management.
"""

import uuid
import base64
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Query
from typing import Optional

from app.models.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
)
from app.services import product_service
from app.services.recommendation_service import log_product_view
from app.middleware.auth import get_current_admin
from app.database import supabase

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_featured: Optional[bool] = None,
    sort_by: str = Query("created_at", regex="^(created_at|price|rating|name)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
):
    """Get a paginated list of products with optional filters."""
    result = product_service.get_products(
        page=page,
        page_size=page_size,
        category=category,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        is_featured=is_featured,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return result


@router.get("/categories")
async def list_categories():
    """Get all product categories with counts."""
    return product_service.get_categories()


@router.get("/brands")
async def list_brands():
    """Get all product brands."""
    return product_service.get_brands()


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, session_id: Optional[str] = None):
    """Get a single product by ID. Optionally logs the view for recommendations."""
    product = product_service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # Log view for recommendations
    if session_id:
        log_product_view(session_id, product_id)

    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate, admin: dict = Depends(get_current_admin)
):
    """Create a new product (admin only)."""
    result = product_service.create_product(product.model_dump())
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create product",
        )
    return result


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product: ProductUpdate,
    admin: dict = Depends(get_current_admin),
):
    """Update an existing product (admin only)."""
    existing = product_service.get_product_by_id(product_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    result = product_service.update_product(
        product_id, product.model_dump(exclude_unset=True)
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update product",
        )
    return result


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str, admin: dict = Depends(get_current_admin)
):
    """Delete a product (admin only)."""
    existing = product_service.get_product_by_id(product_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    success = product_service.delete_product(product_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete product",
        )


@router.post("/{product_id}/images")
async def upload_product_images(
    product_id: str,
    files: list[UploadFile] = File(...),
    admin: dict = Depends(get_current_admin),
):
    """Upload images for a product (admin only). Max 5 images per product."""
    existing = product_service.get_product_by_id(product_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    if len(files) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 images per upload",
        )

    uploaded_urls = []

    for file in files:
        # Validate file type
        if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {file.content_type}. Only JPEG, PNG, and WebP are allowed.",
            )

        # Generate unique filename
        ext = file.filename.split(".")[-1] if file.filename else "jpg"
        filename = f"products/{product_id}/{uuid.uuid4()}.{ext}"

        # Read file content
        content = await file.read()

        # Upload to Supabase Storage
        try:
            result = supabase.storage.from_("product-images").upload(
                filename, content, {"content-type": file.content_type}
            )

            # Get public URL
            public_url = supabase.storage.from_("product-images").get_public_url(
                filename
            )
            uploaded_urls.append(public_url)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image: {str(e)}",
            )

    # Update product with new image URLs
    current_images = existing.get("images", []) or []
    all_images = current_images + uploaded_urls

    product_service.update_product(product_id, {"images": all_images})

    return {"uploaded": uploaded_urls, "total_images": len(all_images)}
