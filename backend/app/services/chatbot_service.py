"""
TechHaven Backend — Chatbot Service
AI-powered product assistant using Groq API (LLaMA 3.3 70B).
Uses a RAG-lite approach: fetches relevant products and injects them as context.
"""

import json
from typing import Optional
from groq import Groq
from app.config import settings
from app.database import supabase

# Initialize Groq client
groq_client = Groq(api_key=settings.groq_api_key)

import re
import json
from typing import Optional
from groq import Groq
from app.config import settings
from app.database import supabase

# Initialize Groq client
groq_client = Groq(api_key=settings.groq_api_key)

SYSTEM_PROMPT = """You are TechHaven's friendly shopping assistant.

Rules for your responses:
- Keep answers SHORT, punchy, and conversational (1-2 brief paragraphs max).
- Sound like a helpful human store guide, never like a robot.
- Do NOT say "Based on the data provided" or "According to the context".
- When recommending items, highlight the product name, key feature, and price.
- If asked general questions (like how many items we have, what we sell, store info), answer warmly using the catalog overview.
- Do NOT output any <think> tags or reasoning logs. Only output the final customer-facing response.
"""


def _get_catalog_summary() -> dict:
    """Get general stats about the catalog to handle general questions."""
    try:
        count_res = supabase.table("products").select("id", count="exact").eq("is_active", True).execute()
        total_count = count_res.count or 0

        cats_res = supabase.table("products").select("category").eq("is_active", True).execute()
        cats = sorted(set(p["category"] for p in (cats_res.data or []) if p.get("category")))

        return {"total_products": total_count, "categories": cats}
    except Exception:
        return {"total_products": 21, "categories": [
            "Mobile Accessories", "Earbuds & Airpods", "Smart Watches",
            "Electronic Gadgets", "Flashlights & Searchlights", "TV Boxes",
            "Televisions", "Bluetooth Soundbars & Audio"
        ]}


def _fetch_relevant_products(query: str, limit: int = 6) -> list[dict]:
    """Fetch products relevant to the user's query using text search or fallback to featured."""
    clean_query = query.strip()

    # If query is very short or a general greeting/question
    general_terms = ["hi", "hello", "hey", "products", "how many", "all", "what do you have", "what do you sell"]
    is_general = any(term in clean_query.lower() for term in general_terms)

    if not is_general:
        try:
            result = (
                supabase.table("products")
                .select("name, description, price, sale_price, category, brand, specifications, rating, stock, slug")
                .text_search(
                    "search_vector", clean_query,
                    options={"type": "websearch", "config": "english"}
                )
                .eq("is_active", True)
                .limit(limit)
                .execute()
            )
            if result.data:
                return result.data
        except Exception:
            try:
                result = (
                    supabase.table("products")
                    .select("name, description, price, sale_price, category, brand, specifications, rating, stock, slug")
                    .eq("is_active", True)
                    .ilike("name", f"%{clean_query}%")
                    .limit(limit)
                    .execute()
                )
                if result.data:
                    return result.data
            except Exception:
                pass

    # Fallback to featured products so bot always has context
    try:
        fallback = (
            supabase.table("products")
            .select("name, description, price, sale_price, category, brand, specifications, rating, stock, slug")
            .eq("is_active", True)
            .order("rating", desc=True)
            .limit(limit)
            .execute()
        )
        return fallback.data or []
    except Exception:
        return []


def _format_product_context(products: list[dict], catalog_summary: dict) -> str:
    """Format product data and store summary as context for the LLM."""
    total = catalog_summary.get("total_products", 0)
    cats_str = ", ".join(catalog_summary.get("categories", []))

    context_parts = [
        f"STORE OVERVIEW:\n- Total active products in stock: {total}\n- Categories available: {cats_str}\n",
        "HIGHLIGHTED PRODUCTS:"
    ]

    for i, p in enumerate(products, 1):
        price_str = f"${p['price']}"
        if p.get("sale_price"):
            price_str = f"${p['sale_price']} (Sale)"

        context_parts.append(
            f"{i}. {p['name']} ({p.get('brand', 'TechHaven')}) - {p['category']} | Price: {price_str} | Rating: {p.get('rating', 5)}/5 | In Stock: {p.get('stock', 10)}"
        )

    return "\n".join(context_parts)


def chat_with_assistant(
    message: str,
    conversation_history: Optional[list[dict]] = None,
) -> dict:
    """
    Process a chat message and return a concise, natural AI response.
    """
    summary = _get_catalog_summary()
    relevant_products = _fetch_relevant_products(message)
    product_context = _format_product_context(relevant_products, summary)

    # Build messages array
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "system",
            "content": f"CATALOG CONTEXT:\n{product_context}",
        },
    ]

    # Add conversation history if provided (last 4 messages for concise context)
    if conversation_history:
        messages.extend(conversation_history[-4:])

    # Add current user message
    messages.append({"role": "user", "content": message})

    # Determine active models from Groq dynamically (prioritize direct chat models)
    preferred_order = [
        settings.groq_model,
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "groq/compound",
        "groq/compound-mini",
        "qwen/qwen3.6-27b",
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
    ]

    models_to_try = []
    try:
        remote_models = [m.id for m in groq_client.models.list().data if not m.id.startswith('whisper') and not 'guard' in m.id]
        for p in preferred_order:
            if p and p in remote_models and p not in models_to_try:
                models_to_try.append(p)
        for r in remote_models:
            if r not in models_to_try:
                models_to_try.append(r)
    except Exception:
        models_to_try = [m for m in preferred_order if m]

    reply = None
    last_error = None

    for model_name in models_to_try:
        try:
            completion = groq_client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.6,
                max_tokens=600,
                top_p=0.9,
            )
            raw_reply = completion.choices[0].message.content or ""
            
            # Clean thinking tags (both closed and unclosed)
            if "</think>" in raw_reply:
                clean_reply = raw_reply.split("</think>")[-1].strip()
            elif "<think>" in raw_reply:
                clean_reply = re.sub(r'<think>[\s\S]*', '', raw_reply).strip()
            else:
                clean_reply = raw_reply.strip()

            if clean_reply:
                reply = clean_reply
                break
        except Exception as e:
            last_error = e
            continue

    if not reply:
        return {
            "reply": f"I'm sorry, I'm having trouble connecting right now. Please try again! (Error: {str(last_error)})",
            "products": [],
        }

    # Return full product data for rendering product cards in the frontend
    full_products = []
    if relevant_products:
        product_slugs = [p["slug"] for p in relevant_products[:3]]
        try:
            full_result = (
                supabase.table("products")
                .select("*")
                .in_("slug", product_slugs)
                .execute()
            )
            full_products = full_result.data or []
        except Exception:
            full_products = []

    return {
        "reply": reply,
        "products": full_products,
    }
