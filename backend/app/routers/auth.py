"""
TechHaven Backend — Auth Router
Admin authentication endpoints.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.models.product import AdminLogin, TokenResponse
from app.config import settings
from app.middleware.auth import create_access_token, get_current_admin

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def admin_login(credentials: AdminLogin):
    """Authenticate an admin user and return a JWT token."""
    if (
        credentials.email != settings.admin_email
        or credentials.password != settings.admin_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(
        data={"sub": credentials.email, "role": "admin"}
    )

    return TokenResponse(
        access_token=token,
        admin_email=credentials.email,
    )


@router.get("/me")
async def get_current_user(admin: dict = Depends(get_current_admin)):
    """Get the currently authenticated admin's information."""
    return {"email": admin["email"], "role": admin["role"]}
