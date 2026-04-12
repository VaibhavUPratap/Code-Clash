# LLM Synthesis Setup Guide

## Overview

The Social Media Trend Anomaly Finder supports AI-powered deep research synthesis using Google's Gemini API. This enhances the research analysis with structured, AI-generated insights.

## Setup Instructions

### 1. Install Required Package

```bash
pip install google-generativeai
```

### 2. Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### 3. Configure Environment

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash-001
```

Or set environment variables directly:

```bash
export GEMINI_API_KEY="your_api_key_here"
export GEMINI_MODEL="gemini-1.5-flash"
```

### 4. Restart the Backend

```bash
cd backend
python app.py
```

## Features Enabled by LLM Synthesis

### Enhanced Research Analysis

When LLM synthesis is enabled, the research service provides:

- **Structured Assessment**: AI-generated verdict with confidence scores
- **Topic Extraction**: Intelligent topic identification from content
- **Risk Analysis**: Automated risk signal detection
- **Deep Dive Analysis**: 2-4 sentence analysis of implications
- **Actionable Recommendations**: Specific next steps for research validation

### Improved Output Structure

```json
{
  "verdict": "viral|trending|normal",
  "confidence": "low|medium|high",
  "virality_score": 87.5,
  "summary": "AI-generated content summary",
  "reasons": ["evidence-backed reason 1", "reason 2"],
  "recommended_actions": ["specific action 1", "action 2"],
  "key_topics": ["ai", "technology", "innovation"],
  "risk_signals": ["potential misinformation", "limited context"],
  "deep_dive": "Detailed analysis of implications and unknowns"
}
```

## Fallback Behavior

If LLM synthesis is not available, the system automatically falls back to heuristic analysis:

- **Topic Extraction**: Basic keyword matching from title/description
- **Risk Signals**: Rule-based detection (content length, promotional density)
- **Recommendations**: Generic but actionable suggestions
- **Status Indicators**: Clear messages about LLM availability

## Troubleshooting

### Common Issues

1. **"LLM synthesis unavailable"**
   - Install: `pip install google-generativeai`
   - Check import in `link_research_service.py`

2. **"LLM synthesis disabled"**
   - Set `GEMINI_API_KEY` environment variable
   - Verify API key is valid

3. **Model Name Issues**
   - Python library uses `gemini-1.5-flash-001` (not `gemini-flash-latest`)
   - REST API uses different model names than Python library
   - Update `.env` file with correct model name

4. **API Rate Limits**
   - Gemini has rate limits for free tier
   - Consider upgrading to paid tier for heavy usage

5. **Content Analysis Issues**
   - Very short content (< 100 chars) may trigger risk signals
   - Page fetch failures limit analysis depth

### Verification

To verify LLM synthesis is working:

1. Run a research analysis on a URL
2. Check the research mode in the response
3. Look for "gemini" as the research_mode
4. Verify rich topic extraction and risk analysis

### Example Test

```bash
curl -X POST http://localhost:5000/api/research-link \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

Expected response with LLM synthesis:
```json
{
  "status": "ok",
  "research": {
    "research_mode": "gemini",
    "assessment": {
      "key_topics": ["technology", "innovation"],
      "risk_signals": ["needs verification"],
      "deep_dive": "Comprehensive AI analysis..."
    }
  }
}
```

## Benefits

### With LLM Synthesis
- More accurate virality assessment
- Intelligent topic categorization
- Context-aware risk analysis
- Structured, professional insights
- Reduced false positives/negatives

### Without LLM Synthesis
- Basic heuristic analysis
- Simple keyword extraction
- Rule-based risk detection
- Generic recommendations
- Limited insight depth

## Cost Considerations

- **Gemini 1.5 Flash**: Cost-effective for frequent analysis
- **Free Tier**: Suitable for development and light usage
- **Paid Tier**: Recommended for production workloads
- **Caching**: Results are cached to minimize API calls

## Security Notes

- API keys are stored in environment variables
- No sensitive content is sent to external APIs beyond the URL being analyzed
- All API calls are logged for monitoring
- Consider API key rotation for production deployments
