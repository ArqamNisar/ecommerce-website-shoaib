"""
TechHaven Backend — Main Application
FastAPI entry point with CORS, routers, and health check.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, products, search, recommendations, chatbot

# Initialize FastAPI app
app = FastAPI(
    title="TechHaven API",
    description="Backend API for TechHaven — Premium Electronics E-Commerce",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS Middleware — allow frontend to call backend
origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(search.router)
app.include_router(recommendations.router)
app.include_router(chatbot.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "TechHaven API",
        "version": "1.0.0",
    }


@app.get("/")
async def root():
    """Root endpoint — redirect to API docs."""
    return {
        "message": "Welcome to TechHaven API",
        "docs": "/api/docs",
        "health": "/api/health",
    }
