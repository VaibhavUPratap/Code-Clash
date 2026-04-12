"""
Lightweight trend prediction from historical series + optional deep-research signals.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def compute_prediction(
    records: list[dict[str, Any]],
    research: dict | None,
    anomalies: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Combine trailing metric momentum with research virality / risks.

    Returns JSON-safe dict for /api/analyze ``prediction`` field.
    """
    if not records:
        return {
            "trend": "unknown",
            "horizon_days": 7,
            "spike_expected": False,
            "downside_risk": False,
            "reason": "No time series loaded.",
        }

    metric = "likes"
    window = records[-14:] if len(records) >= 14 else records
    vals = [float(r.get(metric, 0) or 0) for r in window]
    first, last = vals[0], vals[-1]
    n = max(len(vals) - 1, 1)
    avg_growth = (last - first) / n
    mean_v = sum(vals) / len(vals) if vals else 0.0
    var = sum((v - mean_v) ** 2 for v in vals) / max(len(vals), 1)
    std = var**0.5

    hist_spike_hint = avg_growth > std * 1.2 if std > 0 else avg_growth > 0

    vblock = (research or {}).get("virality") or {}
    ablock = (research or {}).get("assessment") or {}
    score = float(vblock.get("score") or 0)
    risks = ablock.get("risk_signals") or []
    if not isinstance(risks, list):
        risks = []

    spike_expected = hist_spike_hint
    downside_risk = bool(risks)

    reason_parts: list[str] = []

    if score >= 70:
        spike_expected = True
        reason_parts.append(f"Deep research virality index is high ({score:.0f}/100), suggesting sustained attention.")
    elif score >= 45:
        reason_parts.append(f"Research indicates trending-level signals ({score:.0f}/100).")
    elif research:
        reason_parts.append(f"Research baseline read ({score:.0f}/100); forecast leans on history.")

    if risks:
        downside_risk = True
        reason_parts.append("Research flagged risk signals — allow for volatility or pullback.")

    critical_recent = sum(1 for a in anomalies[-20:] if a.get("severity") == "critical")
    if critical_recent >= 2:
        spike_expected = True
        reason_parts.append("Multiple critical anomalies recently — elevated short-term variance likely.")

    if avg_growth > 0 and mean_v > 0:
        if not reason_parts:
            reason_parts.append("Trailing window shows positive slope on primary metric.")
    elif avg_growth <= 0 and not reason_parts:
        reason_parts.append("Trailing window is flat or negative — expect mean reversion unless research contradicts.")

    if spike_expected and downside_risk:
        trend = "volatile"
    elif spike_expected:
        trend = "spike_prone"
    elif downside_risk:
        trend = "downside"
    elif abs(avg_growth) < (std * 0.3 if std > 0 else 1.0):
        trend = "stable"
    else:
        trend = "drifting"

    reason = " ".join(reason_parts)[:600]

    return {
        "trend": trend,
        "horizon_days": 7,
        "spike_expected": spike_expected,
        "downside_risk": downside_risk,
        "reason": reason,
        "research_virality_score": round(score, 1) if research else None,
        "historical_metric": metric,
    }
