"""
AI Agent Service – explains anomalies using engagement metrics and optional
deep-research context (virality, topics, risks).
"""

from __future__ import annotations

import json
import logging
import math
import re
from typing import Any

from config import Config

logger = logging.getLogger(__name__)

from services.gemini_service import call_gemini, extract_json_payload, is_gemini_ready


# ---------------------------------------------------------------------------
# Research bundle (compact, prompt-safe)
# ---------------------------------------------------------------------------


def research_bundle(link_research: dict | None) -> dict[str, Any]:
    """Flatten link_research_service output for prompts and mocks."""
    if not link_research:
        return {}
    v = link_research.get("virality") or {}
    asm = link_research.get("assessment") or {}
    score = float(v.get("score") or 0)
    return {
        "virality_score_0_1": round(min(1.0, max(0.0, score / 100.0)), 3),
        "virality_score_100": round(score, 1),
        "verdict": asm.get("verdict") or v.get("label") or "",
        "research_summary": (asm.get("summary") or "")[:500],
        "key_topics": (asm.get("key_topics") or [])[:10]
        if isinstance(asm.get("key_topics"), list)
        else [],
        "risk_signals": (asm.get("risk_signals") or [])[:10]
        if isinstance(asm.get("risk_signals"), list)
        else [],
        "deep_dive": (asm.get("deep_dive") or "")[:400],
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def explain_anomaly(
    anomaly: dict,
    context_metrics: dict | None = None,
    research: dict | None = None,
) -> dict:
    """Return structured AI insight; ``research`` is output of research_bundle()."""
    ctx = context_metrics or {}
    r = research or {}
    prompt = _build_prompt(anomaly, ctx, r)
    if is_gemini_ready():
        try:
            raw = _call_gemini(prompt)
        except Exception as exc:
            logger.warning("Gemini explanation failed; using mock. %s", exc)
            raw = _mock_explanation(anomaly, r)
    else:
        raw = _mock_explanation(anomaly, r)

    return _parse_response(raw, anomaly)


def explain_batch(
    anomalies: list,
    df_records: list,
    link_research: dict | None = None,
) -> list:
    """Explain each anomaly with shared deep-research context (single call upstream)."""
    rb = research_bundle(link_research) if link_research else {}
    results = []
    for anomaly in anomalies:
        ctx = _build_context(anomaly, df_records)
        explanation = explain_anomaly(anomaly, ctx, rb)
        results.append({**anomaly, "ai_insight": explanation})
    return results


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are an expert social media analyst. Given one engagement anomaly,
optional same-day metrics, and optional deep-research context (page/URL analysis),
return ONLY valid JSON with exactly these keys:
  "type", "cause", "confidence", "explanation", "impact", "recommendation"

Rules:
- "type" must be one of: viral, bot, crisis (viral = attention spike / viral pattern)
- "confidence": low, medium, or high
- "cause": concise root-cause line (<= 160 chars) using BOTH metrics and research when present
- "explanation": 1-2 sentences expanding the cause (<= 400 chars)
- "impact": one sentence on business/operational impact (<= 200 chars)
- "recommendation": actionable next step (<= 220 chars)
If research fields are empty, rely on metrics only and say so briefly in explanation.
"""


def _fmt_num(x, default: float = 0.0, nd: int = 2) -> str:
    try:
        v = float(x)
        if math.isnan(v) or math.isinf(v):
            v = default
        return f"{v:.{nd}f}"
    except (TypeError, ValueError):
        return f"{default:.{nd}f}"


def _build_prompt(anomaly: dict, context: dict, research: dict) -> str:
    lines = [
        "=== Anomaly ===",
        f"Metric:        {anomaly.get('metric', 'likes')}",
        f"Anomaly type:  {anomaly.get('type', 'spike')} ({anomaly.get('severity', 'low')} severity)",
        f"Date:          {anomaly.get('date', 'unknown')}",
        f"Value:         {_fmt_num(anomaly.get('value', 0), nd=2)}",
        f"Baseline mean: {_fmt_num(anomaly.get('baseline_mean', 0), nd=2)}",
        f"% change:      {_fmt_num(anomaly.get('pct_change', 0), nd=1)}%",
        f"Z-score:       {_fmt_num(anomaly.get('z_score', 0), nd=2)}",
    ]

    metric_keys = {k for k in context if k in ("likes", "comments", "shares", "posts")}
    if metric_keys:
        lines.append("\n=== Same-day metrics ===")
        for k in sorted(metric_keys):
            if k != anomaly.get("metric"):
                lines.append(f"  {k}: {context.get(k)}")

    if research:
        lines.append("\n=== Deep research (URL/page) ===")
        lines.append(f"  Virality (0-1): {research.get('virality_score_0_1', 0)}")
        lines.append(f"  Verdict: {research.get('verdict', 'n/a')}")
        summ = research.get("research_summary") or ""
        if summ:
            lines.append(f"  Summary: {summ[:320]}")
        topics = research.get("key_topics") or []
        if topics:
            lines.append(f"  Topics: {', '.join(str(t) for t in topics[:8])}")
        risks = research.get("risk_signals") or []
        if risks:
            lines.append(f"  Risks: {'; '.join(str(r) for r in risks[:5])}")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Gemini call
# ---------------------------------------------------------------------------


def _call_gemini(user_prompt: str) -> str:
    return call_gemini(
        prompt=user_prompt,
        system_instruction=SYSTEM_PROMPT,
        temperature=0.2,
        max_tokens=450
    )


# ---------------------------------------------------------------------------
# Mock fallback
# ---------------------------------------------------------------------------

_DEFAULT_MOCK = {
    "type": "viral",
    "cause": "Engagement anomaly — pattern suggests attention spike or external driver.",
    "confidence": "low",
    "explanation": "Metrics deviate from baseline; without live platform API, treat as indicative only.",
    "impact": "Short-term reach and engagement volatility may affect campaign pacing.",
    "recommendation": "Monitor the next 24–48 hours and cross-check top content on the anomaly date.",
}


def _mock_explanation(anomaly: dict, research: dict) -> str:
    for condition, atype, cause, confidence, recommendation in _MOCK_RULES:
        if condition(anomaly):
            expl, impact = _mock_extras(anomaly, research, atype)
            return json.dumps(
                {
                    "type": atype,
                    "cause": cause,
                    "confidence": confidence,
                    "explanation": expl,
                    "impact": impact,
                    "recommendation": recommendation,
                }
            )
    expl, impact = _mock_extras(anomaly, research, "viral")
    return json.dumps(
        {
            **_DEFAULT_MOCK,
            "explanation": expl,
            "impact": impact,
        }
    )


def _mock_extras(anomaly: dict, research: dict, atype: str) -> tuple[str, str]:
    parts = []
    if research.get("research_summary"):
        parts.append(f"Research summary: {research['research_summary'][:200]}")
    if research.get("key_topics"):
        parts.append("Topics: " + ", ".join(str(t) for t in research["key_topics"][:5]))
    if research.get("risk_signals"):
        parts.append("Risks flagged: " + "; ".join(str(r) for r in research["risk_signals"][:3]))
    expl = " ".join(parts) if parts else _DEFAULT_MOCK["explanation"]
    if atype == "crisis":
        impact = "Reputation and trust metrics may be pressured if sentiment turns negative."
    elif atype == "bot":
        impact = "Authenticity of engagement may be questioned; audit ratios and sources."
    else:
        impact = "High visibility window — upside for reach if content aligns with brand."
    return expl[:400], impact[:200]


_MOCK_RULES = [
    (
        lambda a: a.get("pct_change", 0) > 200 and a.get("metric") == "likes",
        "viral",
        "Extreme spike in likes suggests viral pickup or strong external amplification.",
        "high",
        "Capitalise on momentum: follow-up posts, engage comments, track share velocity.",
    ),
    (
        lambda a: a.get("pct_change", 0) > 150 and a.get("metric") == "comments",
        "crisis",
        "Comment surge often tracks controversy, news, or heated debate.",
        "medium",
        "Review sentiment urgently; prepare a measured response if negativity dominates.",
    ),
    (
        lambda a: a.get("type") == "spike"
        and a.get("metric") == "posts"
        and a.get("pct_change", 0) > 100,
        "bot",
        "Posting volume spike with abnormal rhythm can indicate coordinated or automated activity.",
        "high",
        "Review posting sources and rate limits; validate engagement quality.",
    ),
    (
        lambda a: a.get("type") == "drop" and abs(a.get("pct_change", 0)) > 50,
        "crisis",
        "Sharp drop may reflect algorithm shifts, fatigue, or reputational drag.",
        "medium",
        "Audit recent content and platform health; compare with peer benchmarks.",
    ),
    (
        lambda a: a.get("severity") == "critical",
        "viral",
        "Critical statistical outlier — unusually strong engagement event.",
        "high",
        "Identify the winning asset on this date and isolate what drove the spike.",
    ),
]


# ---------------------------------------------------------------------------
# Response parser
# ---------------------------------------------------------------------------


def _parse_response(raw: str, anomaly: dict) -> dict:
    if raw is None or not str(raw).strip():
        raw = json.dumps(_DEFAULT_MOCK)
    try:
        data = json.loads(raw)
        cause = str(data.get("cause", "Unknown cause"))[:300]
        expl = str(data.get("explanation", "") or cause)[:450]
        impact = str(data.get("impact", ""))[:220]
        if not impact.strip():
            impact = "Monitor downstream engagement and sentiment."
        return {
            "type": _normalize_type(data.get("type")),
            "cause": cause,
            "confidence": _safe_enum(
                data.get("confidence"), ["low", "medium", "high"], "low"
            ),
            "explanation": expl,
            "impact": impact,
            "recommendation": str(data.get("recommendation", "Monitor the trend."))[:400],
        }
    except (json.JSONDecodeError, TypeError):
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            return _parse_response(match.group(), anomaly)
        return {
            "type": _normalize_type(_DEFAULT_MOCK["type"]),
            "cause": _DEFAULT_MOCK["cause"],
            "confidence": _DEFAULT_MOCK["confidence"],
            "explanation": _DEFAULT_MOCK["explanation"],
            "impact": _DEFAULT_MOCK["impact"],
            "recommendation": _DEFAULT_MOCK["recommendation"],
        }


def _normalize_type(value) -> str:
    if not value:
        return "viral"
    s = str(value).lower()
    if "bot" in s:
        return "bot"
    if "crisis" in s:
        return "crisis"
    return "viral"


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
