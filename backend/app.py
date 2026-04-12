from flask import Flask, jsonify
from config import Config
from db import close_db, init_db
from routes.analyze import analyze_bp
from routes.api_routes import api_bp
from routes.auth_routes import auth_bp


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = Config.SECRET_KEY

    init_db()
    app.teardown_appcontext(close_db)

    # Try importing and initializing CORS if available in the environment
    try:
        from flask_cors import CORS

        CORS(app, supports_credentials=True)
    except ImportError:
        pass

    # Register the analyze blueprints
    app.register_blueprint(analyze_bp)
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    
    @app.route('/')
    def index():
        return jsonify({"status": "Social Media Trend Anomaly Finder API is running."})
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
