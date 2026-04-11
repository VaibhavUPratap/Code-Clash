import React, { useState, useEffect, useMemo } from "react";

/* ─── Helpers ────────────────────────────────────────────────── */

const SEVERITY_COLORS = {
  critical: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-orange-50 text-orange-700 border-orange-200",
  low: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

const SEVERITY_DOTS = {
  critical: "bg-red-500",
  medium: "bg-orange-500",
  low: "bg-yellow-400",
};

function formatDate(isoString) {
  const d = new Date(isoString);
  // Support both YYYY-MM-DD and true ISO timestamps cleanly
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ─── Components ─────────────────────────────────────────────── */

function AlertRow({ alert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0 group">
      {/* Main Row */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center px-6 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="w-1/4 min-w-[180px] flex items-center gap-3">
          <button
            className="text-gray-400 group-hover:text-gray-600 transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${expanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="text-sm text-gray-600 font-mono tracking-tight">
            {formatDate(alert.timestamp)}
          </span>
        </div>

        <div className="w-1/6 min-w-[100px]">
          <span className="text-sm font-medium text-gray-900 capitalize">{alert.metric}</span>
        </div>

        <div className="w-1/6 min-w-[100px] flex items-center gap-1.5">
          {alert.type === "spike" ? (
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          )}
          <span className="text-sm text-gray-600 capitalize">{alert.type}</span>
        </div>

        <div className="w-1/6 min-w-[120px]">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium capitalize ${SEVERITY_COLORS[alert.severity]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOTS[alert.severity]}`} />
            {alert.severity}
          </div>
        </div>

        <div className="w-1/6 min-w-[100px] text-right">
          <span className={`text-sm font-mono ${alert.zScore > 0 ? "text-indigo-600" : "text-emerald-600"}`}>
            {alert.zScore > 0 ? "+" : ""}{alert.zScore.toFixed(2)}z
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-12 py-4 bg-gray-50 border-t border-gray-100 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Values</p>
              <p className="text-gray-900 font-mono">
                Actual: {alert.value.toLocaleString()} <br />
                Expected Baseline: ~{Math.round(alert.expected).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Duration</p>
              <p className="text-gray-900">{alert.duration}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Automated Analysis</p>
              <p className="text-gray-900">{alert.cause}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-mono">ID: {alert.id}</span>
            <div className="flex gap-3">
              <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                View in Graph
              </button>
              <button className="text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors">
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Alerts Page ────────────────────────────────────────────── */

export default function AlertsPage() {
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/get-results")
      .then((res) => res.json())
      .then((result) => {
        if (result.status !== "ok" || !result.anomalies) {
          setLoading(false);
          return;
        }
        
        const allAlerts = result.anomalies.map((a, i) => {
          const severity = Math.abs(a.z_score) > 3 ? "critical" : "medium";
          
          return {
            id: `alrt_${a.metric}_${i}_${a.date.replace(/-/g, "")}`,
            timestamp: a.date,
            metric: a.metric,
            type: a.type,
            severity: severity,
            zScore: a.z_score,
            value: a.value,
            expected: a.baseline_mean,
            cause: a.ai_insight ? a.ai_insight.cause : `Automated statistical ${a.type} detection via Z-score analysis.`,
            duration: "End of day batch", // Simplified since data is daily
          };
        });
        
        // Sort newest first
        allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setAlerts(allAlerts);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Error fetching alerts:", e);
        setLoading(false);
      });
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (onlyCritical && a.severity !== "critical") return false;
      if (filterType !== "all" && a.type !== filterType) return false;
      return true;
    });
  }, [onlyCritical, filterType, alerts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">System Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitoring logs and automated detections.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white border border-gray-200 rounded-t-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filterType === "all"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType("spike")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filterType === "spike"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              Spikes
            </button>
            <button
              onClick={() => setFilterType("drop")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filterType === "drop"
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              Drops
            </button>
          </div>

          {/* Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={onlyCritical}
                onChange={(e) => setOnlyCritical(e.target.checked)}
              />
              <div
                className={`block w-10 h-6 rounded-full transition-colors ${
                  onlyCritical ? "bg-red-500" : "bg-gray-200"
                }`}
              />
              <div
                className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  onlyCritical ? "translate-x-4" : ""
                }`}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">Only Critical</span>
          </label>
        </div>

        {/* Table Header */}
        <div className="bg-gray-50 border-x border-b border-gray-200 px-6 py-3 flex items-center">
          <div className="w-1/4 min-w-[180px] text-xs font-semibold text-gray-500 uppercase tracking-wider pl-7">
            Timestamp
          </div>
          <div className="w-1/6 min-w-[100px] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Target
          </div>
          <div className="w-1/6 min-w-[100px] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Type
          </div>
          <div className="w-1/6 min-w-[120px] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Severity
          </div>
          <div className="w-1/6 min-w-[100px] text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
            Z-Score
          </div>
        </div>

        {/* Alert List */}
        <div className="bg-white border-x border-b border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
          {loading ? (
             <div className="px-6 py-12 text-center text-gray-500 text-sm">
               Loading system alerts from detection models...
             </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 text-sm">
              No alerts match the current filters.
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
