import React, { useState, useMemo } from "react";

/* ─── Mock Data ──────────────────────────────────────────────── */

// Generates logs that look like a monitoring system output
const MOCK_ALERTS = [
  {
    id: "alrt_982b1c",
    timestamp: "2026-04-11T14:22:05Z",
    metric: "Likes",
    type: "spike",
    severity: "critical",
    zScore: 6.42,
    value: 12450,
    expected: 3200,
    cause: "Viral hashtag campaign detected (#TechLaunch26).",
    duration: "2h 15m",
  },
  {
    id: "alrt_982b1d",
    timestamp: "2026-04-11T09:15:22Z",
    metric: "Comments",
    type: "spike",
    severity: "medium",
    zScore: 3.85,
    value: 840,
    expected: 210,
    cause: "Unusually high engagement on product announcement post.",
    duration: "45m",
  },
  {
    id: "alrt_982b1e",
    timestamp: "2026-04-10T22:05:11Z",
    metric: "Shares",
    type: "drop",
    severity: "low",
    zScore: -2.15,
    value: 15,
    expected: 140,
    cause: "Platform algorithm change suppressing reach (suspected).",
    duration: "6h 30m",
  },
  {
    id: "alrt_982b1f",
    timestamp: "2026-04-10T11:45:00Z",
    metric: "Engagement",
    type: "spike",
    severity: "critical",
    zScore: 7.12,
    value: 45000,
    expected: 12000,
    cause: "Coordinated bot activity targeting recent giveaway.",
    duration: "1h 10m",
  },
  {
    id: "alrt_982b20",
    timestamp: "2026-04-09T08:30:45Z",
    metric: "Sentiment",
    type: "drop",
    severity: "critical",
    zScore: -5.88,
    value: 12,
    expected: 65,
    cause: "Negative PR sentiment spike following service outage.",
    duration: "14h 20m",
  },
  {
    id: "alrt_982b21",
    timestamp: "2026-04-08T16:20:10Z",
    metric: "Likes",
    type: "spike",
    severity: "medium",
    zScore: 4.05,
    value: 8200,
    expected: 2400,
    cause: "Organic reshare by influencer account.",
    duration: "3h 45m",
  },
  {
    id: "alrt_982b22",
    timestamp: "2026-04-07T14:10:05Z",
    metric: "Mentions",
    type: "drop",
    severity: "low",
    zScore: -2.01,
    value: 45,
    expected: 180,
    cause: "Normal weekend activity dip.",
    duration: "48h",
  },
];

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
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
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
          <span className="text-sm font-medium text-gray-900">{alert.metric}</span>
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
                Expected: {alert.expected.toLocaleString()}
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

  const filteredAlerts = useMemo(() => {
    return MOCK_ALERTS.filter((a) => {
      if (onlyCritical && a.severity !== "critical") return false;
      if (filterType !== "all" && a.type !== filterType) return false;
      return true;
    });
  }, [onlyCritical, filterType]);

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
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterType === "all"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType("spike")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterType === "spike"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
            >
              Spikes
            </button>
            <button
              onClick={() => setFilterType("drop")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterType === "drop"
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
                className={`block w-10 h-6 rounded-full transition-colors ${onlyCritical ? "bg-red-500" : "bg-gray-200"
                  }`}
              />
              <div
                className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${onlyCritical ? "translate-x-4" : ""
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
          {filteredAlerts.length === 0 ? (
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
