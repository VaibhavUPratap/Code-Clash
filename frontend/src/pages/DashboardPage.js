import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Plot from "react-plotly.js";
import "./DashboardPage.css";

export default function DashboardPage() {
  const [result, setResult]   = useState(null);
  const [metric, setMetric]   = useState("likes");
  const navigate              = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    if (!stored) { navigate("/"); return; }
    setResult(JSON.parse(stored));
  }, [navigate]);

  const { plotData, plotLayout } = useMemo(() => {
    if (!result) return { plotData: [], plotLayout: {} };

    const data = result.data || [];
    const anomalies = (result.anomalies || []).filter((a) => a.metric === metric);
    const dates  = data.map((d) => d.date);
    const values = data.map((d) => d[metric]);

    // Anomaly markers
    const anomalyDates  = anomalies.map((a) => a.date);
    const anomalyValues = anomalies.map((a) => a.value);
    const anomalyLabels = anomalies.map(
      (a) =>
        `${a.type.toUpperCase()} (${a.severity})<br>Z: ${a.z_score?.toFixed(2)}<br>${a.pct_change > 0 ? "+" : ""}${a.pct_change}%`
    );
    const markerColors = anomalies.map((a) =>
      a.severity === "critical" ? "#ef4444" : a.severity === "medium" ? "#f59e0b" : "#22c55e"
    );

    const plotData = [
      {
        type: "scatter",
        mode: "lines",
        name: metric,
        x: dates,
        y: values,
        line: { color: "#6366f1", width: 2 },
        fill: "tozeroy",
        fillcolor: "rgba(99,102,241,0.08)",
      },
      {
        type: "scatter",
        mode: "markers",
        name: "Anomalies",
        x: anomalyDates,
        y: anomalyValues,
        text: anomalyLabels,
        hovertemplate: "%{text}<extra></extra>",
        marker: { color: markerColors, size: 10, symbol: "circle", line: { color: "#fff", width: 1.5 } },
      },
    ];

    const plotLayout = {
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { color: "#e2e8f0", family: "Inter, sans-serif", size: 12 },
      xaxis: { gridcolor: "#2a2d3a", showgrid: true, zeroline: false },
      yaxis: { gridcolor: "#2a2d3a", showgrid: true, zeroline: false },
      legend: { orientation: "h", y: -0.15 },
      margin: { t: 20, l: 60, r: 20, b: 60 },
      hovermode: "x unified",
    };

    return { plotData, plotLayout };
  }, [result, metric]);

  if (!result) return null;

  const { summary } = result;
  const METRICS = ["likes", "comments", "shares", "posts"];

  return (
    <div className="page">
      <h1 className="page-title">
        📊 Dashboard
        <span className="page-sub"> · {result.data?.length} days of data</span>
      </h1>

      {/* Summary stats */}
      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        <StatCard icon="📆" label="Days Analysed"   value={summary?.total_days} />
        <StatCard icon="⚡" label="Anomalies Found"  value={summary?.total_anomalies} color="#6366f1" />
        <StatCard icon="🔴" label="Critical"          value={summary?.severity_breakdown?.critical} color="#ef4444" />
        <StatCard icon="🟡" label="Medium"            value={summary?.severity_breakdown?.medium}   color="#f59e0b" />
      </div>

      {/* Averages */}
      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        <StatCard icon="❤️" label="Avg Likes"    value={summary?.averages?.likes?.toLocaleString()} />
        <StatCard icon="💬" label="Avg Comments" value={summary?.averages?.comments?.toLocaleString()} />
        <StatCard icon="🔁" label="Avg Shares"   value={summary?.averages?.shares?.toLocaleString()} />
        <StatCard
          icon="📬"
          label="Spikes / Drops"
          value={`${summary?.type_breakdown?.spikes} / ${summary?.type_breakdown?.drops}`}
        />
      </div>

      {/* Chart */}
      <div className="card chart-card">
        <div className="chart-header">
          <h2 className="chart-title">Engagement Over Time</h2>
          <div className="metric-tabs">
            {METRICS.map((m) => (
              <button
                key={m}
                className={`tab-btn ${metric === m ? "active" : ""}`}
                onClick={() => setMetric(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <Plot
          data={plotData}
          layout={plotLayout}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%", height: 380 }}
        />
        <p className="chart-legend">
          Coloured dots = anomalies:&nbsp;
          <span style={{ color: "#ef4444" }}>● critical</span>&nbsp;
          <span style={{ color: "#f59e0b" }}>● medium</span>&nbsp;
          <span style={{ color: "#22c55e" }}>● low</span>
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card stat-card">
      <div style={{ fontSize: "1.5rem" }}>{icon}</div>
      <div className="stat-value" style={color ? { color } : {}}>
        {value ?? "—"}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
