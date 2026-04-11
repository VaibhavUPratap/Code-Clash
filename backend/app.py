from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Import custom modules
from generate_data import generate_synthetic_data
from data_processing import preprocess_data
from anomaly_detection import run_detection_pipeline
from ai_agent import analyze_anomaly

# Load environment variables (.env file)
load_dotenv()

app = Flask(__name__)
CORS(app) 

results_db = []

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running"})

@app.route('/analyze', methods=['POST'])
def analyze_data():
    """
    Receives a username, mocks realistic data, runs anomaly detection, and attaches AI reasoning.
    """
    data = request.get_json()
    if not data or 'username' not in data:
        return jsonify({"error": "Username not provided"}), 400
        
    username = data['username']
         
    try:
        # 1. Fetch/Mock Data based on username
        # This will simulate an API network call. 
        df = generate_synthetic_data(username=username, days=90)
        
        # 2. Data Preprocessing
        df_clean = preprocess_data(df)
        
        # 3. Anomaly Detection
        anomalies = run_detection_pipeline(df_clean)
        
        # 4. AI Reasoning
        # For a fast 48hr hackathon MVP, limit to top 3 most extreme anomalies to save API time
        anomalies = sorted(anomalies, key=lambda x: abs(x.get('z_score', 0)), reverse=True)[:3]
        
        processed_anomalies = []
        for anomaly in anomalies:
            ai_insight = analyze_anomaly(anomaly)
            anomaly.update({"insight": ai_insight})
            processed_anomalies.append(anomaly)
            
        # Re-sort chronologically for UI plotting
        processed_anomalies = sorted(processed_anomalies, key=lambda x: x['timestamp'])
            
        analysis_result = {
            "username": username,
            "total_rows": len(df),
            "anomalies": processed_anomalies
        }
        results_db.append(analysis_result)
        
        return jsonify({
            "status": "success",
            "data": analysis_result
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get-results', methods=['GET'])
def get_results():
    return jsonify({
        "status": "success", 
        "data": results_db[-1] if results_db else None
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
