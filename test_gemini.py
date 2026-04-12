#!/usr/bin/env python3
"""
Test script to verify Gemini API connection
"""

import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from google import genai
    from backend.config import Config
    print("Google Generative AI library imported successfully")
except ImportError as e:
    print(f"Failed to import google-generativeai: {e}")
    print("Install with: pip install google-generativeai")
    sys.exit(1)

# Test API key
api_key = "AIzaSyAU8I28ivCoQ-jCmNTFd8thM30WgRUkVYU"
model_name = "gemini-1.5-flash"

print(f"Testing Gemini API with model: {model_name}")

try:
    client = genai.Client(api_key=api_key)
    
    # Simple test
    response = client.models.generate_content(
        model=model_name,
        contents="Explain how AI works in a few words",
        config={
            "temperature": 0.2,
            "max_output_tokens": 100,
        }
    )
    
    result = getattr(response, "text", "")
    print(f"API Response: {result}")
    print("Gemini API is working correctly!")
    
except Exception as e:
    print(f"Error calling Gemini API: {e}")
    
    # Try alternative model names
    alternatives = ["gemini-flash-latest", "gemini-1.5-flash-latest", "gemini-pro"]
    for alt_model in alternatives:
        try:
            print(f"Trying alternative model: {alt_model}")
            response = client.models.generate_content(
                model=alt_model,
                contents="Test",
                config={"max_output_tokens": 10}
            )
            print(f"Success with model: {alt_model}")
            break
        except Exception as e2:
            print(f"Failed with {alt_model}: {e2}")
