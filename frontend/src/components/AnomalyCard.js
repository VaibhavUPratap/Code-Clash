import React from "react";

const SEVERITY_ICON = { critical: "🔴", medium: "🟡", low: "🟢" };
const TYPE_ICON     = { viral: "🚀", bot: "🤖", crisis: "⚠️" };

export default function AnomalyCard({ anomaly }) {
  const insight = anomaly.ai_insight || {};

  return (
    <div className={`anomaly-card card severity-${anomaly.severity}`}>
      {/* Header row */}
      <div className="ac-header">
        <div className="ac-date">{anomaly.date}</div>
        <div className="ac-badges">
          <span className={`badge badge-${anomaly.severity}`}>
            {SEVERITY_ICON[anomaly.severity]} {anomaly.severity}
          </span>
          <span className={`badge badge-${anomaly.type}`}>
            {anomaly.type}
          </span>
          {insight.type && (
            <span className={`badge badge-${insight.type}`}>
              {TYPE_ICON[insight.type]} {insight.type}
            </span>
          )}
        </div>
      </div>

      {/* Metric row */}
      <div className="ac-metric-row">
        <span className="ac-metric-name">{anomaly.metric}</span>
        <span className="ac-value">{anomaly.value?.toLocaleString()}</span>
        <span
          className={`ac-pct ${anomaly.pct_change >= 0 ? "pos" : "neg"}`}
        >
          {anomaly.pct_change >= 0 ? "▲" : "▼"}{" "}
          {Math.abs(anomaly.pct_change)}%
        </span>
      </div>

      {/* Stats row */}
      <div className="ac-stats">
        <span title="Z-score">Z: {anomaly.z_score?.toFixed(2)}</span>
        <span title="Baseline mean">
          Baseline: {anomaly.baseline_mean?.toLocaleString()}
        </span>
        <span title="Detection method">{anomaly.detection_method}</span>
      </div>

      {/* AI insight */}
      {insight.cause && (
        <div className="ac-insight">
          <div className="ac-insight-title">
            🤖 AI Insight{" "}
            <span className={`badge badge-${insight.confidence}`} style={{ marginLeft: 6 }}>
              {insight.confidence} confidence
            </span>
          </div>
          <p className="ac-cause">{insight.cause}</p>
          {insight.recommendation && (
            <p className="ac-rec">💡 {insight.recommendation}</p>
          )}
        </div>
      )}
    </div>
  );
}
