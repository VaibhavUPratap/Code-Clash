"""
Data Service – loads engagement data from CSV or Reddit API.
Returns a list of dicts: {date, likes, comments, shares, posts}
"""

import io
import csv
import os
import re
import random
from datetime import datetime, timedelta
import pandas as pd

try:
    import tweepy
    TWEEPY_AVAILABLE = True
except ImportError:
    TWEEPY_AVAILABLE = False

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


def load_from_twitter(handle: str = "elonmusk", limit: int = 100) -> pd.DataFrame:
    """
    Fetch posts from a Twitter handle and aggregate engagement by day.
    Falls back to sample data when credentials are absent.
    """
    if not TWEEPY_AVAILABLE or not Config.TWITTER_BEARER_TOKEN:
        return load_from_csv()

    client = tweepy.Client(bearer_token=Config.TWITTER_BEARER_TOKEN)

    try:
        # Get user ID
        user = client.get_user(username=handle)
        if not user or not user.data:
            return load_from_csv()
        user_id = user.data.id

        # Get tweets
        response = client.get_users_tweets(id=user_id, max_results=limit, tweet_fields=["created_at", "public_metrics"])
        if not response or not response.data:
            return load_from_csv()

        records = []
        for tweet in response.data:
            ts = tweet.created_at
            metrics = tweet.public_metrics
            records.append(
                {
                    "date": ts.strftime("%Y-%m-%d"),
                    "likes": metrics.get("like_count", 0),
                    "comments": metrics.get("reply_count", 0),
                    "shares": metrics.get("retweet_count", 0),
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

    except Exception as e:
        print(f"Twitter API error: {e}")
        return load_from_csv()


def load_from_tweet_url(url: str, days: int = 90) -> pd.DataFrame:
    """
    Fetch a single tweet's stats and generate a synthetic historical time-series
    ending today, distributing the total metrics to create an artificial spike.
    """
    tweet_id = None
    match = re.search(r"status/(\d+)", url)
    if match:
        tweet_id = match.group(1)

    # Use tweet_id (or raw url) as a seed so each link produces distinct, consistent mock data
    seed_val = int(tweet_id) if tweet_id else sum(ord(c) for c in url)
    rng = random.Random(seed_val)

    likes = rng.randint(50000, 1000000)
    comments = rng.randint(int(likes * 0.05), int(likes * 0.2))
    shares = rng.randint(int(likes * 0.1), int(likes * 0.4))

    if TWEEPY_AVAILABLE and Config.TWITTER_BEARER_TOKEN and tweet_id:
        client = tweepy.Client(bearer_token=Config.TWITTER_BEARER_TOKEN)
        try:
            response = client.get_tweet(id=tweet_id, tweet_fields=["public_metrics"])
            if response and response.data:
                metrics = response.data.public_metrics
                likes = metrics.get("like_count", likes)
                comments = metrics.get("reply_count", comments)
                shares = metrics.get("retweet_count", shares)
        except Exception as e:
            print(f"Twitter API error for tweet URL: {e}")

    end_date = datetime.utcnow()
    records = []
    
    # Place the spike between 3 and 7 days ago
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
            
        records.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "likes": int(max(0, day_l)),
            "comments": int(max(0, day_c)),
            "shares": int(max(0, day_s)),
            "posts": 1
        })
        
    df = pd.DataFrame(records)
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
