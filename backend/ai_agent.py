import os
import json
import re

from google import genai


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

def analyze_anomaly(anomaly_data):
    """
    Uses an LLM to reason about why an anomaly occurred.
    Expects anomaly_data as a dictionary containing timestamp, metric, value, z_score, type.
    """
    try:
        # Require GEMINI_API_KEY to be set
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return {
                "type": "unknown",
                "cause": "Gemini API key missing in environment.",
                "confidence": "low",
                "recommendation": "Configure GEMINI_API_KEY in your .env file."
            }

        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        You are a social media analyst AI.
        An anomaly was detected in our time-series data:
        - Date: {anomaly_data.get('timestamp')}
        - Metric: {anomaly_data.get('metric')}
        - Observed Value: {anomaly_data.get('value')}
        - Type of Anomaly: {anomaly_data.get('type')} (spike or drop)
        - Detection Method: {anomaly_data.get('method')}
        
        Given typical social media patterns, provide a logical possible explanation.
        You MUST respond in strict JSON format with exactly these 4 keys, and NO markdown wrapping or other text:
        "type": string (must be exactly 'viral', 'bot', or 'crisis')
        "cause": string (short string explaining why it happened)
        "confidence": string ('low', 'medium', or 'high')
        "recommendation": string (actionable advice for the user)
        """
        
        response = client.models.generate_content(
            model=os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"),
            contents=prompt,
            config={
                "system_instruction": "You are a crisis and bot intelligence system. Output only raw JSON.",
                "temperature": 0.3,
                "max_output_tokens": 180,
                "response_mime_type": "application/json",
            },
        )
        result_text = _extract_json_payload(getattr(response, "text", ""))
        return json.loads(result_text)
        
    except Exception as e:
        return {
             "type": "error",
             "cause": f"AI reasoning failed: {str(e)}",
             "confidence": "low",
             "recommendation": "Check API connection or logs."
        }
