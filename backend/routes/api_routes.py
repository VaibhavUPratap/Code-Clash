"""
API Routes

Endpoints:
  GET  /api/health          → service health check
    GET  /api/fetch-data      → return sample / Twitter data
  POST /api/fetch-data      → upload CSV file
  POST /api/analyze         → run full pipeline on uploaded CSV
    POST /api/research-link   → run deep link research for virality assessment
  GET  /api/get-results     → return cached results (from last /analyze call)
"""

import json
import logging
import math
import re
from datetime import datetime, timezone

from flask import Blueprint, g, jsonify, request

from db import get_db
from routes.auth_routes import require_auth
from services.ai_agent_service import explain_batch
from services.prediction_service import compute_prediction
from services.data_service import (
    dataframe_to_records,
    load_from_csv,
    load_from_post_link,
    load_from_social_handle,
)
from services.detection_service import detect_all_metrics
from services.json_safe import sanitize_for_json
from services.link_research_service import research_post_url

api_bp = Blueprint("api", __name__)
logger = logging.getLogger(__name__)

# In-memory cache for the last analysis result
_cache: dict = {}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@api_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Social Media Trend Anomaly Finder is running."})


# ---------------------------------------------------------------------------
# Fetch Data
# ---------------------------------------------------------------------------

@api_bp.route("/fetch-data", methods=["GET"])
@require_auth
def fetch_data_sample():
    """Return sample CSV data or Gemini-synthesised series when source=twitter."""
    source = request.args.get("source", "sample")
    try:
        if source == "twitter":
            handle = request.args.get("handle", "elonmusk")
            if "twitter.com/" in handle or "x.com/" in handle:
                df = load_from_post_link(url=handle)
            else:
                df = load_from_social_handle(handle=handle)
        else:
            df = load_from_csv()

        records = dataframe_to_records(df)
        return jsonify({"status": "ok", "source": source, "data": records, "count": len(records)})
    except Exception:
        logger.exception("Error in fetch_data_sample")
        return jsonify({"status": "error", "message": "Failed to load data."}), 500


@api_bp.route("/fetch-data", methods=["POST"])
@require_auth
def fetch_data_upload():
    """Accept a CSV file upload and return parsed records."""
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file provided."}), 400

    file = request.files["file"]
    if not file.filename.endswith(".csv"):
        return jsonify({"status": "error", "message": "Only CSV files are supported."}), 400

    try:
        df = load_from_csv(file_obj=file)
        records = dataframe_to_records(df)
        return jsonify({"status": "ok", "source": "upload", "data": records, "count": len(records)})
    except ValueError as exc:
        logger.warning("CSV validation error: %s", exc)
        return jsonify({"status": "error", "message": "Invalid CSV file. Ensure it has columns: date, likes, comments, shares, posts."}), 400
    except Exception:
        logger.exception("Error in fetch_data_upload")
        return jsonify({"status": "error", "message": "Failed to process the uploaded file."}), 400


# ---------------------------------------------------------------------------
# Analyze
# ---------------------------------------------------------------------------

@api_bp.route("/analyze", methods=["POST"])
@require_auth
def analyze():
    """
    Run the full pipeline:
      1. Load data (CSV upload or sample)
      2. Detect anomalies across all metrics
      3. AI-explain each anomaly
      4. Cache and return results
    """
    try:
        # ── Parse request ────────────────────────────────────────────────────
        json_body = request.get_json(silent=True) or {}
        source = (
            request.form.get("source")
            or json_body.get("source", "sample")
        ).strip().lower()
        handle = (
            request.form.get("handle")
            or json_body.get("handle", "")
        ).strip()
        optional_research_url = (
            json_body.get("research_url")
            or json_body.get("link")
            or request.form.get("research_url")
            or ""
        ).strip()

        research_urls = []
        if optional_research_url:
            # Handle comma-separated list of URLs
            research_urls = [u.strip() for u in optional_research_url.split(",") if u.strip()]
        
        # If no research_urls but source is url, use handle as primary
        if not research_urls and source == "url":
            research_urls = [handle if "://" in handle else f"https://{handle}"]

        # ── Routing (load data) ─────────────────────────────────────────────
        uploaded = request.files.get("file")
        if uploaded and uploaded.filename and uploaded.filename.strip():
            fname = uploaded.filename.strip().lower()
            if not fname.endswith(".csv"):
                return jsonify(
                    {"status": "error", "message": "Only CSV files are supported for upload."}
                ), 400
            try:
                df = load_from_csv(file_obj=uploaded)
            except ValueError as exc:
                logger.warning("CSV validation: %s", exc)
                return jsonify(
                    {
                        "status": "error",
                        "message": "Invalid CSV. Required columns: date, likes, comments, shares, posts.",
                    }
                ), 400
            source = "upload"

        elif source == "url":
            url = handle if "://" in handle else f"https://{handle}"
            df = load_from_post_link(url=url)
            source = "post_url"
            research_url_target = url

        elif source == "twitter":
            twitter_handle = handle.lstrip("@") or "elonmusk"
            df = load_from_social_handle(handle=twitter_handle)

        else:
            df = load_from_csv()
            source = "sample"

        # ── Pipeline: detect → research (multiple) → AI → prediction ───────
        records = dataframe_to_records(df)
        anomalies = detect_all_metrics(df)

        research_reports = []
        for rurl in research_urls[:3]:  # Limit to top 3 for performance
            try:
                report = research_post_url(rurl)
                research_reports.append(report)
            except Exception:
                logger.exception(f"research_post_url failed for {rurl}")

        # Pick the 'strongest' research report (highest virality score) as primary context
        primary_research = None
        if research_reports:
            primary_research = max(
                research_reports, 
                key=lambda x: (x.get("virality") or {}).get("score", 0)
            )

        anomaly_insights = explain_batch(anomalies, records, primary_research)
        summary = _build_summary(records, anomalies)
        prediction = compute_prediction(records, primary_research, anomalies)
        insight_cards = _build_insight_cards(anomaly_insights, primary_research, summary)

        result = {
            "status": "ok",
            "source": source,
            "data": records,
            "anomalies": anomaly_insights,
            "summary": summary,
            "research": primary_research,
            "all_research": research_reports,
            "insights": insight_cards,
            "prediction": prediction,
        }

        safe = sanitize_for_json(result)
        _cache["last"] = safe
        return jsonify(safe)

    except Exception as exc:
        logger.exception("Error in analyze")
        return jsonify(
            {
                "status": "error",
                "message": "Analysis failed. Please check your data and try again.",
                "detail": str(exc)[:400],
            }
        ), 500


