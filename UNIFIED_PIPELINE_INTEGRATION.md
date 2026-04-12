# Social Media Trend Anomaly Finder - Unified Pipeline Integration

## Overview

The Social Media Trend Anomaly Finder now features a **unified analysis pipeline** that seamlessly integrates deep research with anomaly detection, AI explanations, and predictions. This document outlines the complete data flow and integration points.

## Unified Data Flow

```
Data Input (CSV/URL/Handle) 
    -> Anomaly Detection (Z-score + IQR)
    -> Deep Research (URL Analysis) [if URL provided]
    -> AI Agent Explanation (Research-aware)
    -> Prediction (Research-enhanced)
    -> API Response
```

## Key Components

### 1. Backend Pipeline (`/api/analyze`)

**Location**: `backend/routes/api_routes.py`

**Flow**:
1. **Data Loading**: Supports CSV upload, sample data, Twitter handles, and post URLs
2. **Anomaly Detection**: Multi-metric anomaly detection across likes, comments, shares, posts
3. **Deep Research**: Single call to `link_research_service` when URL provided
4. **AI Explanations**: `ai_agent_service.explain_batch()` with research context
5. **Prediction**: `prediction_service.compute_prediction()` with research signals
6. **Response**: Unified JSON with all components

**Key Features**:
- Research is called **ONCE** and reused across all components
- Graceful fallback when research fails
- JSON-safe outputs with proper error handling

### 2. AI Agent Service (`ai_agent_service.py`)

**Enhanced Input Structure**:
```python
{
  "anomaly": {...},
  "context_metrics": {...},
  "research": {
    "virality_score_0_1": 0.87,
    "virality_score_100": 87.0,
    "verdict": "viral",
    "research_summary": "...",
    "key_topics": ["AI", "launch", "controversy"],
    "risk_signals": ["low credibility", "missing context"],
    "deep_dive": "..."
  }
}
```

**Enhanced Output Structure**:
```python
{
  "type": "viral | bot | crisis",
  "cause": "Research-backed explanation...",
  "confidence": "low | medium | high",
  "explanation": "Detailed analysis using research context...",
  "impact": "Business/operational impact assessment",
  "recommendation": "Actionable next steps"
}
```

### 3. Prediction Service (`prediction_service.py`)

**Research-Enhanced Predictions**:
- **High virality score** (70+) -> Predict spike
- **Risk signals present** -> Predict downside risk
- **Historical momentum** + **research context** -> Combined forecast

**Output Structure**:
```python
{
  "trend": "spike_prone | volatile | downside | stable | drifting",
  "horizon_days": 7,
  "spike_expected": bool,
  "downside_risk": bool,
  "reason": "Research-blended explanation...",
  "research_virality_score": 87.0,
  "historical_metric": "likes"
}
```

### 4. API Response Structure

**Complete Response**:
```python
{
  "status": "ok",
  "source": "sample|upload|post_url|twitter",
  "data": [...],                    # Historical data points
  "anomalies": [...],               # Anomalies with AI insights
  "research": {...},                 # Deep research results
  "link_research": {...},            # Duplicate for compatibility
  "insights": [...],                 # UI-ready insight cards
  "prediction": {...}                # Research-enhanced forecast
}
```

## Frontend Integration

### 1. Deep Research Page (`DeepResearchPage.js`)
- Displays virality score, key topics, risk signals
- Shows research summary and assessment
- Visualizes cross-signal timeline

### 2. Insights Page (`InsightsPage.js`)
- Shows AI explanations with research context
- Displays both research insights and anomaly explanations
- Research-aware classification and confidence

### 3. Prediction Page (`PredictionPage.js`)
- Shows research-blended predictions
- Displays virality score impact on forecasts
- Risk signal warnings in prediction UI

## API Usage Examples

### Basic Analysis (Sample Data)
```bash
POST /api/analyze
{
  "source": "sample"
}
```

### Analysis with Research URL
```bash
POST /api/analyze
{
  "source": "sample",
  "research_url": "https://example.com/post"
}
```

### Direct URL Analysis
```bash
POST /api/analyze
{
  "source": "url",
  "handle": "https://twitter.com/user/status/123"
}
```

### Standalone Research
```bash
POST /api/research-link
{
  "url": "https://example.com/post"
}
```

## Key Integration Points

### 1. Research Reuse
- Research is called **once** per analysis
- Results passed to AI agent and prediction service
- Avoids duplicate API calls and processing

### 2. Error Handling
- Research failures don't break the pipeline
- AI agent falls back to metrics-only analysis
- Predictions use historical data when research unavailable

### 3. Data Flow Consistency
- All components use the same research data structure
- JSON serialization ensures frontend compatibility
- Session storage caches results for UI navigation

## Benefits of Unified Pipeline

1. **Cohesive Analysis**: Research context flows through all components
2. **Efficiency**: Single research call reused across the system  
3. **Better Explanations**: AI agent has rich context for anomaly analysis
4. **Smarter Predictions**: Research signals improve forecast accuracy
5. **Unified UI**: All pages display consistent, research-enhanced data

## Technical Implementation Notes

### Research Bundle Function
```python
def research_bundle(link_research: dict | None) -> dict[str, Any]:
    """Flatten link_research_service output for prompts and mocks."""
```
- Converts complex research output to AI-friendly format
- Handles missing data gracefully
- Ensures consistent structure across components

### JSON Safety
- All outputs sanitized via `sanitize_for_json()`
- Handles NaN, Infinity, and other non-JSON values
- Ensures frontend compatibility

### Authentication
- All API endpoints require authentication
- Research snapshots stored in database
- User-specific analysis results

## Future Enhancements

1. **Multiple URL Research**: Support for analyzing multiple URLs per analysis
2. **Real-time Updates**: WebSocket integration for live research updates
3. **Advanced AI Models**: Integration with more sophisticated AI models
4. **Custom Research Sources**: Support for additional research APIs
5. **Export Functionality**: PDF/CSV export of unified analysis results

---

**Status**: Complete and functional
**Last Updated**: Integration verified across all components
**Compatibility**: Frontend and backend fully integrated
