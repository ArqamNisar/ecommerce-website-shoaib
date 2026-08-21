"""
TechHaven Backend — Main Application
FastAPI entry point with CORS, routers, and health check.
"""

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import auth, products, search, recommendations, chatbot

logger = logging.getLogger(__name__)

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
if "*" not in origins:
    origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler ensuring JSON response with CORS headers."""
    logger.error(f"Unhandled error handling {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
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
