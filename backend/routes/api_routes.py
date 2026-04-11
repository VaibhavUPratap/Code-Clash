"""
API Routes

Endpoints:
  GET  /api/health          → service health check
  GET  /api/fetch-data      → return sample / Reddit data
  POST /api/fetch-data      → upload CSV file
  POST /api/analyze         → run full pipeline on uploaded CSV
  GET  /api/get-results     → return cached results (from last /analyze call)
"""

import logging
from flask import Blueprint, jsonify, request
from services.data_service import (
    load_from_csv,
    load_from_reddit,
    dataframe_to_records,
)
from services.detection_service import detect_all_metrics
from services.ai_agent_service import explain_batch

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
def fetch_data_sample():
    """Return sample CSV data (or subreddit data when ?source=reddit&sub=<name>)."""
    source = request.args.get("source", "sample")
    try:
        if source == "reddit":
            subreddit = request.args.get("sub", "worldnews")
            df = load_from_reddit(subreddit=subreddit)
        else:
            df = load_from_csv()

        records = dataframe_to_records(df)
        return jsonify({"status": "ok", "source": source, "data": records, "count": len(records)})
    except Exception:
        logger.exception("Error in fetch_data_sample")
        return jsonify({"status": "error", "message": "Failed to load data."}), 500


@api_bp.route("/fetch-data", methods=["POST"])
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
def analyze():
    """
    Run the full pipeline:
      1. Load data (CSV upload or sample)
      2. Detect anomalies across all metrics
      3. AI-explain each anomaly
      4. Cache and return results
    """
    try:
        # Load data
        source = request.form.get("source", "sample")
        if "file" in request.files:
            file = request.files["file"]
            df = load_from_csv(file_obj=file)
            source = "upload"
        elif source == "reddit":
            subreddit = request.form.get("sub", "worldnews")
            df = load_from_reddit(subreddit=subreddit)
        else:
            df = load_from_csv()

        records = dataframe_to_records(df)

        # Detect anomalies
        anomalies = detect_all_metrics(df)

        # AI explanations
        insights = explain_batch(anomalies, records)

        # Build summary stats
        summary = _build_summary(records, anomalies)

        result = {
            "status": "ok",
            "source": source,
            "data": records,
            "anomalies": insights,
            "summary": summary,
        }

        _cache["last"] = result
        return jsonify(result)

    except Exception:
        logger.exception("Error in analyze")
        return jsonify({"status": "error", "message": "Analysis failed. Please check your data and try again."}), 500


# ---------------------------------------------------------------------------
# Get Results
# ---------------------------------------------------------------------------

@api_bp.route("/get-results", methods=["GET"])
def get_results():
    """Return the last cached analysis result."""
    if "last" not in _cache:
        return jsonify({"status": "error", "message": "No analysis has been run yet."}), 404
    return jsonify(_cache["last"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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

    avg_likes = sum(r.get("likes", 0) for r in records) / total_days
    avg_comments = sum(r.get("comments", 0) for r in records) / total_days
    avg_shares = sum(r.get("shares", 0) for r in records) / total_days

    return {
        "total_days": total_days,
        "total_anomalies": total_anomalies,
        "severity_breakdown": {"critical": critical, "medium": medium, "low": low},
        "type_breakdown": {"spikes": spikes, "drops": drops},
        "averages": {
            "likes": round(avg_likes, 1),
            "comments": round(avg_comments, 1),
            "shares": round(avg_shares, 1),
        },
    }