@api_bp.route("/research-link", methods=["POST"])
@require_auth
def research_link():
    """Run deep URL research and return a virality assessment payload."""
    payload = request.get_json(silent=True) or {}
    url = (payload.get("url") or request.form.get("url") or "").strip()

    if not url:
        return jsonify({"status": "error", "message": "Provide a post URL in 'url'."}), 400

    try:
        context = payload.get("context")
        report = research_post_url(url, anomaly_context=context)
        db = get_db()
        db.execute(
            "INSERT INTO research_snapshots (user_id, url, report_json, created_at) VALUES (?, ?, ?, ?)",
            (
                g.current_user_id,
                report.get("url", url),
                json.dumps(report),
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        db.commit()
        return jsonify({"status": "ok", "research": report})
    except ValueError as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400
    except Exception:
        logger.exception("Error in research_link")
        return jsonify({"status": "error", "message": "Deep research failed for this URL."}), 500


# ---------------------------------------------------------------------------
# Get Results
# ---------------------------------------------------------------------------

@api_bp.route("/get-results", methods=["GET"])
@require_auth
def get_results():
    """Return the last cached analysis result."""
    if "last" not in _cache:
        return jsonify({"status": "error", "message": "No analysis has been run yet."}), 404
    return jsonify(sanitize_for_json(_cache["last"]))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_insight_cards(
    anomaly_insights: list, research: dict | None, summary: dict
) -> list:
    """High-level cards for Insights UI: research summary + top anomalies."""
    del summary  # reserved for future use
    cards = []
    if research:
        asm = research.get("assessment") or {}
        vir = research.get("virality") or {}
        topics = asm.get("key_topics") if isinstance(asm.get("key_topics"), list) else []
        risks = asm.get("risk_signals") if isinstance(asm.get("risk_signals"), list) else []
        cards.append(
            {
                "kind": "research",
                "title": "Deep research context",
                "summary": (asm.get("summary") or "")[:500],
                "virality_score": vir.get("score"),
                "key_topics": topics[:8],
                "risk_signals": risks[:8],
            }
        )
    for a in anomaly_insights[:12]:
        ins = a.get("ai_insight") or {}
        cards.append(
            {
                "kind": "anomaly",
                "date": a.get("date"),
                "metric": a.get("metric"),
                "anomaly_type": a.get("type"),
                "severity": a.get("severity"),
                "classification": ins.get("type"),
                "cause": ins.get("cause", ""),
                "explanation": ins.get("explanation", ""),
                "impact": ins.get("impact", ""),
                "recommendation": ins.get("recommendation", ""),
                "confidence": ins.get("confidence", "low"),
            }
        )
    return cards


def _build_summary(records: list, anomalies: list) -> dict:
    if not records:
        return {}

    total_days = len(records)
    total_anomalies = len(anomalies)
    critical = sum(1 for a in anomalies if a.get("severity") == "critical")
    medium = sum(1 for a in anomalies if a.get("severity") == "medium")
    low = sum(1 for a in anomalies if a.get("severity") == "low")

    spikes = sum(1 for a in anomalies if a.get("type") == "spike")
    drops = sum(1 for a in anomalies if a.get("type") == "drop")

    def _avg(field: str) -> float:
        try:
            s = sum(float(r.get(field, 0) or 0) for r in records)
            v = s / total_days
            return round(v, 1) if math.isfinite(v) else 0.0
        except (TypeError, ValueError):
            return 0.0

    return {
        "total_days": total_days,
        "total_anomalies": total_anomalies,
        "severity_breakdown": {"critical": critical, "medium": medium, "low": low},
        "type_breakdown": {"spikes": spikes, "drops": drops},
        "averages": {
            "likes": _avg("likes"),
            "comments": _avg("comments"),
            "shares": _avg("shares"),
        },
    }


def _is_url_like(value: str) -> bool:
    if not value:
        return False
    if "://" in value:
        return True
    if "x.com/" in value or "twitter.com/" in value:
        return True
    return bool(re.match(r"^[\w.-]+\.[a-zA-Z]{2,}(/|$)", value))
