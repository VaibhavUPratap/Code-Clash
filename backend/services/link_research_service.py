"""
Link Research Service

Performs URL-level research to estimate whether a post is viral by combining:
- Platform metrics (currently X/Twitter metrics when available)
- External mentions from Google News RSS
- Optional OpenAI synthesis over collected evidence
"""

from __future__ import annotations

import html
import json
import logging
import math
import re
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

from config import Config

try:
    import tweepy

    TWEEPY_AVAILABLE = True
except ImportError:
    TWEEPY_AVAILABLE = False

try:
    from openai import OpenAI

    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (compatible; CodeClashResearchBot/1.0)"


def research_post_url(url: str) -> dict:
    """Research a post URL and return a structured virality report."""
    normalized_url = _normalise_url(url)
    platform = _detect_platform(normalized_url)

    metadata = _fetch_url_metadata(normalized_url)
    platform_signals = _collect_platform_signals(normalized_url, platform)

    news_query = _build_news_query(normalized_url, metadata)
    news_signals = _fetch_news_mentions(news_query)

    virality = _compute_virality(platform_signals, news_signals)
    heuristic_assessment = _build_heuristic_assessment(virality, platform_signals, news_signals)

    llm_assessment = _llm_assessment(
        normalized_url, platform, metadata, platform_signals, news_signals, virality
    )

    sources = []
    if metadata.get("url"):
        sources.append({"type": "post", "title": metadata.get("title", "Source post"), "url": metadata["url"]})
    for article in news_signals.get("articles", [])[:5]:
        if article.get("url"):
            sources.append(
                {
                    "type": "news",
                    "title": article.get("title", "News mention"),
                    "url": article["url"],
                    "published_at": article.get("published_at"),
                }
            )

    return {
        "url": normalized_url,
        "platform": platform,
        "metadata": metadata,
        "signals": {
            "platform": platform_signals,
            "news": news_signals,
        },
        "virality": virality,
        "assessment": llm_assessment or heuristic_assessment,
        "research_mode": "openai" if llm_assessment else "heuristic",
        "sources": sources,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def _normalise_url(url: str) -> str:
    value = (url or "").strip()
    if not value:
        raise ValueError("A URL is required for link research.")

    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", value):
        value = f"https://{value}"

    parsed = urllib.parse.urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("Invalid URL. Please provide a full post link.")

    cleaned = parsed._replace(fragment="")
    return urllib.parse.urlunparse(cleaned)


def _detect_platform(url: str) -> str:
    host = urllib.parse.urlparse(url).netloc.lower()
    if "x.com" in host or "twitter.com" in host:
        return "x"
    if "reddit.com" in host:
        return "reddit"
    if "youtube.com" in host or "youtu.be" in host:
        return "youtube"
    if "instagram.com" in host:
        return "instagram"
    if "facebook.com" in host or "fb.watch" in host:
        return "facebook"
    return "web"


def _fetch_url_metadata(url: str) -> dict:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            content_type = response.headers.get("Content-Type", "")
            charset = response.headers.get_content_charset() or "utf-8"
            raw = response.read(350000)

        text = raw.decode(charset, errors="replace")
        title = _extract_title(text)
        description = _extract_description(text)

        return {
            "url": url,
            "title": title,
            "description": description,
            "content_type": content_type,
            "fetched": True,
        }
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        logger.warning("Failed to fetch metadata for %s: %s", url, exc)
        return {
            "url": url,
            "title": "",
            "description": "",
            "fetched": False,
            "reason": "Could not fetch page metadata.",
        }


def _extract_title(html_text: str) -> str:
    og_title = _extract_meta_content(html_text, "property", "og:title")
    if og_title:
        return og_title[:180]

    match = re.search(r"<title[^>]*>(.*?)</title>", html_text, re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    return _clean_html_text(match.group(1))[:180]


def _extract_description(html_text: str) -> str:
    og_description = _extract_meta_content(html_text, "property", "og:description")
    if og_description:
        return og_description[:300]

    description = _extract_meta_content(html_text, "name", "description")
    if description:
        return description[:300]

    return ""


def _extract_meta_content(html_text: str, attr: str, attr_value: str) -> str:
    pattern = (
        rf"<meta[^>]*{attr}\s*=\s*[\"']{re.escape(attr_value)}[\"'][^>]*content\s*=\s*[\"'](.*?)[\"'][^>]*>"
    )
    match = re.search(pattern, html_text, re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    return _clean_html_text(match.group(1))


def _clean_html_text(value: str) -> str:
    text = html.unescape(value)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _collect_platform_signals(url: str, platform: str) -> dict:
    if platform != "x":
        return {
            "available": False,
            "platform": platform,
            "reason": "Direct platform metrics are currently implemented for X/Twitter URLs.",
        }

    tweet_id = _extract_tweet_id(url)
    if not tweet_id:
        return {
            "available": False,
            "platform": "x",
            "reason": "Could not parse tweet ID from the URL.",
        }

    if not TWEEPY_AVAILABLE or not Config.TWITTER_BEARER_TOKEN:
        return {
            "available": False,
            "platform": "x",
            "tweet_id": tweet_id,
            "reason": "Twitter credentials unavailable. Add TWITTER_BEARER_TOKEN for live metrics.",
        }

    client = tweepy.Client(bearer_token=Config.TWITTER_BEARER_TOKEN)
    try:
        response = client.get_tweet(
            id=tweet_id,
            tweet_fields=["created_at", "public_metrics", "conversation_id"],
        )
        if not response or not response.data:
            return {
                "available": False,
                "platform": "x",
                "tweet_id": tweet_id,
                "reason": "Tweet not found or inaccessible from API.",
            }

        tweet = response.data
        metrics = tweet.public_metrics or {}
        conversation_id = getattr(tweet, "conversation_id", None)

        return {
            "available": True,
            "platform": "x",
            "tweet_id": tweet_id,
            "created_at": getattr(tweet, "created_at", None).isoformat()
            if getattr(tweet, "created_at", None)
            else None,
            "conversation_id": str(conversation_id) if conversation_id else None,
            "conversation_posts_7d": _count_conversation_posts(client, conversation_id),
            "metrics": {
                "likes": int(metrics.get("like_count", 0)),
                "comments": int(metrics.get("reply_count", 0)),
                "shares": int(metrics.get("retweet_count", 0)),
                "quotes": int(metrics.get("quote_count", 0)),
                "bookmarks": int(metrics.get("bookmark_count", 0)),
                "impressions": int(metrics.get("impression_count", 0)),
            },
        }
    except Exception as exc:
        err_str = str(exc)
        logger.warning("Twitter metric fetch failed for %s: %s", url, exc)
        # Detect 402 Payment Required — Twitter API access tier issue
        if "402" in err_str or "Payment Required" in err_str or "credits" in err_str.lower():
            reason = (
                "Twitter API account has no credits / insufficient access tier. "
                "Upgrade to Basic or Pro at developer.x.com to enable live metrics."
            )
        elif "401" in err_str or "Unauthorized" in err_str:
            reason = "Twitter Bearer Token is invalid or expired. Update TWITTER_BEARER_TOKEN in .env."
        elif "403" in err_str or "Forbidden" in err_str:
            reason = "Twitter API access is forbidden for this endpoint. The Bearer Token may lack required permissions."
        else:
            reason = f"Twitter API request failed: {err_str[:120]}"
        return {
            "available": False,
            "platform": "x",
            "tweet_id": tweet_id,
            "reason": reason,
        }


def _extract_tweet_id(url: str) -> str | None:
    match = re.search(r"status/(\d+)", url)
    return match.group(1) if match else None


def _count_conversation_posts(client, conversation_id) -> int | None:
    if not conversation_id:
        return None

    try:
        response = client.search_recent_tweets(
            query=f"conversation_id:{conversation_id}",
            max_results=100,
            tweet_fields=["id"],
        )
        if not response or not response.data:
            return 0
        return len(response.data)
    except Exception:
        return None


def _build_news_query(url: str, metadata: dict) -> str:
    parsed = urllib.parse.urlparse(url)
    host = parsed.netloc.lower().replace("www.", "")
    is_tweet = host in ("x.com", "twitter.com")

    tokens = []

    # Prefer title-based tokens when we have metadata
    if metadata.get("title"):
        title_tokens = re.findall(r"[A-Za-z0-9]{4,}", metadata["title"])
        tokens.extend(title_tokens[:6])

    if is_tweet:
        # For X/Twitter URLs, extract the handle from the URL path (e.g. /elonmusk/status/...)
        # and use that as the primary search token rather than meaningless numeric IDs
        path_parts = [p for p in parsed.path.strip("/").split("/") if p]
        # path_parts[0] is the username, path_parts[1] is "status", path_parts[2] is tweet id
        if path_parts and not path_parts[0].isdigit():
            handle = path_parts[0]  # e.g. "elonmusk"
            if not tokens:  # Only use handle if we have no title tokens
                tokens.insert(0, handle)
    else:
        path_tokens = [
            t
            for t in re.split(r"[\/_\-]+", parsed.path)
            if t and not t.isdigit() and len(t) >= 4
        ]
        tokens.extend(path_tokens[:4])

    deduped = []
    seen = set()
    # For tweets, skip adding the bare domain (x.com) since it's too generic
    lead_tokens = [] if (is_tweet and not tokens) else []
    for token in [*lead_tokens, *tokens]:
        token_norm = token.lower()
        if token_norm in seen:
            continue
        seen.add(token_norm)
        deduped.append(token)

    if not deduped:
        return host

    return " ".join(deduped[:8])


def _resolve_google_news_url(rss_url: str) -> str:
    """Follow the Google News RSS redirect to get the real article URL."""
    if "news.google.com" not in rss_url:
        return rss_url
    try:
        req = urllib.request.Request(
            rss_url,
            headers={"User-Agent": USER_AGENT},
        )
        # Disable auto-redirect to capture the Location header
        class _NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: D102
                return None

        opener = urllib.request.build_opener(_NoRedirect)
        try:
            with opener.open(req, timeout=5) as resp:
                # If no redirect, just return the original
                return resp.geturl() or rss_url
        except urllib.error.HTTPError as e:
            location = e.headers.get("Location", "")
            if location:
                return location
            return rss_url
    except Exception:
        return rss_url


def _fetch_news_mentions(query: str) -> dict:
    rss_url = (
        "https://news.google.com/rss/search?q="
        + urllib.parse.quote_plus(query)
        + "&hl=en-US&gl=US&ceid=US:en"
    )

    req = urllib.request.Request(rss_url, headers={"User-Agent": USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            xml_text = response.read(500000).decode("utf-8", errors="replace")

        root = ET.fromstring(xml_text)
        items = root.findall(".//item")

        now = datetime.now(timezone.utc)
        mentions_24h = 0
        mentions_7d = 0
        articles = []

        for item in items[:20]:
            title = (item.findtext("title") or "").strip()
            raw_link = (item.findtext("link") or "").strip()
            pub_raw = (item.findtext("pubDate") or "").strip()
            source_tag = item.find("source")
            source = source_tag.text.strip() if source_tag is not None and source_tag.text else ""
            # <source url="https://actual-publisher.com"> often carries the real domain
            source_url = source_tag.get("url", "") if source_tag is not None else ""

            # Try to resolve Google News RSS redirect; fall back to source_url if still an RSS link
            resolved_link = _resolve_google_news_url(raw_link) if raw_link else raw_link
            # If resolution didn't change the URL (still news.google.com), use source domain as fallback
            if "news.google.com" in resolved_link and source_url:
                link = source_url
            else:
                link = resolved_link or raw_link

            published_at = _parse_pub_date(pub_raw)
            if published_at is not None:
                age = now - published_at
                if age <= timedelta(days=1):
                    mentions_24h += 1
                if age <= timedelta(days=7):
                    mentions_7d += 1

            articles.append(
                {
                    "title": title,
                    "url": link,
                    "source": source,
                    "source_url": source_url,
                    "published_at": published_at.isoformat() if published_at else None,
                }
            )

        return {
            "available": True,
            "query": query,
            "mentions_24h": mentions_24h,
            "mentions_7d": mentions_7d,
            "articles": articles,
        }
    except Exception as exc:
        logger.warning("News research failed for query '%s': %s", query, exc)
        return {
            "available": False,
            "query": query,
            "mentions_24h": 0,
            "mentions_7d": 0,
            "articles": [],
            "reason": "Could not fetch news mentions.",
        }


def _parse_pub_date(value: str) -> datetime | None:
    if not value:
        return None

    try:
        dt = parsedate_to_datetime(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except (TypeError, ValueError, OverflowError):
        return None


def _compute_virality(platform_signals: dict, news_signals: dict) -> dict:
    metrics = platform_signals.get("metrics", {}) if platform_signals.get("available") else {}

    likes = float(metrics.get("likes", 0))
    comments = float(metrics.get("comments", 0))
    shares = float(metrics.get("shares", 0))
    quotes = float(metrics.get("quotes", 0))

    engagement_component = (
        _cap(math.log10(likes + 1) * 12.0, 34.0)
        + _cap(math.log10(comments + 1) * 9.0, 20.0)
        + _cap(math.log10(shares + 1) * 12.0, 25.0)
        + _cap(math.log10(quotes + 1) * 6.0, 10.0)
    )

    conversation_posts = platform_signals.get("conversation_posts_7d") or 0
    conversation_component = _cap(float(conversation_posts) * 0.6, 12.0)

    mentions_24h = float(news_signals.get("mentions_24h", 0))
    mentions_7d = float(news_signals.get("mentions_7d", 0))
    news_component = _cap(mentions_24h * 2.8 + mentions_7d * 1.8, 28.0)

    score = round(min(100.0, engagement_component + conversation_component + news_component), 1)

    if score >= 70:
        label = "viral"
    elif score >= 45:
        label = "trending"
    else:
        label = "normal"

    confidence = _derive_confidence(platform_signals, news_signals)

    return {
        "score": score,
        "label": label,
        "confidence": confidence,
        "breakdown": {
            "engagement": round(engagement_component, 1),
            "conversation": round(conversation_component, 1),
            "news": round(news_component, 1),
        },
    }


def _cap(value: float, maximum: float) -> float:
    return min(maximum, max(0.0, value))


def _derive_confidence(platform_signals: dict, news_signals: dict) -> str:
    evidence_points = 0
    if platform_signals.get("available"):
        evidence_points += 1
    if news_signals.get("available") and news_signals.get("mentions_7d", 0) > 0:
        evidence_points += 1
    if platform_signals.get("conversation_posts_7d") not in (None, 0):
        evidence_points += 1

    if evidence_points >= 3:
        return "high"
    if evidence_points >= 2:
        return "medium"
    return "low"


def _build_heuristic_assessment(virality: dict, platform_signals: dict, news_signals: dict) -> dict:
    score = virality["score"]
    label = virality["label"]

    reasons = []
    metrics = platform_signals.get("metrics", {})

    if metrics.get("likes", 0) >= 100000:
        reasons.append("High like count indicates broad social reach.")
    if metrics.get("shares", 0) >= 10000:
        reasons.append("High share velocity suggests strong redistribution.")
    if news_signals.get("mentions_24h", 0) > 0:
        reasons.append("The topic appears in recent news coverage.")
    if not reasons:
        reasons.append("Current evidence shows limited cross-platform amplification.")

    if label == "viral":
        summary = "This post appears viral based on engagement and external mention signals."
        actions = [
            "Monitor engagement every 1-2 hours for momentum shifts.",
            "Prepare follow-up content while attention remains high.",
        ]
    elif label == "trending":
        summary = "This post appears to be trending but not yet fully viral."
        actions = [
            "Track shares-to-likes ratio to confirm continued growth.",
            "Boost distribution with timely follow-up posts.",
        ]
    else:
        summary = "This post currently appears normal with limited virality signals."
        actions = [
            "Continue monitoring for 24 hours before final judgement.",
            "Watch for external pickup in news and repost activity.",
        ]

    return {
        "verdict": label,
        "confidence": virality.get("confidence", "low"),
        "summary": summary,
        "reasons": reasons[:5],
        "recommended_actions": actions,
        "score": score,
    }


def _llm_assessment(
    url: str,
    platform: str,
    metadata: dict,
    platform_signals: dict,
    news_signals: dict,
    virality: dict,
) -> dict | None:
    if not OPENAI_AVAILABLE or not Config.OPENAI_API_KEY:
        return None

    evidence = {
        "url": url,
        "platform": platform,
        "title": metadata.get("title", ""),
        "description": metadata.get("description", ""),
        "platform_signals": platform_signals,
        "news_mentions": {
            "query": news_signals.get("query"),
            "mentions_24h": news_signals.get("mentions_24h"),
            "mentions_7d": news_signals.get("mentions_7d"),
        },
        "virality_score": virality,
    }

    prompt = (
        "You are a digital intelligence analyst.\n"
        "Decide if the post is viral, trending, or normal using the evidence.\n"
        "Return strict JSON with keys: verdict, confidence, summary, reasons, recommended_actions.\n"
        "Rules:\n"
        "- verdict must be one of viral, trending, normal\n"
        "- confidence must be low, medium, or high\n"
        "- reasons must be an array of short strings\n"
        "- recommended_actions must be an array of practical actions\n\n"
        f"Evidence JSON:\n{json.dumps(evidence, ensure_ascii=True)}"
    )

    try:
        client = OpenAI(api_key=Config.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=Config.OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You produce concise JSON-only social intelligence reports.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=350,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)

        verdict = _safe_enum(data.get("verdict"), ["viral", "trending", "normal"], virality["label"])
        confidence = _safe_enum(data.get("confidence"), ["low", "medium", "high"], virality["confidence"])

        reasons = data.get("reasons") if isinstance(data.get("reasons"), list) else []
        reasons = [str(x)[:140] for x in reasons][:5]

        actions = (
            data.get("recommended_actions")
            if isinstance(data.get("recommended_actions"), list)
            else []
        )
        actions = [str(x)[:160] for x in actions][:5]

        summary = str(data.get("summary", "")).strip()[:400]
        if not summary:
            summary = "Evidence reviewed for cross-platform virality signals."

        return {
            "verdict": verdict,
            "confidence": confidence,
            "summary": summary,
            "reasons": reasons,
            "recommended_actions": actions,
            "score": virality["score"],
        }
    except Exception as exc:
        logger.warning("OpenAI virality synthesis failed: %s", exc)
        return None


def _safe_enum(value, allowed: list, default: str) -> str:
    if isinstance(value, str) and value.lower() in allowed:
        return value.lower()
    return default
