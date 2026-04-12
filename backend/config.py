import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Use long random values in production (JWT_SECRET ≥ 32 bytes recommended for HS256).
    _DEV_FALLBACK = "codeclash-local-dev-only-change-for-production-min-32!"
    SECRET_KEY = os.getenv("SECRET_KEY", _DEV_FALLBACK)
    JWT_SECRET = os.getenv("JWT_SECRET", SECRET_KEY)

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

    # Detection thresholds
    ZSCORE_THRESHOLD = float(os.getenv("ZSCORE_THRESHOLD", "2.5"))
    IQR_MULTIPLIER = float(os.getenv("IQR_MULTIPLIER", "1.5"))
    ROLLING_WINDOW = int(os.getenv("ROLLING_WINDOW", "7"))

    # Severity thresholds (z-score based)
    SEVERITY_MEDIUM = float(os.getenv("SEVERITY_MEDIUM", "3.0"))
    SEVERITY_CRITICAL = float(os.getenv("SEVERITY_CRITICAL", "4.5"))
