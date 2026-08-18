"""
TechHaven Backend — Product Service
Handles all product-related business logic and database operations.
"""

import re
from typing import Optional
from app.database import supabase


def generate_slug(name: str) -> str:
    """Generate a URL-friendly slug from a product name."""
    slug = name.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug


def ensure_unique_slug(slug: str, exclude_id: Optional[str] = None) -> str:
    """Ensure the slug is unique by appending a counter if necessary."""
    original_slug = slug
    counter = 1
    while True:
        query = supabase.table("products").select("id").eq("slug", slug)
        if exclude_id:
            query = query.neq("id", exclude_id)
        result = query.execute()
        if not result.data:
            return slug
        slug = f"{original_slug}-{counter}"
        counter += 1


def get_products(
    page: int = 1,
    page_size: int = 12,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_featured: Optional[bool] = None,
    is_active: bool = True,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> dict:
    """Get a paginated list of products with optional filters."""
    query = supabase.table("products").select(
        "*", count="exact"
    )

    # Apply filters
    query = query.eq("is_active", is_active)

    if category:
        query = query.eq("category", category)
    if brand:
        query = query.eq("brand", brand)
    if min_price is not None:
        query = query.gte("price", min_price)
    if max_price is not None:
        query = query.lte("price", max_price)
    if is_featured is not None:
        query = query.eq("is_featured", is_featured)

    # Sorting
    ascending = sort_order == "asc"
    query = query.order(sort_by, desc=not ascending)

    # Pagination
    offset = (page - 1) * page_size
    query = query.range(offset, offset + page_size - 1)

    result = query.execute()
    total = result.count or 0
    total_pages = max(1, (total + page_size - 1) // page_size)

    return {
        "products": result.data or [],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_product_by_id(product_id: str) -> Optional[dict]:
    """Get a single product by its ID."""
    result = (
        supabase.table("products")
        .select("*")
        .eq("id", product_id)
        .single()
        .execute()
    )
    return result.data


def get_product_by_slug(slug: str) -> Optional[dict]:
    """Get a single product by its slug."""
    result = (
        supabase.table("products")
        .select("*")
        .eq("slug", slug)
        .single()
        .execute()
    )
    return result.data


def create_product(product_data: dict) -> dict:
    """Create a new product."""
    # Generate slug from name
    slug = generate_slug(product_data["name"])
    slug = ensure_unique_slug(slug)
    product_data["slug"] = slug

    # Remove None values
    product_data = {k: v for k, v in product_data.items() if v is not None}

    result = supabase.table("products").insert(product_data).execute()
    return result.data[0] if result.data else {}


def update_product(product_id: str, product_data: dict) -> dict:
    """Update an existing product."""
    # Remove None values to only update provided fields
    update_data = {k: v for k, v in product_data.items() if v is not None}

    # If name is being updated, regenerate slug
    if "name" in update_data:
        slug = generate_slug(update_data["name"])
        slug = ensure_unique_slug(slug, exclude_id=product_id)
        update_data["slug"] = slug

    result = (
        supabase.table("products")
        .update(update_data)
        .eq("id", product_id)
        .execute()
    )
    return result.data[0] if result.data else {}


def delete_product(product_id: str) -> bool:
    """Delete a product by its ID."""
    result = (
        supabase.table("products")
        .delete()
        .eq("id", product_id)
        .execute()
    )
    return bool(result.data)


def get_categories() -> list[dict]:
    """Get all unique product categories with counts."""
    result = supabase.table("products").select("category").eq("is_active", True).execute()
    if not result.data:
        return []

    category_counts = {}
    for item in result.data:
        cat = item["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1

    return [
        {"name": name, "count": count}
        for name, count in sorted(category_counts.items())
    ]


def get_brands() -> list[str]:
    """Get all unique product brands."""
    result = (
        supabase.table("products")
        .select("brand")
        .eq("is_active", True)
        .not_.is_("brand", "null")
        .execute()
    )
    if not result.data:
        return []
    return sorted(set(item["brand"] for item in result.data if item["brand"]))
