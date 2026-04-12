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
import { TrendingUp, TrendingDown } from "lucide-react";

/* ─── Config ─────────────────────────────────────────────────── */

const METRICS = [
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "shares", label: "Shares" },
  { key: "posts", label: "Posts" },
];

const DATE_RANGES = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "60d", label: "60 Days" },
  { key: "all", label: "All Time" },
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
    <div className="glass-panel shadow-2xl px-4 py-3 text-xs w-48 rounded-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
      <p className="font-semibold text-zinc-100 mb-2 relative z-10">{d.label || label}</p>
      <div className="space-y-1.5 text-zinc-400 relative z-10 font-mono">
        <p className="flex justify-between">
          <span>Vol:</span>
          <span className="text-zinc-100 font-medium">{d.value?.toLocaleString()}</span>
        </p>
        <p className="flex justify-between">
          <span>Baseline:</span>
          <span className="text-zinc-500">~{d.lower?.toLocaleString()}</span>
        </p>
        {d.isAnomaly && (
          <div className="mt-3 pt-2 border-t border-white/10">
            <p className={`font-semibold flex items-center justify-between ${d.severity === "critical" ? "text-red-400" : "text-amber-400"}`}>
              <span>⚠ {d.severity === "critical" ? "CRIT" : "WARN"}</span>
              <span>{d.z_score > 0 ? "+" : ""}{d.z_score}z</span>
            </p>
          </div>
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
    const processResult = (result) => {
      if (result.status !== "ok" || !result.data) return;

      const data_points = result.data;
      const anomalies = (result.anomalies || []).filter(a => a.metric === metric);

      const anomalyMap = {};
      anomalies.forEach((a) => { anomalyMap[a.date] = a; });

      const points = data_points.map((dp) => {
        const dateObj = new Date(dp.date);
        const isAnomaly = !!anomalyMap[dp.date];
        const aInfo = anomalyMap[dp.date];
        const severity = aInfo ? (Math.abs(aInfo.z_score) > 4.5 ? "critical" : Math.abs(aInfo.z_score) > 3 ? "medium" : "low") : null;

        return {
          ...dp,
          label: `${dateObj.toLocaleString("default", { month: "short", day: "numeric" })}`,
          value: dp[metric],
          upper: dp[metric] + (dp[metric] * 0.15 + 50),
          lower: Math.max(0, dp[metric] - (dp[metric] * 0.15 + 50)),
          isAnomaly,
          severity,
          z_score: aInfo ? (Math.round(aInfo.z_score * 100) / 100) : 0,
        };
      });
      setRawData(points);
    };

    // Try sessionStorage first, then fall back to the API cache endpoint
    const cached = sessionStorage.getItem("analysisData");
    if (cached) {
      try {
        processResult(JSON.parse(cached));
        return;
      } catch (e) {
        console.warn("Failed to parse sessionStorage data:", e);
      }
    }

    fetch("http://localhost:5000/api/get-results")
      .then((res) => res.json())
      .then(processResult)
      .catch((err) => console.error("Error fetching data:", err));
  }, [metric]);

  const data = useMemo(() => filterByRange(rawData, range), [range, rawData]);
  const stats = useMemo(() => getStats(data), [data]);

  const anomalies = useMemo(() => {
    const zThreshold = 2 + ((100 - sensitivity) / 100) * 3;
    return data.filter((d) => d.isAnomaly && Math.abs(d.z_score) >= zThreshold);
  }, [data, sensitivity]);

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full max-w-full">

      {/* Left Pane: Controls */}
      <aside className="w-full md:w-64 border-r border-white/5 glass-panel flex-shrink-0 z-10 shadow-2xl hidden md:block">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-100">Explorer</h2>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-mono">Engine: {data.length} pts</p>
        </div>

        <div className="p-5 space-y-8">
          <div>
            <label className="block text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-3">
              Target Metric
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full bg-zinc-950/50 border border-white/10 px-3 py-2 text-sm text-zinc-300 rounded-lg focus:outline-none focus:border-indigo-500/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
            >
              {METRICS.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-3">
              Time Horizon
            </label>
            <div className="flex flex-col gap-1.5">
              {DATE_RANGES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRange(key)}
                  className={`text-left px-3 py-2 text-xs rounded-lg transition-all duration-200 ${range === key ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium" : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 border border-transparent"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-3">
              Z-Score Filter
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer rounded-full accent-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-3 font-mono">
              <span className="hover:text-zinc-300 transition-colors">HIGH Z</span>
              <span className="font-bold text-indigo-400">{sensitivity}</span>
              <span className="hover:text-zinc-300 transition-colors">LOW Z</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content: Grid & Chart */}
      <section className="flex-1 flex flex-col min-h-0 bg-zinc-950 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top bar metrics */}
        <div className="flex flex-wrap items-center border-b border-white/5 divide-x divide-white/5 bg-zinc-900/20 backdrop-blur-md relative z-10">
          <StatBox label="Events Found" value={stats.total} sub={`${range === 'all' ? 'All Time' : range}`} color="text-zinc-100" />
          <StatBox label="Critical Overrides" value={stats.critical} sub={`Z-score > 3.0`} color="text-red-400 glow-red-text" />
          <StatBox label="Moving Average" value={stats.avgEngagement.toLocaleString()} sub={`${metric} / day`} color="text-indigo-300" />
        </div>

        {/* Chart View */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto relative z-10">

          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 tracking-wide">Activity Topology</h3>
                <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mt-1">Real-time engagement density</p>
              </div>
              <div className="flex gap-5 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 glow-indigo" /> Trend Line</span>
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-500 rounded-full glow-red" /> Spike Matrix</span>
                <span className="flex items-center gap-2"><span className="w-3 h-1 bg-white/10 rounded-full" /> Variance Band</span>
              </div>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 15, right: 15, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="bandColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.03} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0.01} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#71717a", fontFamily: "monospace" }}
                    axisLine={{ stroke: "#3f3f46" }}
                    tickLine={false}
                    interval={Math.max(Math.floor(data.length / 10), 0)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#71717a", fontFamily: "monospace" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: "4 4" }} />

                  {/* Confidence band */}
                  <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandColor)" isAnimationActive={false} />

                  {/* Glowing main line */}
                  <Line
                    type="monotone"
                    dataKey={metric}
                    stroke="#818cf8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: "#818cf8", stroke: "#e0e7ff", strokeWidth: 2 }}
                    isAnimationActive={false}
                    filter="url(#glow)"
                  />

                  {/* Glowing Area Fill */}
                  <Area type="monotone" dataKey={metric} stroke="none" fill="url(#colorValue)" isAnimationActive={false} />

                  {/* Anomaly markers */}
                  {anomalies.map((a, i) => (
                    <ReferenceDot
                      key={i}
                      x={a.label}
                      y={a[metric] || a.value}
                      r={4}
                      fill={a.severity === "critical" ? "#ef4444" : "#f59e0b"}
                      stroke="#18181b"
                      strokeWidth={2}
                      className={a.severity === "critical" ? "drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table: Filtered List */}
          <div>
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4 pl-2">Event Signatures ({anomalies.length})</h3>
            {anomalies.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center bg-zinc-900/30">
                <p className="text-xs font-mono text-zinc-500">No high-variance events detected in current manifold.</p>
              </div>
            ) : (
              <div className="glass-panel rounded-xl overflow-hidden shadow-xl border border-white/5 bg-zinc-900/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase text-zinc-500 tracking-widest font-semibold">
                      <th className="py-3 px-5">Timestamp</th>
                      <th className="py-3 px-5">Severity Level</th>
                      <th className="py-3 px-5">Magnitude</th>
                      <th className="py-3 px-5">Z-Score Deviation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {anomalies.map((a, idx) => (
                      <tr key={idx} className="group hover:bg-white/5 transition-colors duration-150">
                        <td className="py-3 px-5 font-mono text-zinc-300 text-xs">{a.label}</td>
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            {a.severity === 'critical' ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 glow-red animate-pulse" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            )}
                            <span className={`text-[10px] uppercase tracking-wider font-bold ${a.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                              {a.severity === 'critical' ? 'Critical' : 'Elevated'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-5 font-mono text-zinc-200">{a.value?.toLocaleString()}</td>
                        <td className="py-3 px-5 font-mono text-zinc-400 flex items-center gap-2">
                          {a.z_score > 0 ? (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-125 group-hover:-translate-y-0.5 transition-all duration-300" strokeWidth={2.5} />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-red-500 group-hover:scale-125 group-hover:translate-y-0.5 transition-all duration-300" strokeWidth={2.5} />
                          )}
                          {Math.abs(a.z_score).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </section>

    </div>
  );
}

/* ─── Minimal Stat Box ───────────────────────────────────────── */

function StatBox({ label, value, sub, color }) {
  return (
    <div className="flex-1 px-6 py-5 min-w-[150px] relative overflow-hidden group">
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="text-[10px] uppercase font-semibold tracking-widest text-zinc-500 mb-1.5">{label}</div>
      <div className={`text-2xl font-mono font-medium ${color} leading-none mb-1 shadow-sm`}>{value}</div>
      <div className="text-[10px] text-zinc-600 font-mono uppercase">{sub}</div>
    </div>
  );
}
