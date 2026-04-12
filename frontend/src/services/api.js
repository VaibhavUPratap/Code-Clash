/**
 * Centralized API Service
 * All backend calls go through here — base URL is always http://localhost:5000
 */

const BASE_URL = "http://localhost:5000";

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error || "Server error");
  }
  return json;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function checkHealth() {
  return apiFetch("/api/health");
}

// ─── Analyze  ─────────────────────────────────────────────────────────────────

/**
 * Run the full analysis pipeline.
 *
 * Modes:
 *   { source: "sample" }                          → bundled sample CSV
 *   { source: "twitter", handle: "@elonmusk" }    → Twitter handle
 *   { source: "url",     handle: "https://..." }  → Tweet URL / link
 *   file (File object)                            → uploaded CSV
 */
export async function analyzeData({ source = "sample", handle = "", file = null } = {}) {
  if (file) {
    // multipart/form-data – cannot mix with JSON body
    const form = new FormData();
    form.append("file", file);
    return apiFetch("/api/analyze", { method: "POST", body: form });
  }

  // JSON body for username / URL / sample
  return apiFetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, handle }),
  });
}

// ─── Get cached results ───────────────────────────────────────────────────────

export async function getResults() {
  return apiFetch("/api/get-results");
}

// ─── Deep research ────────────────────────────────────────────────────────────

export async function researchLink(url) {
  return apiFetch("/api/research-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

// ─── Fetch data (preview only) ────────────────────────────────────────────────

export async function fetchData({ source = "sample", handle = "" } = {}) {
  const params = new URLSearchParams({ source, handle });
  return apiFetch(`/api/fetch-data?${params}`);
}
