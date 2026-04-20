/**
 * Centralized API Service — base URL from env or localhost:5000
 */

function normalizeBaseUrl(url) {
  return String(url || "")
    .trim()
    .replace(/\/$/, "")
    .replace(/\/api$/, "");
}

const DEFAULT_PROD_API_URL = "https://code-clash-zoaj.onrender.com";

function resolveBaseUrl() {
  const envUrl = normalizeBaseUrl(process.env.REACT_APP_API_URL);
  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    if (isLocalHost) {
      return "http://localhost:5000";
    }

    // In production without env config, use known deployed backend.
    return normalizeBaseUrl(DEFAULT_PROD_API_URL || window.location.origin);
  }

  return "";
}

const BASE_URL = resolveBaseUrl();

function authHeaders() {
  const token = sessionStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
    ...authHeaders(),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const text = await res.text();
  let json = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(text.slice(0, 200) || "Server error");
    }
  }
  if (!res.ok) {
    const base = json.message || json.error || "Server error";
    const detail = json.detail;
    const err = new Error(detail ? `${base} — ${detail}` : base);
    err.status = res.status;
    throw err;
  }
  return json;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email, password) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function googleLogin(idToken) {
  return apiFetch("/api/auth/google-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

export async function fetchMe() {
  return apiFetch("/api/auth/me");
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function checkHealth() {
  return apiFetch("/api/health");
}

// ─── Analyze  ─────────────────────────────────────────────────────────────────

export async function analyzeData({
  source = "sample",
  handle = "",
  file = null,
  researchUrl = "",
} = {}) {
  if (file) {
    const form = new FormData();
    form.append("file", file);
    if (researchUrl && String(researchUrl).trim()) {
      form.append("research_url", String(researchUrl).trim());
    }
    return apiFetch("/api/analyze", { method: "POST", body: form });
  }

  const body = { source, handle };
  if (researchUrl && String(researchUrl).trim()) {
    body.research_url = String(researchUrl).trim();
  }
  return apiFetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function getResults() {
  return apiFetch("/api/get-results");
}

export async function researchLink(url, context = null) {
  return apiFetch("/api/research-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, context }),
  });
}

export async function fetchData({ source = "sample", handle = "" } = {}) {
  const params = new URLSearchParams({ source, handle });
  return apiFetch(`/api/fetch-data?${params}`);
}
