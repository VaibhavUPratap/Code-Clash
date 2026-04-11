from flask import Flask, jsonify
from routes.analyze import analyze_bp

def create_app():
    app = Flask(__name__)
    
    # Try importing and initializing CORS if available in the environment
    try:
        from flask_cors import CORS
        CORS(app)
    except ImportError:
        pass
        
    # Register the analyze blueprint
    app.register_blueprint(analyze_bp)
    
    @app.route('/')
    def index():
        return jsonify({"status": "Social Media Trend Anomaly Finder API is running."})
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
