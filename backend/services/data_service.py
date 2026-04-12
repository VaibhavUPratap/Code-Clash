"""
Data Service – loads engagement time series from CSV or Gemini-backed synthesis.

Post / social URLs never use the Twitter/X API. With GEMINI_API_KEY, the model
builds a plausible daily series using the URL (and optional public HTML fetch).
"""

from __future__ import annotations

import io
import json
import logging
import os
import random
import re
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd

from config import Config
from services.link_research_service import fetch_page_for_pipeline

from services.gemini_service import call_gemini, extract_json_payload, is_gemini_ready

logger = logging.getLogger(__name__)

SAMPLE_CSV_PATH = os.path.join(os.path.dirname(__file__), "../data/sample_data.csv")


def load_from_csv(file_obj=None) -> pd.DataFrame:
    """Load time-series data from an uploaded CSV file or the bundled sample."""
    if file_obj is not None:
        content = file_obj.read().decode("utf-8")
        df = pd.read_csv(io.StringIO(content))
    else:
        df = pd.read_csv(SAMPLE_CSV_PATH)

    df = _normalise(df)
    return df


def load_from_post_link(url: str, days: int = 90) -> pd.DataFrame:
    """
    Build a daily engagement series for any post/social URL using Gemini only
    (plus a normal HTTP fetch for page text — not a social API).

    Without GEMINI_API_KEY, falls back to deterministic synthetic data derived
    from the URL string.
    """
    page = fetch_page_for_pipeline(url)
    if is_gemini_ready():
        df = _gemini_timeseries_from_post(url, page, days)
        if df is not None and len(df) > 0:
            return df
    return _synthetic_series_from_url_seed(url, days)


def load_from_social_handle(handle: str, days: int = 90) -> pd.DataFrame:
    """
    No Twitter API: estimate a profile-level daily series via Gemini, or sample CSV.
    """
    h = (handle or "").lstrip("@").strip() or "unknown"
    if is_gemini_ready():
        df = _gemini_timeseries_from_handle(h, days)
        if df is not None and len(df) > 0:
            return df
    return load_from_csv()


def load_from_twitter(handle: str = "elonmusk", limit: int = 100) -> pd.DataFrame:
    """Deprecated name: routes still call this; Twitter API is not used."""
    del limit
    return load_from_social_handle(handle=handle)


def load_from_tweet_url(url: str, days: int = 90) -> pd.DataFrame:
    """Deprecated name: same as load_from_post_link (no Twitter API)."""
    return load_from_post_link(url=url, days=days)


def _gemini_timeseries_from_post(url: str, page: dict, days: int) -> pd.DataFrame | None:
    excerpt = (page.get("body_text") or "")[:6000]
    date_start, date_end = _date_window(days)
    context = {
        "url": url,
        "page_title": page.get("title", ""),
        "page_description": page.get("description", ""),
        "page_fetched": page.get("fetched", False),
        "page_text_excerpt": excerpt,
        "series_start_date": date_start,
        "series_end_date": date_end,
        "num_days": days,
    }

    prompt = (
        "You synthesise a plausible daily social-engagement time series for anomaly detection demos.\n"
        "Rules:\n"
        "- Do NOT claim you called Twitter/X or any social API; this is a model-generated estimate.\n"
        "- Use the URL and any page excerpt only as weak hints; if excerpt is empty, still output a coherent series.\n"
        f"- Output exactly {days} calendar days: from {date_start} through {date_end} inclusive, one row per day, chronological.\n"
        "- Columns per row: date (YYYY-MM-DD), likes, comments, shares, posts (all non-negative integers; posts usually 1–5 per day).\n"
        "- Include one clear spike day (viral) and tapering tail; other days lower baseline.\n"
        "Return strict JSON: {\"records\": [ {\"date\": \"...\", \"likes\": 0, \"comments\": 0, \"shares\": 0, \"posts\": 1}, ... ]}\n\n"
        f"Context JSON:\n{json.dumps(context, ensure_ascii=True)}"
    )

    try:
        raw_response = call_gemini(
            prompt=prompt,
            system_instruction=(
                "You output JSON only. Never invent API measurements; "
                "label internally as synthetic estimates."
            ),
            temperature=0.35,
            max_tokens=8000
        )
        raw = extract_json_payload(raw_response) or "{}"
        data = json.loads(raw)
        records = data.get("records")
        if not isinstance(records, list):
            return None
        return _records_to_dataframe(records, days, date_start, date_end)
    except Exception as exc:
        logger.warning("Gemini post URL time series failed: %s", exc)
        return None


def _gemini_timeseries_from_handle(handle: str, days: int) -> pd.DataFrame | None:
    date_start, date_end = _date_window(days)
    prompt = (
        "Generate a plausible synthetic daily engagement time series for a public social profile "
        f"(@{handle}) for anomaly-detection demos. No API access. Exactly {days} days from "
        f"{date_start} to {date_end} inclusive, one object per day, chronological.\n"
        "Each row: date (YYYY-MM-DD), likes, comments, shares, posts (non-negative integers).\n"
        "Include mild trends and one medium spike. Return JSON: {\"records\": [ ... ] }"
    )
    try:
        raw_response = call_gemini(
            prompt=prompt,
            system_instruction="JSON only. Synthetic demo data, not real API stats.",
            temperature=0.4,
            max_tokens=8000
        )
        raw = extract_json_payload(raw_response) or "{}"
        data = json.loads(raw)
        records = data.get("records")
        if not isinstance(records, list):
            return None
        return _records_to_dataframe(records, days, date_start, date_end)
    except Exception as exc:
        logger.warning("Gemini handle time series failed: %s", exc)
        return None


