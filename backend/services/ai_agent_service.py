"""
AI Agent Service – uses OpenAI (or a deterministic mock fallback) to explain
anomalies detected in social media engagement data.

Output contract (strict JSON):
{
  "type":           "viral | bot | crisis",
  "cause":          "<short explanation>",
  "confidence":     "low | medium | high",
  "recommendation": "<actionable advice>"
}
"""

import json
import re
from config import Config

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def explain_anomaly(anomaly: dict, context: dict | None = None) -> dict:
    """
    Given an anomaly dict and optional multi-metric context, return an
    AI-generated explanation as a structured dict.
    """
    prompt = _build_prompt(anomaly, context or {})
    if OPENAI_AVAILABLE and Config.OPENAI_API_KEY:
        raw = _call_openai(prompt)
    else:
        raw = _mock_explanation(anomaly)

    return _parse_response(raw, anomaly)


def explain_batch(anomalies: list, df_records: list) -> list:
    """Explain every anomaly; enrich each with multi-metric context."""
    results = []
    for anomaly in anomalies:
        context = _build_context(anomaly, df_records)
        explanation = explain_anomaly(anomaly, context)
        results.append({**anomaly, "ai_insight": explanation})
    return results


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are an expert social media data analyst specialising in
anomaly detection. Analyse the provided engagement anomaly and return ONLY a
valid JSON object — no markdown, no extra text — with exactly these keys:
  "type", "cause", "confidence", "recommendation"

Rules:
- "type"  must be one of: viral, bot, crisis
- "confidence" must be one of: low, medium, high
- Keep "cause" under 120 characters
- Keep "recommendation" under 200 characters
"""


def _build_prompt(anomaly: dict, context: dict) -> str:
    lines = [
        f"Metric:        {anomaly.get('metric', 'likes')}",
        f"Anomaly type:  {anomaly.get('type', 'spike')} ({anomaly.get('severity', 'low')} severity)",
        f"Date:          {anomaly.get('date', 'unknown')}",
        f"Value:         {anomaly.get('value', 0)}",
        f"Baseline mean: {anomaly.get('baseline_mean', 0)}",
        f"% change:      {anomaly.get('pct_change', 0):.1f}%",
        f"Z-score:       {anomaly.get('z_score', 0):.2f}",
    ]

    if context:
        lines.append("\nMulti-metric context on same date:")
        for k, v in context.items():
            if k != anomaly.get("metric"):
                lines.append(f"  {k}: {v}")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# OpenAI call
# ---------------------------------------------------------------------------

def _call_openai(user_prompt: str) -> str:
    client = OpenAI(api_key=Config.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=Config.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=256,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content


# ---------------------------------------------------------------------------
# Mock fallback (no API key required)
# ---------------------------------------------------------------------------

_MOCK_RULES = [
    # (condition, type, cause, confidence, recommendation)
    (
        lambda a: a.get("pct_change", 0) > 200 and a.get("metric") == "likes",
        "viral",
        "Extreme spike in likes suggests a post went viral, possibly due to a trending topic or celebrity mention.",
        "high",
        "Capitalise on the momentum: post follow-up content, engage with commenters, and monitor share velocity.",
    ),
    (
        lambda a: a.get("pct_change", 0) > 150 and a.get("metric") == "comments",
        "crisis",
        "Unusual comment surge often indicates a controversy or breaking news driving heated discussion.",
        "medium",
        "Review comment sentiment immediately. Prepare a response statement if negative sentiment dominates.",
    ),
    (
        lambda a: a.get("type") == "spike"
        and a.get("metric") == "posts"
        and a.get("pct_change", 0) > 100,
        "bot",
        "Coordinated post spike with disproportionate posting volume is a strong indicator of bot activity.",
        "high",
        "Flag accounts for rate-limit review. Cross-check engagement ratios (likes/post) for authenticity.",
    ),
    (
        lambda a: a.get("type") == "drop" and abs(a.get("pct_change", 0)) > 50,
        "crisis",
        "Sharp engagement drop may reflect platform algorithm changes, audience fatigue, or a brand crisis.",
        "medium",
        "Audit recent content for quality issues. Check platform status pages for algorithm updates.",
    ),
    (
        lambda a: a.get("severity") == "critical",
        "viral",
        "Critical-severity anomaly indicates an extraordinary engagement event outside normal distribution.",
        "high",
        "Investigate the top-performing content on this date and replicate successful elements.",
    ),
]

_DEFAULT_MOCK = {
    "type": "viral",
    "cause": "Engagement anomaly detected — likely driven by trending content or external news event.",
    "confidence": "low",
    "recommendation": "Monitor the trend over the next 24–48 hours and review top-performing posts.",
}


def _mock_explanation(anomaly: dict) -> str:
    for condition, atype, cause, confidence, recommendation in _MOCK_RULES:
        if condition(anomaly):
            return json.dumps(
                {
                    "type": atype,
                    "cause": cause,
                    "confidence": confidence,
                    "recommendation": recommendation,
                }
            )
    return json.dumps(_DEFAULT_MOCK)


# ---------------------------------------------------------------------------
# Response parser
# ---------------------------------------------------------------------------

def _parse_response(raw: str, anomaly: dict) -> dict:
    try:
        data = json.loads(raw)
        return {
            "type": _safe_enum(data.get("type"), ["viral", "bot", "crisis"], "viral"),
            "cause": str(data.get("cause", "Unknown cause"))[:300],
            "confidence": _safe_enum(
                data.get("confidence"), ["low", "medium", "high"], "low"
            ),
            "recommendation": str(data.get("recommendation", "Monitor the trend."))[:400],
        }
    except (json.JSONDecodeError, TypeError):
        # Attempt to extract JSON from partial response
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            return _parse_response(match.group(), anomaly)
        return {**_DEFAULT_MOCK}


def _safe_enum(value, allowed: list, default: str) -> str:
    if isinstance(value, str) and value.lower() in allowed:
        return value.lower()
    return default


# ---------------------------------------------------------------------------
# Context builder
# ---------------------------------------------------------------------------

def _build_context(anomaly: dict, df_records: list) -> dict:
    date = anomaly.get("date")
    record = next((r for r in df_records if r.get("date") == date), None)
    if not record:
        return {}
    return {
        k: v
        for k, v in record.items()
        if k in ("likes", "comments", "shares", "posts") and k != anomaly.get("metric")
    }
