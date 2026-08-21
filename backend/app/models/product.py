"""
TechHaven Backend — Product Models
Pydantic models for product data validation and serialization.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    """Base product fields shared across create/update/response."""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    sale_price: Optional[float] = Field(None, gt=0)
    category: str = Field(..., min_length=1)
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    specifications: dict = Field(default_factory=dict)
    images: list[str] = Field(default_factory=list)
    stock: int = Field(default=0, ge=0)
    is_featured: bool = False
    is_active: bool = True


class ProductCreate(ProductBase):
    """Schema for creating a new product."""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating a product (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    sale_price: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    tags: Optional[list[str]] = None
    specifications: Optional[dict] = None
    images: Optional[list[str]] = None
    stock: Optional[int] = Field(None, ge=0)
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    """Schema for product API responses."""
    id: str
    slug: str
    images: list[str] = Field(default_factory=list)
    rating: float = 0
    review_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Paginated product list response."""
    products: list[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ChatMessage(BaseModel):
    """Schema for chatbot messages."""
    message: str = Field(..., min_length=1, max_length=1000)
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Schema for chatbot responses."""
    reply: str
    products: list[ProductResponse] = Field(default_factory=list)


class SearchQuery(BaseModel):
    """Schema for search queries."""
    q: str = Field(..., min_length=1)
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    brand: Optional[str] = None
    sort_by: str = "relevance"
    page: int = 1
    page_size: int = 12


class AdminLogin(BaseModel):
    """Schema for admin login."""
    email: str
    password: str


class TokenResponse(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
    admin_email: str
