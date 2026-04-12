"""Recursively convert response payloads to JSON-serialisable Python types."""

from __future__ import annotations

import math
from typing import Any


def sanitize_for_json(obj: Any) -> Any:
    if obj is None or isinstance(obj, bool):
        return obj
    if isinstance(obj, str):
        return obj
    if isinstance(obj, int) and not isinstance(obj, bool):
        return obj
    if isinstance(obj, float):
        return 0.0 if not math.isfinite(obj) else obj
    if isinstance(obj, dict):
        return {str(k): sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [sanitize_for_json(v) for v in obj]
    try:
        import numpy as np

        if isinstance(obj, np.generic):
            return sanitize_for_json(obj.item())
    except ImportError:
        pass
    if isinstance(obj, (bytes, bytearray)):
        return obj.decode("utf-8", errors="replace")
    return str(obj)
