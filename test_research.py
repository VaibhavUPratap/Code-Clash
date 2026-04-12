#!/usr/bin/env python3
"""
Test script to verify Gemini API integration in research service
"""

import os
import sys

# Set environment variables directly
os.environ["GEMINI_API_KEY"] = "AIzaSyAU8I28ivCoQ-jCmNTFd8thM30WgRUkVYU"
os.environ["GEMINI_MODEL"] = "gemini-1.5-flash-001"

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from services.link_research_service import research_post_url
    print("Successfully imported research service")
    
    # Test with a simple URL
    test_url = "https://example.com"
    print(f"Testing research with URL: {test_url}")
    
    result = research_post_url(test_url)
    
    print("\n=== RESEARCH RESULTS ===")
    print(f"Research Mode: {result.get('research_mode', 'unknown')}")
    print(f"Virality Score: {result.get('virality', {}).get('score', 'N/A')}")
    print(f"Verdict: {result.get('assessment', {}).get('verdict', 'N/A')}")
    
    # Check if LLM synthesis was used
    if result.get('research_mode') == 'gemini':
        print("SUCCESS: LLM synthesis (Gemini) is working!")
        print(f"Summary: {result.get('assessment', {}).get('summary', 'N/A')}")
        print(f"Topics: {result.get('assessment', {}).get('key_topics', [])}")
        print(f"Risk Signals: {result.get('assessment', {}).get('risk_signals', [])}")
    else:
        print("FALLBACK: Using heuristic analysis")
        print(f"Summary: {result.get('assessment', {}).get('summary', 'N/A')}")
        print(f"Risk Signals: {result.get('assessment', {}).get('risk_signals', [])}")
        
        # Check why LLM synthesis wasn't used
        if not result.get('assessment', {}).get('risk_signals'):
            print("No risk signals detected")
        else:
            print("Risk signals detected:")
            for signal in result.get('assessment', {}).get('risk_signals', []):
                print(f"  - {signal}")
    
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure you're in the project root directory")
except Exception as e:
    print(f"Error during research: {e}")
    import traceback
    traceback.print_exc()
