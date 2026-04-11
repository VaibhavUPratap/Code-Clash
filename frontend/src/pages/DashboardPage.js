import React, { useState, useEffect, useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

/* ─── Config ─────────────────────────────────────────────────── */

const METRICS = [
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "shares", label: "Shares" },
  { key: "posts", label: "Posts" },
];

const DATE_RANGES = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "60d", label: "60D" },
  { key: "all", label: "All" },
];

/* ─── Helpers ────────────────────────────────────────────────── */

function filterByRange(data, range) {
  if (range === "all") return data;
  const days = parseInt(range);
  return data.slice(-days);
}

function getStats(data) {
  const anomalies = data.filter((d) => d.isAnomaly);
  const critical = anomalies.filter((d) => d.severity === "critical").length;
  const values = data.map((d) => d.value);
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  return {
    total: anomalies.length,
    critical,
    avgEngagement: avg,
  };
}

/* ─── Custom Tooltip ─────────────────────────────────────────── */

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 px-4 py-3 text-xs">
      <p className="font-medium text-gray-900 mb-1">{d.label || label}</p>
      <div className="space-y-0.5 text-gray-500">
        <p>Value: <span className="text-gray-900 font-medium">{d.value?.toLocaleString()}</span></p>
        {d.isAnomaly && (
          <p className="text-red-600 font-semibold mt-1">
            ⚠ {d.severity === "critical" ? "Critical" : "Medium"} anomaly ({d.z_score > 0 ? "+" : ""}{d.z_score}z)
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Dashboard Page ─────────────────────────────────────────── */

export default function DashboardPage() {
  const [metric, setMetric] = useState("likes");
  const [range, setRange] = useState("all");
  const [sensitivity, setSensitivity] = useState(50);
  const [rawData, setRawData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/get-results")
      .then((res) => res.json())
      .then((result) => {
        if (result.status !== "ok" || !result.data) return;
        
        const data_points = result.data;
        // Filter anomalies for the currently selected metric
        const anomalies = (result.anomalies || []).filter(a => a.metric === metric);
        
        const anomalyMap = {};
        anomalies.forEach((a) => {
          anomalyMap[a.date] = a;
        });

        const points = data_points.map((dp) => {
          const dateObj = new Date(dp.date);
          const isAnomaly = !!anomalyMap[dp.date];
          const aInfo = anomalyMap[dp.date];
          
          let severity = null;
          if (aInfo) {
             severity = Math.abs(aInfo.z_score) > 3 ? "critical" : "medium";
          }

          return {
            ...dp,
            label: `${dateObj.toLocaleString("default", { month: "short" })} ${dateObj.getDate()}`,
            value: dp[metric],
            // Create a pseudo-band roughly based on typical variation or constant relative size
            upper: dp[metric] + (dp[metric] * 0.15 + 50),
            lower: Math.max(0, dp[metric] - (dp[metric] * 0.15 + 50)),
            isAnomaly,
            severity,
            z_score: aInfo ? aInfo.z_score : 0,
          };
        });
        setRawData(points);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, [metric]);

  const data = useMemo(() => filterByRange(rawData, range), [range, rawData]);
  const stats = useMemo(() => getStats(data), [data]);
  
  // Apply additional sensitivity filter on frontend for anomalies shown in the list
  const anomalies = useMemo(() => {
     // Sensitivity 100 = show everything (Z > 2), Sensitivity 10 = show only extreme anomalies
     const zThreshold = 2 + ((100 - sensitivity) / 100) * 3; // scales from Z=2 to Z=5
     return data.filter((d) => d.isAnomaly && Math.abs(d.z_score) >= zThreshold);
  }, [data, sensitivity]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {data.length} data points · {stats.total} anomalies detected
            </p>
          </div>
          <div className="flex items-center gap-2">
            {DATE_RANGES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  range === key
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Anomalies"
            value={stats.total}
            sub={`across ${data.length} days`}
            color="text-gray-900"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
          />
          <StatCard
            label="Critical Anomalies"
            value={stats.critical}
            sub="requires attention"
            color="text-red-600"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Avg Value"
            value={stats.avgEngagement.toLocaleString()}
            sub="per data point"
            color="text-gray-900"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart area (3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {METRICS.find((m) => m.key === metric)?.label} Over Time
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Red markers indicate detected anomalies
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-indigo-500 rounded-full inline-block" /> Trend
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Anomaly
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2 bg-indigo-100 rounded-sm inline-block" /> Band
                </span>
              </div>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.06} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                    interval={Math.max(Math.floor(data.length / 10), 0)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                  />
                  <Tooltip content={<ChartTooltip />} />

                  {/* Confidence band */}
                  <Area
                    dataKey="upper"
                    stroke="none"
                    fill="url(#bandFill)"
                    isAnimationActive={false}
                  />
                  <Area
                    dataKey="lower"
                    stroke="none"
                    fill="#fff"
                    isAnimationActive={false}
                  />

                  {/* Main line */}
                  <Line
                    type="monotone"
                    dataKey={metric}
                    stroke="#6366f1"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, stroke: "#6366f1", fill: "#fff", strokeWidth: 1.5 }}
                  />

                  {/* Anomaly markers */}
                  {anomalies.map((a, i) => (
                    <ReferenceDot
                      key={i}
                      x={a.label}
                      y={a[metric] || a.value}
                      r={a.severity === "critical" ? 5 : 4}
                      fill={a.severity === "critical" ? "#ef4444" : "#f59e0b"}
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Controls sidebar (1 col) */}
          <div className="lg:col-span-1 space-y-5">
            {/* Metric selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Metric
              </label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
              >
                {METRICS.map(({ key, label }) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DATE_RANGES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setRange(key)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      range === key
                        ? "bg-gray-900 text-white"
                        : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sensitivity */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Sensitivity
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                <span>Low</span>
                <span className="text-gray-600 font-medium">{sensitivity}%</span>
                <span>High</span>
              </div>
            </div>

            {/* Anomaly list */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Recent Anomalies
              </label>
              <div className="space-y-2.5 max-h-52 overflow-y-auto">
                {anomalies.length === 0 && (
                  <p className="text-xs text-gray-400">No anomalies in this range.</p>
                )}
                {anomalies.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <span
                      className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        a.severity === "critical" ? "bg-red-500" : "bg-amber-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {a.label}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {a.severity} · {metric} {a.value?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────── */

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-start gap-4">
      <div className="w-9 h-9 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
        <p className={`text-2xl font-semibold ${color}`}>{value}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
