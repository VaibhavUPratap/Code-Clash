import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./HomePage.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function HomePage() {
  const [source, setSource]       = useState("sample");
  const [file, setFile]           = useState(null);
  const [subreddit, setSubreddit] = useState("worldnews");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const navigate                  = useNavigate();

  async function handleAnalyze(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("source", source);

      if (source === "upload" && file) {
        formData.append("file", file);
      } else if (source === "reddit") {
        formData.append("sub", subreddit);
      }

      const { data } = await axios.post(`${API}/analyze`, formData);
      if (data.status !== "ok") throw new Error(data.message || "Analysis failed");

      // Store result in sessionStorage for other pages
      sessionStorage.setItem("analysisResult", JSON.stringify(data));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page home-page">
      {/* Hero */}
      <div className="hero">
        <div className="hero-icon">📡</div>
        <h1 className="hero-title">Social Media Trend Anomaly Finder</h1>
        <p className="hero-sub">
          Detect spikes, drops and anomalies in engagement data — then let
          AI explain the cause: <em>viral event, bot activity, or crisis</em>.
        </p>
      </div>

      {/* Analysis form */}
      <div className="card analysis-form">
        <h2 className="section-title">🔍 Start Analysis</h2>

        <form onSubmit={handleAnalyze}>
          {/* Source selector */}
          <div className="source-tabs">
            {["sample", "upload", "reddit"].map((s) => (
              <button
                key={s}
                type="button"
                className={`tab-btn ${source === s ? "active" : ""}`}
                onClick={() => setSource(s)}
              >
                {s === "sample" && "📄 Sample Data"}
                {s === "upload" && "📁 Upload CSV"}
                {s === "reddit" && "🔴 Reddit API"}
              </button>
            ))}
          </div>

          {/* Conditional inputs */}
          {source === "sample" && (
            <div className="source-info">
              Uses 180 days of synthetic engagement data with injected viral
              events, crisis drops and bot activity patterns.
            </div>
          )}

          {source === "upload" && (
            <div className="field">
              <label className="field-label">CSV File</label>
              <p className="field-hint">
                Required columns: <code>date, likes, comments, shares, posts</code>
              </p>
              <input
                type="file"
                accept=".csv"
                className="file-input"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
            </div>
          )}

          {source === "reddit" && (
            <div className="field">
              <label className="field-label">Subreddit</label>
              <input
                type="text"
                className="text-input"
                value={subreddit}
                onChange={(e) => setSubreddit(e.target.value)}
                placeholder="e.g. worldnews"
              />
              <p className="field-hint">
                Requires <code>REDDIT_CLIENT_ID</code> &amp;{" "}
                <code>REDDIT_CLIENT_SECRET</code> in backend <code>.env</code>.
              </p>
            </div>
          )}

          {error && <div className="error-box">⚠️ {error}</div>}

          <button
            type="submit"
            className="btn btn-primary submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner" /> Analyzing…
              </>
            ) : (
              "🚀 Run Analysis"
            )}
          </button>
        </form>
      </div>

      {/* Feature cards */}
      <div className="features grid-2">
        {FEATURES.map(({ icon, title, desc }) => (
          <div key={title} className="card feature-card">
            <div className="feature-icon">{icon}</div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-desc">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: "📈",
    title: "Statistical Detection",
    desc: "Rolling Z-score and IQR methods identify anomalies across all engagement metrics.",
  },
  {
    icon: "🤖",
    title: "AI Cause Analysis",
    desc: "An LLM agent classifies every anomaly as viral, bot, or crisis with confidence score.",
  },
  {
    icon: "🎯",
    title: "Severity Scoring",
    desc: "Each anomaly is rated low / medium / critical based on statistical magnitude.",
  },
  {
    icon: "💡",
    title: "Actionable Insights",
    desc: "Receive concrete recommendations for each detected event.",
  },
];
