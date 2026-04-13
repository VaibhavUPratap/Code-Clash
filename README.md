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
│ CSV / URL+LLM│ Z-score / IQR    │ Gemini / mock      │
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
cp .env.example .env   # set REACT_APP_API_URL to your backend URL
npm start
# → http://localhost:3000
```

---

## 📋 API Contract

| Method | Endpoint            | Description                                    |
|--------|---------------------|------------------------------------------------|
| GET    | `/api/health`       | Health check                                   |
| GET    | `/api/fetch-data`   | Return sample data (`?source=twitter&handle=…` uses Gemini synthesis, not X API) |
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
- public page fetch (HTML text + meta) — no Twitter/X API
- optional Gemini synthesis (virality, topics, risks)
- virality score (0-100) with breakdown
- LLM or heuristic verdict (`viral | trending | normal`)

---

## 🔑 Environment Variables (backend/.env)

| Variable              | Default          | Description                          |
|-----------------------|------------------|--------------------------------------|
| `GEMINI_API_KEY`      | *(empty)*        | Required for LLM URL/post series + deep research; blank uses heuristics/mock series |
| `GEMINI_MODEL`        | `gemini-1.5-flash` | Gemini model                       |
| `SECRET_KEY` / `JWT_SECRET` | *(see `.env.example`)* | Auth signing                        |
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

When `GEMINI_API_KEY` is not set, a deterministic rule-based mock is used so the system works fully offline.

---

## 🏆 Hackathon-Winning Features

- ✅ Works completely offline (no API keys required – mock AI engine built in)
- ✅ Multi-metric anomaly detection (likes, comments, shares, posts)
- ✅ Interactive Plotly chart with anomaly markers colour-coded by severity
- ✅ AI insight panel with cause + recommendation per anomaly
- ✅ Deep Research page with citations + signal timeline for URL analysis
- ✅ CSV upload + post URL (Gemini series) + bundled sample
- ✅ Clean dark-mode UI with responsive design
- ✅ Modular backend architecture (swap Gemini → any LLM in one file)

---

## 🔎 Project Audit Issues (April 2026)

Audit scope: all tracked project files in this repository (backend, frontend, and root docs/config), excluding dependency/cache folders.

### High Severity

| File | Issue | Why it matters | Fix |
|------|-------|----------------|-----|
| `backend/requirements.txt` | Dependencies are unpinned | Non-reproducible builds and unexpected production breakage | Pin versions (for example `Flask==...`) and keep lock strategy consistent |
| `backend/config.py` | `SECRET_KEY` has a hardcoded fallback value | If env vars are missed in production, auth secrets become predictable | Require `SECRET_KEY`/`JWT_SECRET` from environment and fail fast if missing |
| `backend/db.py` | SQLite path is fixed to local `instance/codeclash.db` | Cloud/container filesystem may be ephemeral or non-writable | Add env-driven DB path and/or migrate to managed DB for production |
| `backend/routes/analyze.py` | Legacy `/analyze` route duplicates core pipeline route | Confusing parallel flow and stale logic divergence risk | Remove legacy route or fully align it with `/api/analyze` flow |

### Medium Severity

| File | Issue | Why it matters | Fix |
|------|-------|----------------|-----|
| `backend/app.py` | CORS allows `*` by default when `CORS_ORIGINS` is not set | Overly broad cross-origin exposure in production | Set explicit frontend origin(s) via `CORS_ORIGINS` env var |
| `frontend/src/services/api.js` | API base silently falls back to `http://localhost:5000` | Production misconfiguration can be hidden until runtime failures | Enforce `REACT_APP_API_URL` in production builds |
| `frontend/package.json` | `axios` is installed but current API service uses `fetch` only | Unused dependency adds maintenance and security surface | Remove unused dependency or migrate API layer to axios consistently |
| `frontend/package.json` | Both `plotly.js` and `plotly.js-dist-min` are present | Redundant dependency weight and maintenance overhead | Keep only the variant actually used by the app |

### Low Severity

| File | Issue | Why it matters | Fix |
|------|-------|----------------|-----|
| `backend/services/anomaly_detection.py` and `backend/services/detection_service.py` | Two anomaly detection modules co-exist | Makes it unclear which logic is authoritative | Keep one detection implementation and remove/retire the other |
| `backend/generate_data.py` | Utility script is not wired into main app | Adds clutter and maintenance overhead | Move to a dedicated scripts folder or document intended usage |
| Root dependencies (`npm install` audit output) | Current frontend dependency tree reports known vulnerabilities | Security and compliance risk for production deploys | Run `npm audit`, apply safe fixes, then re-test build |

### Deployment Checklist (from issues)

- [ ] Pin Python dependency versions in `backend/requirements.txt`.
- [ ] Enforce strong `SECRET_KEY` and `JWT_SECRET` via environment variables only.
- [ ] Configure persistent database strategy (env-driven path or managed DB).
- [ ] Remove or refactor legacy `backend/routes/analyze.py` route.
- [ ] Set strict `CORS_ORIGINS` in production.
- [ ] Set `REACT_APP_API_URL` explicitly in frontend deployment.
- [ ] Remove redundant/unused frontend dependencies.
- [ ] Run security audit fix cycle (`npm audit`) before final production release.
