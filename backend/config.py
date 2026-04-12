import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN", "")

    # Detection thresholds
    ZSCORE_THRESHOLD = float(os.getenv("ZSCORE_THRESHOLD", "2.5"))
    IQR_MULTIPLIER = float(os.getenv("IQR_MULTIPLIER", "1.5"))
    ROLLING_WINDOW = int(os.getenv("ROLLING_WINDOW", "7"))

    # Severity thresholds (z-score based)
    SEVERITY_MEDIUM = float(os.getenv("SEVERITY_MEDIUM", "3.0"))
    SEVERITY_CRITICAL = float(os.getenv("SEVERITY_CRITICAL", "4.5"))
