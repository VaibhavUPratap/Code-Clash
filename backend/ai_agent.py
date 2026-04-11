import os
import json
from openai import OpenAI

def analyze_anomaly(anomaly_data):
    """
    Uses an LLM to reason about why an anomaly occurred.
    Expects anomaly_data as a dictionary containing timestamp, metric, value, z_score, type.
    """
    try:
        # Require OPENAI_API_KEY to be set
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            return {
                "type": "unknown",
                "cause": "OpenAI API key missing in environment.",
                "confidence": "low",
                "recommendation": "Configure OPENAI_API_KEY in your .env file."
            }
            
        client = OpenAI(api_key=api_key)
        
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
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a crisis and bot intelligence system. Output only raw JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=150
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Cleanup markdown formatting if LLM includes it
        if result_text.startswith("```json"):
            result_text = result_text[7:-3]
        elif result_text.startswith("```"):
            result_text = result_text[3:-3]
            
        return json.loads(result_text)
        
    except Exception as e:
        return {
             "type": "error",
             "cause": f"AI reasoning failed: {str(e)}",
             "confidence": "low",
             "recommendation": "Check API connection or logs."
        }
