from flask import Blueprint, jsonify, current_app
import os
from services.data_loader import load_data
from services.preprocessing import preprocess_data
from services.anomaly_detection import detect_anomalies

analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/analyze', methods=['GET'])
def analyze():
    try:
        # Define the path to the dataset
        file_path = os.path.join(current_app.root_path, 'data', 'sample_data.csv')
        
        # 1. Load data
        df = load_data(file_path)
        
        # 2. Preprocess data
        df_clean = preprocess_data(df)
        
        # 3. Detect anomalies (focusing on 'likes' as requested)
        anomalies = detect_anomalies(df_clean, metric='likes')
        
        # 4. Return results
        return jsonify({"anomalies": anomalies}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
