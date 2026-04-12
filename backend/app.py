import os

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

        cors_origins = os.getenv("CORS_ORIGINS", "*").strip()
        origins = [o.strip() for o in cors_origins.split(",") if o.strip()]
        CORS(
            app,
            supports_credentials=True,
            origins=origins if origins else "*",
        )
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
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "0").lower() in {"1", "true", "yes"}
    app.run(host=host, port=port, debug=debug)
