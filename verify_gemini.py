#!/usr/bin/env python3
"""
Quick verification of Gemini API connection
"""

import os
import sys

# Set the API key directly for testing
os.environ["GEMINI_API_KEY"] = "AIzaSyAU8I28ivCoQ-jCmNTFd8thM30WgRUkVYU"
os.environ["GEMINI_MODEL"] = "gemini-1.5-flash-001"

try:
    from google import genai
    print("Google Generative AI library imported successfully")
    
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    
    # Test the API
    response = client.models.generate_content(
        model=os.environ["GEMINI_MODEL"],
        contents="Test: Respond with 'API working' if you receive this",
        config={
            "temperature": 0.1,
            "max_output_tokens": 50,
        }
    )
    
    result = getattr(response, "text", "")
    print(f"API Test Result: {result}")
    
    if "API working" in result or "working" in result.lower():
        print("SUCCESS: Gemini API is working correctly!")
    else:
        print("API responded but with unexpected content")
        
except ImportError:
    print("ERROR: google-generativeai not installed")
    print("Run: pip install google-generativeai")
except Exception as e:
    print(f"ERROR: {e}")
    
    # Try the original model name from the curl command
    try:
        print("Trying with gemini-flash-latest...")
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents="Test",
            config={"max_output_tokens": 10}
        )
        print("SUCCESS with gemini-flash-latest model")
    except Exception as e2:
        print(f"Also failed with gemini-flash-latest: {e2}")
