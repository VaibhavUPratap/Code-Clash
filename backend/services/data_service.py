"""
Data Service – loads engagement data from CSV or Reddit API.
Returns a list of dicts: {date, likes, comments, shares, posts}
"""

import io
import csv
import os
from datetime import datetime, timedelta
import pandas as pd

try:
    import praw
    PRAW_AVAILABLE = True
except ImportError:
    PRAW_AVAILABLE = False

from config import Config

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


def load_from_reddit(subreddit: str = "worldnews", limit: int = 500) -> pd.DataFrame:
    """
    Fetch posts from a Reddit subreddit and aggregate engagement by day.
    Falls back to sample data when credentials are absent.
    """
    if not PRAW_AVAILABLE or not Config.REDDIT_CLIENT_ID:
        return load_from_csv()

    reddit = praw.Reddit(
        client_id=Config.REDDIT_CLIENT_ID,
        client_secret=Config.REDDIT_CLIENT_SECRET,
        user_agent=Config.REDDIT_USER_AGENT,
    )

    records = []
    for submission in reddit.subreddit(subreddit).new(limit=limit):
        ts = datetime.utcfromtimestamp(submission.created_utc)
        records.append(
            {
                "date": ts.strftime("%Y-%m-%d"),
                "likes": submission.score,
                "comments": submission.num_comments,
                "shares": 0,
                "posts": 1,
            }
        )

    if not records:
        return load_from_csv()

    df = pd.DataFrame(records)
    df = df.groupby("date", as_index=False).agg(
        likes=("likes", "sum"),
        comments=("comments", "sum"),
        shares=("shares", "sum"),
        posts=("posts", "sum"),
    )
    df = _normalise(df)
    return df


def _normalise(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure required columns exist and date is parsed correctly."""
    required = {"date", "likes", "comments", "shares", "posts"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV is missing columns: {missing}")

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    numeric_cols = ["likes", "comments", "shares", "posts"]
    df[numeric_cols] = df[numeric_cols].fillna(0).astype(float)
    return df


def dataframe_to_records(df: pd.DataFrame) -> list:
    """Convert dataframe to JSON-serialisable list of dicts."""
    df = df.copy()
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")
    return df.to_dict(orient="records")
