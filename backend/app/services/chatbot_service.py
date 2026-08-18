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

SYSTEM_PROMPT = """You are TechHaven's AI Shopping Assistant — a friendly, knowledgeable electronics expert.

Your role:
- Help customers find the perfect electronics products from our catalog
- Answer questions about product features, specifications, and comparisons
- Provide honest recommendations based on the customer's needs and budget
- Be enthusiastic but truthful — never make up products or specs

Guidelines:
- Keep responses concise and helpful (2-4 paragraphs max)
- When recommending products, mention the product name, key features, and price
- If asked about products not in our catalog, politely say we don't carry that item currently
- Use a warm, professional tone — like a knowledgeable friend at a tech store
- Format prices clearly and mention any sale prices when available
- If a customer's budget is limited, suggest the best value options

Our product categories include: Mobile Accessories, Earbuds & Airpods, Smart Watches, Electronic Gadgets, Flashlights & Searchlights, TV Boxes, Televisions, and Bluetooth Soundbars & Audio.

IMPORTANT: Base your answers ONLY on the product data provided in the context. If no matching products are found, say so honestly.
"""


def _fetch_relevant_products(query: str, limit: int = 10) -> list[dict]:
    """Fetch products relevant to the user's query using text search."""
    try:
        result = (
            supabase.table("products")
            .select("name, description, price, sale_price, category, brand, specifications, rating, stock, slug")
            .text_search(
                "search_vector", query,
                options={"type": "websearch", "config": "english"}
            )
            .eq("is_active", True)
            .limit(limit)
            .execute()
        )
        return result.data or []
    except Exception:
        # If text search fails (e.g., query is too short), try ilike
        try:
            result = (
                supabase.table("products")
                .select("name, description, price, sale_price, category, brand, specifications, rating, stock, slug")
                .eq("is_active", True)
                .ilike("name", f"%{query}%")
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception:
            return []


def _format_product_context(products: list[dict]) -> str:
    """Format product data as context for the LLM."""
    if not products:
        return "No matching products found in the catalog."

    context_parts = ["Here are the relevant products from our catalog:\n"]
    for i, p in enumerate(products, 1):
        price_str = f"${p['price']}"
        if p.get("sale_price"):
            price_str = f"~~${p['price']}~~ **${p['sale_price']}** (ON SALE)"

        specs = ""
        if p.get("specifications"):
            specs_list = [f"  - {k}: {v}" for k, v in p["specifications"].items()]
            specs = "\n" + "\n".join(specs_list[:5])

        stock_status = "In Stock" if p.get("stock", 0) > 0 else "Out of Stock"

        context_parts.append(
            f"{i}. **{p['name']}** ({p.get('brand', 'TechHaven')})\n"
            f"   Category: {p['category']} | Price: {price_str}\n"
            f"   Rating: {'⭐' * int(p.get('rating', 0))}{' (' + str(p.get('rating', 0)) + '/5)' if p.get('rating') else ''}\n"
            f"   Status: {stock_status}\n"
            f"   {p.get('description', 'No description available.')[:200]}"
            f"{specs}\n"
        )

    return "\n".join(context_parts)


def chat_with_assistant(
    message: str,
    conversation_history: Optional[list[dict]] = None,
) -> dict:
    """
    Process a chat message and return the AI response with relevant products.
    Uses RAG-lite: fetches relevant products and provides them as context.
    """
    # Fetch relevant products based on the user's query
    relevant_products = _fetch_relevant_products(message)
    product_context = _format_product_context(relevant_products)

    # Build messages array
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "system",
            "content": f"PRODUCT CATALOG CONTEXT:\n{product_context}",
        },
    ]

    # Add conversation history if provided (last 6 messages for context)
    if conversation_history:
        messages.extend(conversation_history[-6:])

    # Add current user message
    messages.append({"role": "user", "content": message})

    # Call Groq API
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=800,
            top_p=0.9,
        )

        reply = completion.choices[0].message.content

        # Return full product data for rendering product cards in the frontend
        full_products = []
        if relevant_products:
            product_slugs = [p["slug"] for p in relevant_products[:4]]
            full_result = (
                supabase.table("products")
                .select("*")
                .in_("slug", product_slugs)
                .execute()
            )
            full_products = full_result.data or []

        return {
            "reply": reply,
            "products": full_products,
        }

    except Exception as e:
        return {
            "reply": f"I'm sorry, I'm having trouble connecting right now. Please try again in a moment. (Error: {str(e)})",
            "products": [],
        }