def _date_window(days: int) -> tuple[str, str]:
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=days - 1)
    return start.isoformat(), end.isoformat()


def _records_to_dataframe(
    records: list, expected_days: int, date_start: str, date_end: str
) -> pd.DataFrame | None:
    rows = []
    for item in records:
        if not isinstance(item, dict):
            continue
        d = item.get("date")
        if not d:
            continue
        try:
            rows.append(
                {
                    "date": str(d)[:10],
                    "likes": max(0, int(float(item.get("likes", 0)))),
                    "comments": max(0, int(float(item.get("comments", 0)))),
                    "shares": max(0, int(float(item.get("shares", 0)))),
                    "posts": max(0, int(float(item.get("posts", 1)))),
                }
            )
        except (TypeError, ValueError):
            continue

    if len(rows) < expected_days // 2:
        return None

    df = pd.DataFrame(rows)
    df = _normalise(df)

    # Ensure full span: if model returned fewer days, pad from synthetic; if more, trim
    if len(df) != expected_days:
        df = _align_to_day_span(df, expected_days, date_start, date_end)
    return df


def _align_to_day_span(df: pd.DataFrame, days: int, date_start: str, date_end: str) -> pd.DataFrame:
    """Reindex to exactly `days` rows between date_start and date_end."""
    try:
        start = pd.to_datetime(date_start).normalize()
        end = pd.to_datetime(date_end).normalize()
    except Exception:
        return df

    full_idx = pd.date_range(start=start, end=end, freq="D")
    if len(full_idx) != days:
        full_idx = pd.date_range(end=end, periods=days, freq="D")

    dfc = df.copy()
    dfc["date"] = pd.to_datetime(dfc["date"]).dt.normalize()
    dfc = dfc.sort_values("date").drop_duplicates(subset=["date"], keep="last")
    dfc = dfc.set_index("date").reindex(full_idx)
    num_cols = ["likes", "comments", "shares", "posts"]
    for c in num_cols:
        if c not in dfc.columns:
            dfc[c] = 0.0
    dfc[num_cols] = (
        dfc[num_cols]
        .apply(pd.to_numeric, errors="coerce")
        .interpolate(limit_direction="both")
        .ffill()
        .bfill()
        .fillna(0)
        .clip(lower=0)
        .round()
        .astype(int)
    )
    dfc = dfc.reset_index()
    if "index" in dfc.columns:
        dfc = dfc.rename(columns={"index": "date"})
    return _normalise(dfc)


def _synthetic_series_from_url_seed(url: str, days: int = 90) -> pd.DataFrame:
    """Deterministic mock series when Gemini is unavailable (no Twitter API)."""
    tweet_id = None
    match = re.search(r"status/(\d+)", url)
    if match:
        tweet_id = match.group(1)

    seed_val = int(tweet_id) if tweet_id else sum(ord(c) for c in url)
    rng = random.Random(seed_val)

    likes = rng.randint(50000, 1000000)
    comments = rng.randint(int(likes * 0.05), int(likes * 0.2))
    shares = rng.randint(int(likes * 0.1), int(likes * 0.4))

    end_date = datetime.now(timezone.utc)
    records = []

    spike_day = days - rng.randint(3, 7)

    base_l, base_c, base_s = likes * 0.3 / days, comments * 0.3 / days, shares * 0.3 / days
    spike_l, spike_c, spike_s = likes * 0.5, comments * 0.5, shares * 0.5
    secondary_l, secondary_c, secondary_s = likes * 0.2, comments * 0.2, shares * 0.2

    for i in range(days):
        current_date = end_date - timedelta(days=(days - 1 - i))

        day_l = base_l + rng.uniform(-0.1, 0.1) * base_l
        day_c = base_c + rng.uniform(-0.1, 0.1) * base_c
        day_s = base_s + rng.uniform(-0.1, 0.1) * base_s

        if i == spike_day:
            day_l += spike_l
            day_c += spike_c
            day_s += spike_s
        elif i == spike_day + 1:
            day_l += secondary_l
            day_c += secondary_c
            day_s += secondary_s

        records.append(
            {
                "date": current_date.strftime("%Y-%m-%d"),
                "likes": int(max(0, day_l)),
                "comments": int(max(0, day_c)),
                "shares": int(max(0, day_s)),
                "posts": 1,
            }
        )

    df = pd.DataFrame(records)
    return _normalise(df)


def _normalise(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure required columns exist and date is parsed correctly."""
    required = {"date", "likes", "comments", "shares", "posts"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV is missing columns: {missing}")

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    numeric_cols = ["likes", "comments", "shares", "posts"]
    df[numeric_cols] = df[numeric_cols].replace([np.inf, -np.inf], np.nan).fillna(0).astype(float)
    return df


def _extract_json_payload(text: str) -> str:
    raw = (text or "").strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    if raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()

    match = re.search(r"\{.*\}", raw, re.DOTALL)
    return match.group(0) if match else raw


def dataframe_to_records(df: pd.DataFrame) -> list:
    """Convert dataframe to JSON-friendly list of dicts (plain int/float, no NumPy scalars)."""
    df = df.copy()
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")
    rows = df.to_dict(orient="records")
    out = []
    for row in rows:
        out.append(
            {
                "date": row["date"],
                "likes": int(max(0, round(float(row.get("likes", 0))))),
                "comments": int(max(0, round(float(row.get("comments", 0))))),
                "shares": int(max(0, round(float(row.get("shares", 0))))),
                "posts": int(max(0, round(float(row.get("posts", 0))))),
            }
        )
    return out
