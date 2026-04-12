# 📡 Social Media Trend Anomaly Finder – Crisis & Bot Intelligence System

A full-stack hackathon project that analyses social media engagement time-series data, detects statistical anomalies, and uses an AI agent to explain the cause (viral event, bot activity, or crisis).

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────┐
│  React Frontend (port 3000)                          │
│  Home ▸ Dashboard ▸ Alerts ▸ Insights ▸ Research     │
└───────────────────┬──────────────────────────────────┘
                    │ HTTP (axios)
┌───────────────────▼──────────────────────────────────┐
│  Flask Backend (port 5000)                           │
│  /api/analyze  /api/fetch-data  /api/get-results     │
├──────────────┬──────────────────┬────────────────────┤
│ data_service │ detection_service│ ai_agent_service   │
│ CSV / Twitter│ Z-score / IQR    │ OpenAI / mock      │
└──────────────┴──────────────────┴────────────────────┘
```

---

## 🚀 Quick Start

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # edit .env to add API keys (optional)
python app.py
# → http://localhost:5000/api/health
```

### Frontend

```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

---

## 📋 API Contract

| Method | Endpoint            | Description                                    |
|--------|---------------------|------------------------------------------------|
| GET    | `/api/health`       | Health check                                   |
| GET    | `/api/fetch-data`   | Return sample data (`?source=twitter&handle=NAME`) |
| POST   | `/api/fetch-data`   | Upload CSV file                                |
| POST   | `/api/analyze`      | Run full pipeline (form: `source`, `file`, `handle`) |
| POST   | `/api/research-link`| Deep URL research (virality + evidence)         |
| GET    | `/api/get-results`  | Return last cached analysis result             |

### POST `/api/analyze` response shape

```json
{
  "status": "ok",
  "source": "sample",
  "data": [{ "date": "2024-01-01", "likes": 980, "comments": 142, "shares": 77, "posts": 24 }],
  "anomalies": [{
    "date": "2024-01-21",
    "metric": "likes",
    "value": 6726,
    "z_score": 12.4,
    "type": "spike",
    "severity": "critical",
    "pct_change": 572.4,
    "detection_method": "zscore",
    "baseline_mean": 998.5,
    "ai_insight": {
      "type": "viral",
      "cause": "Extreme spike in likes suggests a post went viral.",
      "confidence": "high",
      "recommendation": "Capitalise on the momentum: post follow-up content."
    }
  }],
  "summary": {
    "total_days": 180,
    "total_anomalies": 18,
    "severity_breakdown": { "critical": 5, "medium": 6, "low": 7 },
    "type_breakdown": { "spikes": 12, "drops": 6 },
    "averages": { "likes": 1023.4, "comments": 153.1, "shares": 80.6 }
  },
  "link_research": {
    "url": "https://x.com/...",
    "platform": "x",
    "virality": { "score": 78.6, "label": "viral", "confidence": "high" },
    "assessment": {
      "verdict": "viral",
      "summary": "This post appears viral based on strong engagement and pickup signals."
    },
    "sources": [{ "title": "Source post", "url": "https://x.com/..." }]
  }
}
```

### POST `/api/research-link` request and response

Request body:

```json
{ "url": "https://x.com/<user>/status/<tweet_id>" }
```

Returns URL-level deep research with:
- platform metrics (for X/Twitter links when API access is available)
- Google News mention counts (24h and 7d)
- virality score (0-100) with breakdown
- LLM or heuristic verdict (`viral | trending | normal`)

---

## 🔑 Environment Variables (backend/.env)

| Variable              | Default          | Description                          |
|-----------------------|------------------|--------------------------------------|
| `OPENAI_API_KEY`      | *(empty)*        | Leave blank to use mock AI responses |
| `OPENAI_MODEL`        | `gpt-4o-mini`    | OpenAI model                         |
| `TWITTER_BEARER_TOKEN`| *(empty)*        | Twitter API Bearer Token             |
| `IQR_MULTIPLIER`      | `1.5`            | IQR fence multiplier                 |
| `ROLLING_WINDOW`      | `7`              | Days for rolling mean/std            |
| `SEVERITY_MEDIUM`     | `3.0`            | Z-score threshold for medium         |
| `SEVERITY_CRITICAL`   | `4.5`            | Z-score threshold for critical       |

---

## 📁 CSV Format

```csv
date,likes,comments,shares,posts
2024-01-01,980,142,77,24
2024-01-02,1020,155,83,26
```

A 180-day sample dataset with injected anomalies is included at `backend/data/sample_data.csv`.

---

## 🧠 AI Agent Design

The agent receives a structured prompt per anomaly:

```
Metric:        likes
Anomaly type:  spike (critical severity)
Date:          2024-01-21
Value:         6726
Baseline mean: 998
% change:      +572.4%
Z-score:       12.40

Multi-metric context on same date:
  comments: 660
  shares: 359
```

And returns strict JSON:

```json
{
  "type": "viral",
  "cause": "...",
  "confidence": "high",
  "recommendation": "..."
}
```

When `OPENAI_API_KEY` is not set, a deterministic rule-based mock is used so the system works fully offline.

---

## 🏆 Hackathon-Winning Features

- ✅ Works completely offline (no API keys required – mock AI engine built in)
- ✅ Multi-metric anomaly detection (likes, comments, shares, posts)
- ✅ Interactive Plotly chart with anomaly markers colour-coded by severity
- ✅ AI insight panel with cause + recommendation per anomaly
- ✅ Deep Research page with citations + signal timeline for URL analysis
- ✅ CSV upload + Twitter live data + bundled sample
- ✅ Clean dark-mode UI with responsive design
- ✅ Modular backend architecture (swap OpenAI → any LLM in one file)
