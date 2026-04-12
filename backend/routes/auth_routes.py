"""Authentication: register, login, session check."""

from __future__ import annotations

import datetime
import sqlite3
from functools import wraps

import jwt
from flask import Blueprint, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

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


@auth_bp.route("/register", methods=["POST"])
def register():
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password required."}), 400
    if len(password) < 6:
        return jsonify({"status": "error", "message": "Password must be at least 6 characters."}), 400
    if "@" not in email or "." not in email.split("@")[-1]:
        return jsonify({"status": "error", "message": "Invalid email address."}), 400

    db = get_db()
    created = datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        db.execute(
            "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
            (email, generate_password_hash(password), created),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"status": "error", "message": "Email already registered."}), 409

    row = db.execute("SELECT id, email FROM users WHERE email = ?", (email,)).fetchone()
    token = create_token(row["id"], row["email"])
    return jsonify(
        {
            "status": "ok",
            "token": token,
            "user": {"id": row["id"], "email": row["email"]},
        }
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password required."}), 400

    db = get_db()
    row = db.execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?",
        (email,),
    ).fetchone()

    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"status": "error", "message": "Invalid email or password."}), 401

    token = create_token(row["id"], row["email"])
    return jsonify(
        {
            "status": "ok",
            "token": token,
            "user": {"id": row["id"], "email": row["email"]},
        }
    )


@auth_bp.route("/me", methods=["GET"])
@require_auth
def me():
    return jsonify(
        {
            "status": "ok",
            "user": {"id": g.current_user_id, "email": g.current_user_email},
        }
    )
