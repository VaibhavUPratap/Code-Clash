from flask import Blueprint, jsonify, current_app, request
import os
from services.data_loader import load_data
from services.preprocessing import preprocess_data
from services.anomaly_detection import detect_anomalies

analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/analyze', methods=['GET'])
def analyze():
    try:
        # Get dynamic metric from query parameter, default to 'likes'
        metric = request.args.get('metric', 'likes')
        
        # Define the path to the dataset
        file_path = os.path.join(current_app.root_path, 'data', 'sample_data.csv')
        
        # 1. Load data
        df = load_data(file_path)
        
        # 2. Preprocess data
        df_clean = preprocess_data(df)
        
        # 3. Detect anomalies on chosen metric
        anomalies = detect_anomalies(df_clean, metric=metric)
        
        # 4. Generate continuous data points for plotting
        df_resp = df_clean.reset_index()
        df_resp['date'] = df_resp['date'].dt.strftime('%Y-%m-%d')
        data_points = df_resp.to_dict(orient='records')
        
        # 5. Return JSON payload
        return jsonify({
            "metric": metric,
            "data_points": data_points, 
            "anomalies": anomalies
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
