"""Authentication: register, login, session check."""

from __future__ import annotations

import datetime
import os
import sqlite3
from functools import wraps

import jwt
from flask import Blueprint, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash
from google.oauth2 import id_token
from google.auth.transport import requests

from config import Config
from db import get_db

auth_bp = Blueprint("auth", __name__)


def create_token(user_id: int, email: str) -> str:
    now_ts = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": now_ts,
        "exp": now_ts + 7 * 24 * 3600,
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def require_auth(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"status": "error", "message": "Authentication required."}), 401
        data = decode_token(auth[7:].strip())
        if not data or "sub" not in data:
            return jsonify({"status": "error", "message": "Invalid or expired session."}), 401
        try:
            g.current_user_id = int(data["sub"])
        except (TypeError, ValueError):
            return jsonify({"status": "error", "message": "Invalid session."}), 401
        g.current_user_email = str(data.get("email", ""))
        return view(*args, **kwargs)

    return wrapped


# Legacy register route disabled. Use Google Auth.
@auth_bp.route("/register", methods=["POST"])
def register():
    return jsonify({"status": "error", "message": "Email registration is disabled."}), 403


# Legacy login route disabled. Use Google Auth.
@auth_bp.route("/login", methods=["POST"])
def login():
    return jsonify({"status": "error", "message": "Standard login is disabled."}), 403


@auth_bp.route("/me", methods=["GET"])
@require_auth
def me():
    return jsonify(
        {
            "status": "ok",
            "user": {"id": g.current_user_id, "email": g.current_user_email},
        }
    )


@auth_bp.route("/google-login", methods=["POST"])
def google_login():
    body = request.get_json(silent=True) or {}
    id_token_str = body.get("idToken")

    if not id_token_str:
        return jsonify({"status": "error", "message": "ID Token required."}), 400

    try:
        # Verify the ID token
        # Note: Specifying CLIENT_ID is highly recommended for security.
        # Since we're using Firebase, we can also use their certs.
        id_info = id_token.verify_firebase_token(
            id_token_str, requests.Request(), audience=os.getenv("FIREBASE_PROJECT_ID")
        )
        
        email = id_info.get("email")
        if not email:
            return jsonify({"status": "error", "message": "Invalid token: email missing."}), 400
            
    except Exception as e:
        return jsonify({"status": "error", "message": f"Token verification failed: {str(e)}"}), 401

    db = get_db()
    # Check if user exists
    row = db.execute("SELECT id, email FROM users WHERE email = ?", (email,)).fetchone()
    
    if not row:
        # Create new user for Google login
        created = datetime.datetime.now(datetime.timezone.utc).isoformat()
        # Use a placeholder for password_hash to satisfy NOT NULL constraint
        placeholder_hash = "GOOGLE_AUTH_PLACEHOLDER"
        db.execute(
            "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
            (email, placeholder_hash, created),
        )
        db.commit()
        row = db.execute("SELECT id, email FROM users WHERE email = ?", (email,)).fetchone()

    token = create_token(row["id"], row["email"])
    return jsonify(
        {
            "status": "ok",
            "token": token,
            "user": {"id": row["id"], "email": row["email"]},
        }
    )
