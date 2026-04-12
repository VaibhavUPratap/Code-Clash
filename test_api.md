# API Test Instructions

## Test Gemini API Integration

### 1. Start the Backend Server

```bash
cd backend
python app.py
```

### 2. Test Research Endpoint

Once the server is running, test the research functionality:

```bash
curl -X POST http://localhost:5000/api/research-link \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### 3. Test Full Analysis with Research

```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "source": "sample",
    "research_url": "https://example.com"
  }'
```

### 4. Expected Results

**With Gemini Working:**
```json
{
  "status": "ok",
  "research": {
    "research_mode": "gemini",
    "assessment": {
      "key_topics": ["technology", "web"],
      "risk_signals": ["limited content"],
      "deep_dive": "AI-generated analysis...",
      "summary": "Rich AI-generated summary"
    }
  }
}
```

**With Fallback (Heuristic):**
```json
{
  "status": "ok", 
  "research": {
    "research_mode": "heuristic",
    "assessment": {
      "key_topics": [],
      "risk_signals": ["LLM synthesis disabled - set GEMINI_API_KEY environment variable"],
      "deep_dive": "Analysis based on X characters...",
      "summary": "Heuristic read: typical content patterns..."
    }
  }
}
```

### 5. Troubleshooting

If you see "LLM synthesis disabled" in risk signals:
1. Check if `.env` file exists in backend folder
2. Verify API key is set correctly
3. Ensure `google-generativeai` package is installed

If you see "LLM synthesis unavailable":
1. Install with: `pip install google-generativeai`
2. Restart the backend server
