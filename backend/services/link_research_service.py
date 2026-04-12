"""
Link Research Service (link + on-page content + LLM)

Deep research uses only:
- HTTP fetch of the target URL (HTML metadata and readable text)
- Optional Gemini synthesis over that material

No Twitter/X API, Google News RSS, or other third-party data APIs.
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
from datetime import datetime, timezone

from config import Config

from services.gemini_service import call_gemini, extract_json_payload, is_gemini_ready

logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (compatible; CodeClashResearchBot/1.0)"
MAX_HTML_BYTES = 450_000
MAX_BODY_CHARS = 14_000


def research_post_url(url: str, anomaly_context: dict | None = None) -> dict:
    """Research a URL using fetched page content and optional LLM analysis."""
    normalized_url = _normalise_url(url)
    platform = _detect_platform(normalized_url)

    page = _fetch_page_content(normalized_url)
    page_signals = _build_page_signals(platform, page)
    external_signals = _external_signals_placeholder()

    virality = _compute_virality_from_page(page_signals, page)
    heuristic_assessment = _build_heuristic_assessment_page(virality, page_signals, page)

    llm_payload = _llm_deep_research(normalized_url, platform, page_signals, page, virality, anomaly_context)

    assessment = heuristic_assessment
    research_mode = "heuristic"
    if llm_payload:
        assessment = llm_payload.get("assessment") or heuristic_assessment
        if llm_payload.get("virality"):
            virality = {**virality, **llm_payload["virality"]}
        research_mode = "gemini"

    sources = _build_sources(normalized_url, page, assessment)

    fetched_ok = bool(page.get("fetched"))
    platform_signal_compat = {
        "available": fetched_ok,
        "platform": platform,
        "status": "ok" if fetched_ok else "error",
        "code": "page_content_only" if fetched_ok else "page_fetch_failed",
        "reason": "" if fetched_ok else (page.get("reason") or "Could not fetch page content."),
        "metrics": {},
        "page_metrics": {
            "text_chars": page_signals.get("text_chars"),
            "title_len": page_signals.get("title_len"),
            "hype_hits": page_signals.get("hype_lexicon_hits"),
        },
        "created_at": datetime.now(timezone.utc).isoformat() if fetched_ok else None,
    }
    news_signal_compat = {
        "available": False,
        "query": "",
        "mentions_24h": 0,
        "mentions_7d": 0,
        "articles": [],
        "reason": "News/RSS APIs are not used in link-only research mode.",
    }

    return {
        "url": normalized_url,
        "platform": platform,
        "url_context": _extract_url_context(normalized_url),
        "metadata": {
            "url": page.get("url", normalized_url),
            "title": page.get("title", ""),
            "description": page.get("description", ""),
            "content_type": page.get("content_type", ""),
            "fetched": page.get("fetched", False),
            "canonical_url": page.get("canonical_url"),
        },
        "page_excerpt": (page.get("body_text") or "")[:2000],
        "signals": {
            "page": page_signals,
            "external": external_signals,
            "platform": platform_signal_compat,
            "news": news_signal_compat,
        },
        "virality": virality,
        "assessment": assessment,
        "research_mode": research_mode,
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


def _extract_url_context(url: str) -> dict:
    """Extracts entity handles, IDs, and nicknames from URLs for AI contextualization."""
    try:
        parsed = urllib.parse.urlparse(url)
        host = parsed.netloc.lower()
        path = parsed.path.strip("/")
        parts = path.split("/")
        
        context = {"handle": None, "id": None, "type": "page"}
        
        if "x.com" in host or "twitter.com" in host:
            if len(parts) >= 1:
                context["handle"] = f"@{parts[0]}"
                context["type"] = "profile"
            if "status" in parts and len(parts) > parts.index("status") + 1:
                context["id"] = parts[parts.index("status") + 1]
                context["type"] = "post"
        
        elif "reddit.com" in host:
            if "r" in parts and len(parts) > parts.index("r") + 1:
                context["handle"] = f"r/{parts[parts.index('r') + 1]}"
                context["type"] = "community"
            if "comments" in parts:
                context["type"] = "thread"
                
        elif "youtube.com" in host or "youtu.be" in host:
            context["type"] = "video"
            if "v" in parts: context["id"] = parts[parts.index("v") + 1]
            elif len(parts) > 0 and "@" in parts[0]: context["handle"] = parts[0]
            
        return context
    except Exception:
        return {"handle": None, "id": None, "type": "web_page"}


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
    if "linkedin.com" in host:
        return "linkedin"
    return "web"


def _fetch_page_content(url: str) -> dict:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            content_type = response.headers.get("Content-Type", "")
            charset = response.headers.get_content_charset() or "utf-8"
            raw = response.read(MAX_HTML_BYTES)

        text = raw.decode(charset, errors="replace")
        title = _extract_title(text)
        description = _extract_description(text)
        canonical = _extract_canonical(text, url)
        body_text = _html_to_plain_text(text)

        return {
            "url": url,
            "title": title,
            "description": description,
            "canonical_url": canonical,
            "content_type": content_type,
            "body_text": body_text,
            "fetched": True,
        }
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        logger.warning("Failed to fetch page for %s: %s", url, exc)
        return {
            "url": url,
            "title": "",
            "description": "",
            "canonical_url": None,
            "content_type": "",
            "body_text": "",
            "fetched": False,
            "reason": "Could not fetch page content.",
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
        return og_description[:400]

    description = _extract_meta_content(html_text, "name", "description")
    if description:
        return description[:400]

    return ""


def _extract_canonical(html_text: str, fallback: str) -> str | None:
    href = _extract_link_rel(html_text, "canonical")
    if href:
        return href.strip()[:500]
    og_url = _extract_meta_content(html_text, "property", "og:url")
    if og_url:
        return og_url.strip()[:500]
    return fallback


def _extract_link_rel(html_text: str, rel_value: str) -> str:
    pattern = rf'<link[^>]*rel\s*=\s*["\']{re.escape(rel_value)}["\'][^>]*href\s*=\s*["\']([^"\']+)["\']'
    match = re.search(pattern, html_text, re.IGNORECASE)
    return _clean_html_text(match.group(1)) if match else ""


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


def _html_to_plain_text(html_text: str) -> str:
    text = re.sub(r"<script[^>]*>.*?</script>", " ", html_text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<noscript[^>]*>.*?</noscript>", " ", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = _clean_html_text(text)
    return text[:MAX_BODY_CHARS]


def _build_page_signals(platform: str, page: dict) -> dict:
    body = page.get("body_text") or ""
    title = page.get("title") or ""
    desc = page.get("description") or ""
    combined = f"{title} {desc} {body}".lower()

    hype_hits = sum(1 for w in ("breaking", "viral", "exclusive", "urgent", "live", "watch") if w in combined)
    social_cues = sum(1 for w in ("share", "follow", "subscribe", "like", "comment") if w in combined)

    return {
        "mode": "page_content",
        "platform": platform,
        "fetched": bool(page.get("fetched")),
        "text_chars": len(body),
        "title_len": len(title),
        "description_len": len(desc),
        "hype_lexicon_hits": hype_hits,
        "social_cta_hits": social_cues,
        "status": "ok" if page.get("fetched") else "unavailable",
    }


def _external_signals_placeholder() -> dict:
    return {
        "available": False,
        "mode": "none",
        "note": "External APIs are not used; analysis is limited to the target URL and on-page text.",
    }


def _compute_virality_from_page(page_signals: dict, page: dict) -> dict:
    chars = float(page_signals.get("text_chars", 0))
    hype = float(page_signals.get("hype_lexicon_hits", 0))
    cta = float(page_signals.get("social_cta_hits", 0))
    title_len = float(page_signals.get("title_len", 0))

    richness = _cap(math.log10(chars + 20.0) * 18.0, 40.0)
    headline = _cap(min(title_len, 120.0) * 0.22, 18.0)
    buzz = _cap(hype * 9.0 + cta * 4.0, 28.0)

    score = round(min(100.0, richness + headline + buzz), 1)
    if not page.get("fetched"):
        score = min(score, 35.0)

    if score >= 70:
        label = "viral"
    elif score >= 45:
        label = "trending"
    else:
        label = "normal"

    confidence = "high" if page.get("fetched") and chars > 800 else "medium" if page.get("fetched") else "low"

    return {
        "score": score,
        "label": label,
        "confidence": confidence,
        "breakdown": {
            "content_richness": round(richness, 1),
            "headline_signal": round(headline, 1),
            "language_buzz": round(buzz, 1),
        },
    }


def _cap(value: float, maximum: float) -> float:
    return min(maximum, max(0.0, value))


def _build_heuristic_assessment_page(virality: dict, page_signals: dict, page: dict) -> dict:
    label = virality["label"]
    reasons = []
    key_topics = []
    risk_signals = []

    if not page.get("fetched"):
        reasons.append("The page could not be fetched; assessment uses URL and platform heuristics only.")
        risk_signals.append("Page fetch failed - limited analysis available")
    else:
        if page.get("title"):
            reasons.append("Page title and meta description were parsed from the response.")
        if page_signals.get("text_chars", 0) > 1500:
            reasons.append("Substantial visible text suggests a content-heavy page.")
        if page_signals.get("hype_lexicon_hits", 0) > 0:
            reasons.append("Language patterns suggest promotional or urgency framing.")

    # Extract basic topics from title and description
    title = (page.get("title") or "").lower()
    description = (page.get("description") or "").lower()
    combined_text = f"{title} {description}"
    
    # Simple topic extraction based on common social media themes
    topic_keywords = {
        "ai": ["ai", "artificial intelligence", "machine learning", "gpt", "chatbot"],
        "tech": ["technology", "software", "app", "startup", "innovation"],
        "business": ["business", "finance", "economy", "market", "investment"],
        "social": ["social media", "viral", "trending", "influencer", "content"],
        "news": ["news", "breaking", "update", "report", "announcement"],
        "health": ["health", "medical", "wellness", "fitness", "covid"],
        "entertainment": ["entertainment", "movie", "music", "game", "celebrity"]
    }
    
    for topic, keywords in topic_keywords.items():
        if any(keyword in combined_text for keyword in keywords):
            key_topics.append(topic)
    
    # Basic risk signal detection
    if page_signals.get("hype_lexicon_hits", 0) > 3:
        risk_signals.append("High promotional language density")
    if page_signals.get("text_chars", 0) < 100:
        risk_signals.append("Very limited content - potential low-quality source")
    if not page.get("fetched"):
        risk_signals.append("Unable to verify content authenticity")
    
    # Platform-specific risk signals
    platform = page_signals.get("platform", "")
    if platform in ["x", "twitter"]:
        risk_signals.append("Social media platform - verify source credibility")
    elif platform == "web":
        if "bit.ly" in str(page.get("url", "")) or "t.co" in str(page.get("url", "")):
            risk_signals.append("URL shortener detected - original source unclear")

    if not reasons:
        reasons.append("Limited on-page signals; treat this as a weak prior.")

    if label == "viral":
        summary = "Heuristic read: strong on-page signals for attention-grabbing or promotional content."
        actions = [
            "Corroborate with independent sources outside this page.",
            "Capture a snapshot of the page for audit trail.",
            "Monitor for rapid engagement changes in first 24 hours.",
        ]
    elif label == "trending":
        summary = "Heuristic read: moderate engagement cues from page copy and structure."
        actions = [
            "Re-fetch later to detect content or metadata changes.",
            "Compare with sibling URLs from the same author or domain.",
            "Track cross-platform mentions and shares.",
        ]
    else:
        summary = "Heuristic read: typical content patterns with moderate engagement potential."
        actions = [
            "Monitor page for changes in engagement metrics over time.",
            "Analyze content structure and keywords for optimization opportunities.",
            "Consider A/B testing different headlines or calls-to-action.",
        ]

    # Add LLM synthesis status
    if not is_gemini_ready():
        risk_signals.append("LLM synthesis disabled - set GEMINI_API_KEY environment variable")

    return {
        "verdict": label,
        "confidence": virality.get("confidence", "low"),
        "summary": summary,
        "reasons": reasons[:6],
        "recommended_actions": actions,
        "score": virality["score"],
        "key_topics": key_topics[:8],
        "risk_signals": risk_signals[:8],
        "causal_hypothesis": "Content-driven engagement spike based on heuristic patterns.",
        "deep_dive": f"Analysis based on {page_signals.get('text_chars', 0)} characters of content with {page_signals.get('hype_lexicon_hits', 0)} promotional indicators.",
    }


def _llm_deep_research(
    url: str,
    platform: str,
    page_signals: dict,
    page: dict,
    virality: dict,
    anomaly_context: dict | None = None,
) -> dict | None:
    if not is_gemini_ready():
        return None

    excerpt = (page.get("body_text") or "")[:9000]
    ctx = _extract_url_context(url)
    
    evidence = {
        "url": url,
        "platform": platform,
        "url_context": ctx,
        "anomaly_context": anomaly_context,
        "title": page.get("title", ""),
        "description": page.get("description", ""),
        "page_signals": page_signals,
        "heuristic_virality": virality,
        "body_text_excerpt": excerpt,
        "is_crawl_blocked": not page.get("fetched", False)
    }

    prompt = (
        "You are a research analyst. The ONLY evidence is the JSON below: a single URL we fetched, "
        "its metadata, and a plain-text excerpt of the page. No live social metrics or news APIs were used.\n"
        "Produce a rigorous deep-research style assessment. If data is missing, say so explicitly.\n"
        "Return STRICT JSON with keys:\n"
        "- verdict: one of viral, trending, normal (relative to typical social posts/pages, your best estimate)\n"
        "- confidence: low, medium, or high\n"
        "- virality_score: number 0-100 (float allowed)\n"
        "- summary: one tight paragraph\n"
        "- reasons: array of short strings (evidence-backed)\n"
        "- recommended_actions: array of practical next steps\n"
        "- key_topics: array of 3-8 topical tags\n"
        "- risk_signals: array of strings (misinformation, bot-like patterns, missing context, etc. — empty if none)\n"
        "- deep_dive: 2-4 sentences expanding implications and what is still unknown\n"
        "- suggested_followups: array of concrete research tasks (e.g. verify claim X)\n"
        "- causal_category: one of [milestone, product_launch, breaking_news, controversy, seasonal_events, other]\n"
        "- causal_hypothesis: one-sentence punchy explanation of WHY this is viral/trending (e.g. 'Highly emotional athlete milestone' or 'Breaking tech controversy')\n\n"
        "ANALYSIS_MODE: " + ("SYNTHESIS" if not page.get("fetched") else "DIRECT_CRAWL") + "\n"
        "IF IN SYNTHESIS MODE: Platform policy blocked direct extraction. This is a HIGH PRIORITY SYNTHESIS task. "
        "The identified entity is: '" + str(ctx.get('handle') or 'this link') + "'. "
        "Based on your internal world knowledge about this specific account and current global events, provide a BOLD and SPECIFIC hypothesis about the likely cause of this engagement spike. "
        "Do NOT hedge with 'information is limited' if you recognize the handle; instead, identify the most plausible recent driver (e.g. a legendary milestone for @Cristiano, or a product launch for a tech handle).\n\n"
        "ANOMALY_CONTEXT: " + (json.dumps(anomaly_context) if anomaly_context else "None provided.") + "\n\n"
        f"Evidence JSON:\n{json.dumps(evidence, ensure_ascii=True)}"
    )

    try:
        system_instr = (
            "You are a senior propaganda and virality research analyst. "
            "You output JSON only. Never invent off-page facts; "
            "ground claims in the provided excerpt or metadata. "
            "Be decisive: if signals point to bot activity or coordinated behavior, say so clearly."
        )

        raw_response = call_gemini(
            prompt=prompt,
            system_instruction=system_instr,
            temperature=0.15,
            max_tokens=800
        )

        raw = extract_json_payload(raw_response) or "{}"
        data = json.loads(raw)

        verdict = _safe_enum(data.get("verdict"), ["viral", "trending", "normal"], virality["label"])
        confidence = _safe_enum(data.get("confidence"), ["low", "medium", "high"], virality["confidence"])

        try:
            llm_score = float(data.get("virality_score", virality["score"]))
        except (TypeError, ValueError):
            llm_score = virality["score"]
        llm_score = max(0.0, min(100.0, llm_score))

        reasons = data.get("reasons") if isinstance(data.get("reasons"), list) else []
        reasons = [str(x)[:200] for x in reasons][:8]

        actions = (
            data.get("recommended_actions")
            if isinstance(data.get("recommended_actions"), list)
            else []
        )
        actions = [str(x)[:200] for x in actions][:6]

        followups = (
            data.get("suggested_followups")
            if isinstance(data.get("suggested_followups"), list)
            else []
        )
        followups = [str(x)[:200] for x in followups][:6]

        key_topics = data.get("key_topics") if isinstance(data.get("key_topics"), list) else []
        key_topics = [str(x)[:80] for x in key_topics][:10]

        risk_signals = data.get("risk_signals") if isinstance(data.get("risk_signals"), list) else []
        risk_signals = [str(x)[:160] for x in risk_signals][:8]

        summary = str(data.get("summary", "")).strip()[:600]
        if not summary:
            summary = "LLM reviewed the on-page excerpt and metadata."

        deep_dive = str(data.get("deep_dive", "")).strip()[:1200]

        assessment = {
            "verdict": verdict,
            "confidence": confidence,
            "summary": summary,
            "reasons": reasons,
            "recommended_actions": actions + followups,
            "score": round(llm_score, 1),
            "key_topics": key_topics,
            "risk_signals": risk_signals,
            "deep_dive": deep_dive,
            "causal_category": str(data.get("causal_category", "other")).lower(),
            "causal_hypothesis": str(data.get("causal_hypothesis") or data.get("cause") or "Synthesized causal driver based on platform heuristics.")[:200],
        }

        new_virality = {
            **virality,
            "score": round(llm_score, 1),
            "label": verdict,
            "confidence": confidence,
            "breakdown": {
                **virality.get("breakdown", {}),
                "llm_adjusted": True,
            },
        }

        return {"assessment": assessment, "virality": new_virality}
    except Exception as exc:
        logger.warning("Gemini deep research failed: %s", exc)
        return None


def _safe_enum(value, allowed: list, default: str) -> str:
    if isinstance(value, str) and value.lower() in allowed:
        return value.lower()
    return default


def fetch_page_for_pipeline(url: str) -> dict:
    """
    Fetch public HTML for a URL to give Gemini local context when synthesising
    engagement time series. Does not call Twitter/X or other social APIs.
    """
    try:
        normalized = _normalise_url(url)
    except ValueError:
        return {
            "url": url,
            "title": "",
            "description": "",
            "body_text": "",
            "fetched": False,
            "reason": "Invalid URL.",
        }
    return _fetch_page_content(normalized)


def _build_sources(url: str, page: dict, _assessment: dict) -> list:
    primary = page.get("canonical_url") or url
    title = page.get("title") or "Source page"
    return [{"type": "page", "title": title, "url": primary}]


def _extract_json_payload(text: str) -> str:
    raw = (text or "").strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    if raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()

    match = re.search(r"\{.*\}", raw, re.DOTALL)
    return match.group(0) if match else raw

