"""
Centralized Gemini API Service for Code-Clash.
Consolidates SDK initialization, content generation, and JSON extraction.
"""

from __future__ import annotations
import json
import logging
import re
from typing import Any

from config import Config

logger = logging.getLogger(__name__)

try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-genai package not found. Run 'pip install google-genai'.")

def get_gemini_client() -> Any | None:
    """Returns a Gemini Client if available and API key is set."""
    if not GEMINI_AVAILABLE:
        return None
    if not Config.GEMINI_API_KEY:
        logger.debug("GEMINI_API_KEY not found in config.")
        return None
    try:
        return genai.Client(api_key=Config.GEMINI_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Gemini Client: {e}")
        return None

def call_gemini(
    prompt: str,
    system_instruction: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 1000,
    response_mime_type: str = "application/json"
) -> str:
    """
    Standardized call to Gemini model.
    Returns the raw response text or empty string on failure.
    """
    client = get_gemini_client()
    if not client:
        return ""

    try:
        config = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
            "response_mime_type": response_mime_type,
        }
        if system_instruction:
            config["system_instruction"] = system_instruction

        response = client.models.generate_content(
            model=Config.GEMINI_MODEL,
            contents=prompt,
            config=config
        )
        
        # In google-genai, response.text is the expected attribute
        # We use getattr to be safe during SDK transitions
        return getattr(response, "text", "") or ""
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        return ""

def extract_json_payload(text: str) -> str:
    """Extracts JSON from markdown code blocks or raw text."""
    raw = (text or "").strip()
    # Remove markdown code blocks
    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]
    
    if raw.endswith("```"):
        raw = raw[:-3]
    
    raw = raw.strip()

    # Try to find the first '{' and last '}'
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        return match.group(0)
    return raw

def is_gemini_ready() -> bool:
    """Returns True if the service can make calls."""
    return GEMINI_AVAILABLE and bool(Config.GEMINI_API_KEY)
