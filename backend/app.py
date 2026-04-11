from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd
from dotenv import load_dotenv

# Import custom detection modules
from data_processing import preprocess_data
from anomaly_detection import run_detection_pipeline
from ai_agent import analyze_anomaly

# Load environment variables (.env file)
load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for frontend requests

# Simple in-memory storage for Hackathon MVP
results_db = []

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running"})

@app.route('/analyze', methods=['POST'])
def analyze_data():
    """
    Receives CSV, processes it, runs anomaly detection, and attaches AI reasoning.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files['file']
    if not file.filename.endswith('.csv'):
         return jsonify({"error": "File must be a CSV"}), 400
         
    try:
        # 1. Read CSV
        df = pd.read_csv(file)
        
        # 2. Data Preprocessing
        df_clean = preprocess_data(df)
        
        # 3. Anomaly Detection
        anomalies = run_detection_pipeline(df_clean)
        
        # 4. AI Reasoning
        processed_anomalies = []
        for anomaly in anomalies:
            # Note: For production with many anomalies, consider async/batching here
            ai_insight = analyze_anomaly(anomaly)
            anomaly.update({"insight": ai_insight})
            processed_anomalies.append(anomaly)
            
        # Store result in local DB
        analysis_result = {
            "filename": file.filename,
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
    """
    Returns the most recent analysis run.
    """
    return jsonify({
        "status": "success", 
        "data": results_db[-1] if results_db else None
    })

if __name__ == '__main__':
    from generate_data import generate_synthetic_data
    if not os.path.exists("social_media_data.csv"):
        print("Generating synthetic dataset...")
        generate_synthetic_data()
    app.run(debug=True, port=5000)
