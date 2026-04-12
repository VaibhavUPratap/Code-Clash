"""
Detection Service – identifies anomalies in a time-series using
Z-score (rolling window) and IQR methods.
"""

import math

import numpy as np
import pandas as pd
from config import Config


def detect_anomalies(df: pd.DataFrame, metric: str = "likes") -> list:
    """
    Run both Z-score and IQR detection on *metric* column.
    Returns a deduplicated list of anomaly dicts sorted by date.
    """
    if metric not in df.columns:
        raise ValueError(f"Metric '{metric}' not found in data columns: {list(df.columns)}")

    anomalies_zscore = _zscore_detection(df, metric)
    anomalies_iqr = _iqr_detection(df, metric)

    # Merge and deduplicate by date
    seen = set()
    merged = []
    for a in anomalies_zscore + anomalies_iqr:
        key = (a["date"], a["metric"])
        if key not in seen:
            seen.add(key)
            merged.append(a)

    merged.sort(key=lambda x: x["date"])
    return merged


def detect_all_metrics(df: pd.DataFrame) -> list:
    """Run detection across all numeric engagement metrics."""
    if df is None or len(df) == 0:
        return []
    metrics = ["likes", "comments", "shares", "posts"]
    all_anomalies = []
    for metric in metrics:
        if metric in df.columns:
            all_anomalies.extend(detect_anomalies(df, metric))

    all_anomalies.sort(key=lambda x: (x["date"], x["metric"]))
    return all_anomalies


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _zscore_detection(df: pd.DataFrame, metric: str) -> list:
    window = Config.ROLLING_WINDOW
    threshold = Config.ZSCORE_THRESHOLD

    series = df[metric].copy()
    rolling_mean = series.rolling(window=window, min_periods=3).mean()
    rolling_std = series.rolling(window=window, min_periods=3).std()

    # Avoid division by zero
    rolling_std = rolling_std.replace(0, np.nan)
    z_scores = (series - rolling_mean) / rolling_std

    anomalies = []
    for idx in df.index:
        z = z_scores.loc[idx]
        if pd.isna(z) or abs(z) < threshold:
            continue

        value = float(series.loc[idx])
        prev_mean = float(rolling_mean.loc[idx]) if not pd.isna(rolling_mean.loc[idx]) else value

        anomalies.append(
            _build_anomaly(
                date=df.loc[idx, "date"].strftime("%Y-%m-%d"),
                value=value,
                z_score=float(z),
                metric=metric,
                method="zscore",
                prev_mean=prev_mean,
            )
        )

    return anomalies


def _iqr_detection(df: pd.DataFrame, metric: str) -> list:
    multiplier = Config.IQR_MULTIPLIER
    series = df[metric].copy()

    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr = q3 - q1
    lower = q1 - multiplier * iqr
    upper = q3 + multiplier * iqr

    global_mean = series.mean()
    global_std = series.std() if series.std() != 0 else 1.0

    anomalies = []
    for idx in df.index:
        value = float(series.loc[idx])
        if lower <= value <= upper:
            continue

        z = float((value - global_mean) / global_std)
        anomalies.append(
            _build_anomaly(
                date=df.loc[idx, "date"].strftime("%Y-%m-%d"),
                value=value,
                z_score=z,
                metric=metric,
                method="iqr",
                prev_mean=float(global_mean),
            )
        )

    return anomalies


def _finite_num(x, default: float = 0.0) -> float:
    try:
        v = float(x)
        if math.isnan(v) or math.isinf(v):
            return default
        return v
    except (TypeError, ValueError):
        return default


def _build_anomaly(
    date: str,
    value: float,
    z_score: float,
    metric: str,
    method: str,
    prev_mean: float,
) -> dict:
    value = _finite_num(value)
    z_score = _finite_num(z_score)
    prev_mean = _finite_num(prev_mean)
    anomaly_type = "spike" if z_score > 0 else "drop"
    severity = _classify_severity(abs(z_score))
    pct_change = ((value - prev_mean) / prev_mean * 100) if prev_mean != 0 else 0.0
    pct_change = _finite_num(pct_change)

    return {
        "date": date,
        "metric": metric,
        "value": round(value, 2),
        "z_score": round(z_score, 4),
        "type": anomaly_type,
        "severity": severity,
        "pct_change": round(pct_change, 2),
        "detection_method": method,
        "baseline_mean": round(prev_mean, 2),
    }


def _classify_severity(abs_z: float) -> str:
    if abs_z >= Config.SEVERITY_CRITICAL:
        return "critical"
    if abs_z >= Config.SEVERITY_MEDIUM:
        return "medium"
    return "low"
