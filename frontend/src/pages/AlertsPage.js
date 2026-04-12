import React, { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";

/* ─── Helpers ────────────────────────────────────────────────── */

const SEVERITY_STYLES = {
  critical: "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[inset_0_0_8px_rgba(239,68,68,0.2)]",
  medium: "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[inset_0_0_8px_rgba(245,158,11,0.2)]",
  low: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
};

const SEVERITY_DOTS = {
  critical: "bg-red-500 glow-red animate-pulse",
  medium: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
  low: "bg-indigo-500 glow-indigo",
};

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

/* ─── Components ─────────────────────────────────────────────── */

function AlertRow({ alert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className={`border-b border-white/5 cursor-pointer text-xs transition-all duration-200 group ${expanded ? "bg-white/5" : "hover:bg-white/5"}`}
      >
        <td className="py-3 px-5 font-mono text-zinc-400 w-36 border-r border-white/5">
          <div className="flex items-center gap-3">
            <ChevronRight className={`w-4 h-4 transition-transform duration-300 text-zinc-600 ${expanded ? "rotate-90 text-indigo-400" : "group-hover:text-zinc-300 group-hover:scale-110"}`} strokeWidth={2.5} />
            {formatDate(alert.timestamp)}
          </div>
        </td>
        <td className="py-3 px-5 font-semibold text-zinc-300 border-r border-white/5 uppercase tracking-wider text-[10px]">
          {alert.metric}
        </td>
        <td className="py-3 px-5 text-zinc-500 border-r border-white/5 font-mono text-[11px] uppercase">
          {alert.type === "spike" ? (
            <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-red-500 group-hover:scale-125 group-hover:-translate-y-0.5 transition-all duration-300" strokeWidth={2.5} /> Spike</span>
          ) : (
            <span className="flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-125 group-hover:translate-y-0.5 transition-all duration-300" strokeWidth={2.5} /> Drop</span>
          )}
        </td>
        <td className="py-3 px-5 w-32 border-r border-white/5">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOTS[alert.severity]}`}></span>
            <span className={`inline-flex px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-widest ${SEVERITY_STYLES[alert.severity]}`}>
              {alert.severity}
            </span>
          </div>
        </td>
        <td className={`py-3 px-5 text-right font-mono ${alert.zScore > 0 ? "text-red-400" : "text-indigo-400"}`}>
          {alert.zScore > 0 ? "+" : ""}{alert.zScore.toFixed(2)}z
        </td>
      </tr>

      {/* Expanded Details */}
      {expanded && (
        <tr className="bg-zinc-900/50 backdrop-blur-sm border-b border-white/5 shadow-inner">
          <td colSpan={5} className="py-6 px-10 text-xs">
            <div className="grid grid-cols-3 gap-10">
              <div className="bg-zinc-950/50 p-4 rounded-xl border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]">
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Metrics Snapshot</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono mt-3 text-[11px]">
                  <span className="text-zinc-500 uppercase">Actual:</span>
                  <span className="text-zinc-200 text-right font-semibold">{alert.value.toLocaleString()}</span>
                  <span className="text-zinc-500 uppercase">Expected:</span>
                  <span className="text-zinc-200 text-right">~{Math.round(alert.expected).toLocaleString()}</span>
                  <span className="text-zinc-500 uppercase">Duration:</span>
                  <span className="text-zinc-200 text-right">{alert.duration}</span>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">AI Diagnostic Trace</p>
                <p className="text-zinc-300 leading-relaxed mt-2 font-mono text-[11px] bg-black/40 p-4 rounded-lg border border-white/5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]">
                  {alert.cause}
                </p>
                <div className="mt-4 flex gap-3">
                  <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all duration-200 shadow-[0_0_10px_rgba(79,70,229,0.3)]">View Target</button>
                  <button className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-colors border border-white/5">Acknowledge</button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Alerts Page ────────────────────────────────────────────── */

export default function AlertsPage() {
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processResult = (result) => {
      if (result.status !== "ok" || !result.anomalies) {
        setLoading(false);
        return;
      }

      const allAlerts = result.anomalies.map((a, i) => {
        const severity = a.severity || (Math.abs(a.z_score) >= 4.5 ? "critical" : Math.abs(a.z_score) >= 3.0 ? "medium" : "low");
        return {
          id: `alrt_${a.metric}_${i}_${a.date.replace(/-/g, "")}`,
          timestamp: a.date,
          metric: a.metric,
          type: a.type,
          severity,
          zScore: a.z_score,
          value: a.value,
          expected: a.baseline_mean,
          cause: a.ai_insight ? a.ai_insight.cause : `Automated statistical ${a.type} detection via Z-score manifold analysis.`,
          duration: "1 Cycle",
        };
      });

      allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAlerts(allAlerts);
      setLoading(false);
    };

    // Try sessionStorage first
    const cached = sessionStorage.getItem("analysisData");
    if (cached) {
      try { processResult(JSON.parse(cached)); return; } catch (e) { /* fall through */ }
    }

    fetch("http://localhost:5000/api/get-results")
      .then((res) => res.json())
      .then(processResult)
      .catch((e) => { console.error("Error fetching alerts:", e); setLoading(false); });
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (onlyCritical && a.severity !== "critical") return false;
      if (filterType !== "all" && a.type !== filterType) return false;
      return true;
    });
  }, [onlyCritical, filterType, alerts]);

  return (
    <div className="flex-1 p-6 md:p-8 w-full max-w-7xl mx-auto flex flex-col h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Detection Log</h1>
          <p className="text-[10px] text-zinc-500 mt-2 font-mono uppercase tracking-widest bg-zinc-900/50 px-2 py-1 rounded-sm border border-white/5 inline-block">Total indexed events: {alerts.length}</p>
        </div>
        <div className="mt-6 md:mt-0 flex gap-4 text-xs font-mono">
          <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-200 transition-colors uppercase tracking-widest text-[10px]">
            <input type="checkbox" checked={onlyCritical} onChange={(e) => setOnlyCritical(e.target.checked)} className="form-checkbox h-3.5 w-3.5 bg-zinc-900 border-white/20 text-indigo-500 rounded-sm focus:ring-indigo-500 focus:ring-offset-zinc-950" />
            Crit Level Only
          </label>
          <select
            className="bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500/50 text-zinc-300 text-[11px] uppercase tracking-wider"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Global Matrix</option>
            <option value="spike">Surges (Spike)</option>
            <option value="drop">Decays (Drop)</option>
          </select>
        </div>
      </div>

      {/* Alert Data Grid */}
      <div className="glass-panel border border-white/5 rounded-2xl shadow-2xl flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="overflow-auto flex-1 relative z-10 w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-black/20 border-b border-white/5 backdrop-blur-md sticky top-0 z-20">
              <tr>
                <th className="py-3 px-5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-r border-white/5">Timestamp</th>
                <th className="py-3 px-5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-r border-white/5">Target Vector</th>
                <th className="py-3 px-5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-r border-white/5">Topology Move</th>
                <th className="py-3 px-5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-r border-white/5">Severity Level</th>
                <th className="py-3 px-5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-right">Z-Score Dev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs font-mono text-indigo-400 animate-pulse">Running manifold diagnostics...</td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs font-mono text-zinc-500 italic">No events found in active filter matrix.</td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
