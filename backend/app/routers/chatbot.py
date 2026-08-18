"""
TechHaven Backend — Chatbot Router
AI-powered product assistant endpoint.
"""

from fastapi import APIRouter
from typing import Optional
from pydantic import BaseModel, Field

from app.services import chatbot_service

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])


class ChatRequest(BaseModel):
    """Incoming chat message from the frontend."""
    message: str = Field(..., min_length=1, max_length=1000)
    session_id: Optional[str] = None
    history: Optional[list[dict]] = None


@router.post("")
async def chat(request: ChatRequest):
    """
    Chat with TechHaven's AI shopping assistant.
    The assistant uses product data from the catalog to answer questions.
    """
    result = chatbot_service.chat_with_assistant(
        message=request.message,
        conversation_history=request.history,
    )
    return result
