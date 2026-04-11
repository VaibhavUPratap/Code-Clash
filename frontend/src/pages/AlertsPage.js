import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AnomalyCard from "../components/AnomalyCard";
import "../components/AnomalyCard.css";
import "./AlertsPage.css";

export default function AlertsPage() {
  const [result, setResult]     = useState(null);
  const [severity, setSeverity] = useState("all");
  const [type, setType]         = useState("all");
  const [search, setSearch]     = useState("");
  const navigate                = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    if (!stored) { navigate("/"); return; }
    setResult(JSON.parse(stored));
  }, [navigate]);

  const filtered = useMemo(() => {
    if (!result) return [];
    return (result.anomalies || []).filter((a) => {
      if (severity !== "all" && a.severity !== severity) return false;
      if (type !== "all" && a.type !== type) return false;
      if (search && !a.date.includes(search) && !a.metric.includes(search.toLowerCase())) return false;
      return true;
    });
  }, [result, severity, type, search]);

  if (!result) return null;

  const total = result.anomalies?.length ?? 0;

  return (
    <div className="page">
      <h1 className="page-title">
        🚨 Anomaly Alerts
        <span className="page-sub"> · {filtered.length} / {total} shown</span>
      </h1>

      {/* Filters */}
      <div className="card filters-bar">
        <div className="filter-group">
          <label className="filter-label">Severity</label>
          <FilterTabs
            options={["all", "critical", "medium", "low"]}
            selected={severity}
            onChange={setSeverity}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Type</label>
          <FilterTabs
            options={["all", "spike", "drop"]}
            selected={type}
            onChange={setType}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Search</label>
          <input
            className="filter-search"
            type="text"
            placeholder="date or metric…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Anomaly list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <span>🔍</span>
          <p>No anomalies match the current filters.</p>
        </div>
      ) : (
        <div className="alerts-grid">
          {filtered.map((a, i) => (
            <AnomalyCard key={`${a.date}-${a.metric}-${i}`} anomaly={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTabs({ options, selected, onChange }) {
  return (
    <div className="filter-tabs">
      {options.map((o) => (
        <button
          key={o}
          className={`ftab ${selected === o ? "active" : ""}`}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
