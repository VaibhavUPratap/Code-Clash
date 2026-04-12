from flask import Blueprint, jsonify, current_app, request
import os
from services.data_loader import load_data
from services.preprocessing import preprocess_data
from services.anomaly_detection import detect_anomalies
from services.link_research_service import research_post_url
from services.ai_agent_service import explain_batch
from services.prediction_service import compute_prediction

analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/analyze', methods=['GET'])
def analyze():
    try:
        # Get parameters
        metric = request.args.get('metric', 'likes')
        source_type = request.args.get('source_type', 'file')
        url = request.args.get('url', '')
        
        # 1. Load data
        file_path = os.path.join(current_app.root_path, 'data', 'sample_data.csv')
        df = load_data(file_path)
        
        # 2. Preprocess data
        df_clean = preprocess_data(df)
        
        # 3. Detect anomalies
        anomalies = detect_anomalies(df_clean, metric=metric)
        
        # 4. Deep research if URL provided
        research_result = None
        if source_type == "url" and url:
            try:
                research_result = research_post_url(url)
            except Exception as e:
                current_app.logger.warning(f"Deep research failed for {url}: {e}")
        
        # 5. AI explanation with research context
        df_records = df_clean.reset_index().to_dict(orient='records')
        anomalies_with_ai = explain_batch(anomalies, df_records, research_result)
        
        # 6. Prediction with research signals
        prediction = compute_prediction(df_records, research_result, anomalies)
        
        # 7. Generate continuous data points for plotting
        df_resp = df_clean.reset_index()
        df_resp['date'] = df_resp['date'].dt.strftime('%Y-%m-%d')
        data_points = df_resp.to_dict(orient='records')
        
        # 8. Return unified response
        return jsonify({
            "metric": metric,
            "data_points": data_points,
            "anomalies": anomalies_with_ai,
            "research": research_result,
            "prediction": prediction
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
