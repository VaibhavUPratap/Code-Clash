import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Plot from "react-plotly.js";
import "./InsightsPage.css";

const TYPE_ICON = { viral: "🚀", bot: "🤖", crisis: "⚠️" };
const TYPE_COLOR = { viral: "#6366f1", bot: "#ef4444", crisis: "#f59e0b" };

export default function InsightsPage() {
  const [result, setResult] = useState(null);
  const navigate            = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    if (!stored) { navigate("/"); return; }
    setResult(JSON.parse(stored));
  }, [navigate]);

  const { typeCounts, confidenceCounts } = useMemo(() => {
    if (!result) return { typeCounts: {}, confidenceCounts: {} };
    const anomalies = result.anomalies || [];
    const tc = { viral: 0, bot: 0, crisis: 0 };
    const cc = { low: 0, medium: 0, high: 0 };
    anomalies.forEach((a) => {
      const t = a.ai_insight?.type;
      const c = a.ai_insight?.confidence;
      if (t && tc[t] !== undefined) tc[t]++;
      if (c && cc[c] !== undefined) cc[c]++;
    });
    return { typeCounts: tc, confidenceCounts: cc };
  }, [result]);

  if (!result) return null;

  const anomalies = result.anomalies || [];
  const criticals = anomalies.filter((a) => a.severity === "critical");

  const pieData = [
    {
      type: "pie",
      labels: Object.keys(typeCounts).map(
        (k) => `${TYPE_ICON[k] || ""} ${k}`
      ),
      values: Object.values(typeCounts),
      marker: { colors: ["#6366f1", "#ef4444", "#f59e0b"] },
      hole: 0.5,
      textinfo: "label+percent",
      textposition: "outside",
    },
  ];

  const pieLayout = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#e2e8f0", family: "Inter, sans-serif", size: 12 },
    showlegend: false,
    margin: { t: 10, b: 10, l: 10, r: 10 },
    height: 260,
  };

  const barData = [
    {
      type: "bar",
      x: ["Low", "Medium", "High"],
      y: [confidenceCounts.low, confidenceCounts.medium, confidenceCounts.high],
      marker: { color: ["#22c55e", "#f59e0b", "#ef4444"] },
    },
  ];

  const barLayout = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#e2e8f0", family: "Inter, sans-serif", size: 12 },
    xaxis: { gridcolor: "#2a2d3a" },
    yaxis: { gridcolor: "#2a2d3a", dtick: 1 },
    margin: { t: 10, b: 40, l: 40, r: 10 },
    height: 220,
  };

  return (
    <div className="page">
      <h1 className="page-title">
        🤖 AI Insights
        <span className="page-sub"> · AI-powered cause analysis</span>
      </h1>

      {/* Charts row */}
      <div className="insights-charts grid-2">
        <div className="card">
          <h3 className="chart-heading">Anomaly Type Distribution</h3>
          <Plot
            data={pieData}
            layout={pieLayout}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%" }}
          />
        </div>
        <div className="card">
          <h3 className="chart-heading">AI Confidence Levels</h3>
          <Plot
            data={barData}
            layout={barLayout}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Critical events spotlight */}
      {criticals.length > 0 && (
        <div className="card spotlight">
          <h3 className="chart-heading">🔴 Critical Events Spotlight</h3>
          <div className="spotlight-list">
            {criticals.map((a, i) => {
              const insight = a.ai_insight || {};
              const color   = TYPE_COLOR[insight.type] || "var(--accent)";
              return (
                <div key={i} className="spotlight-item">
                  <div className="si-left" style={{ borderColor: color }}>
                    <div className="si-icon">{TYPE_ICON[insight.type] || "📊"}</div>
                    <div className="si-type" style={{ color }}>{insight.type || "unknown"}</div>
                  </div>
                  <div className="si-body">
                    <div className="si-header">
                      <span className="si-date">{a.date}</span>
                      <span className="si-metric">{a.metric}</span>
                      <span className={`si-change ${a.pct_change >= 0 ? "pos" : "neg"}`}>
                        {a.pct_change >= 0 ? "▲" : "▼"}{Math.abs(a.pct_change)}%
                      </span>
                    </div>
                    <p className="si-cause">{insight.cause}</p>
                    <p className="si-rec">💡 {insight.recommendation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All insights table */}
      <div className="card">
        <h3 className="chart-heading">All Insights ({anomalies.length})</h3>
        <div className="insights-table-wrap">
          <table className="insights-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Metric</th>
                <th>Type</th>
                <th>Severity</th>
                <th>AI Type</th>
                <th>Confidence</th>
                <th>Cause</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((a, i) => {
                const ins = a.ai_insight || {};
                return (
                  <tr key={i}>
                    <td>{a.date}</td>
                    <td>{a.metric}</td>
                    <td><span className={`badge badge-${a.type}`}>{a.type}</span></td>
                    <td><span className={`badge badge-${a.severity}`}>{a.severity}</span></td>
                    <td>
                      <span className={`badge badge-${ins.type || "viral"}`}>
                        {TYPE_ICON[ins.type] || ""} {ins.type || "—"}
                      </span>
                    </td>
                    <td><span className={`badge badge-${ins.confidence || "low"}`}>{ins.confidence || "—"}</span></td>
                    <td className="cause-cell">{ins.cause || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
