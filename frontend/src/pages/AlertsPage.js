import React, { memo, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  AlertCircle, 
  Clock, 
  Activity, 
  Zap,
  ShieldAlert,
  Search,
  CheckCircle2,
  FilterX
} from "lucide-react";
import { getResults } from "../services/api";

/* ─── Elite Components ───────────────────────────────────────── */

const SEVERITY_CONFIG = {
  critical: {
    bg: "bg-red-500/10 border-red-500/20 text-red-400",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
    icon: ShieldAlert,
    label: "Critical Breach"
  },
  medium: {
    bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    icon: AlertCircle,
    label: "Anomaly Detected"
  },
  low: {
    bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    glow: "shadow-[0_0_20px_rgba(99,102,241,0.15)]",
    icon: Zap,
    label: "Nominal Shift"
  }
};

const AlertCard = memo(function AlertCard({ alert, index }) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.01, 0.08), duration: 0.2 }}
      className={`glass-panel rounded-[2rem] border-white/[0.05] overflow-hidden group/card interactive-fast ${expanded ? "ring-2 ring-indigo-500/20 shadow-lg" : "hover:bg-white/[0.01]"}`}
    >
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-6 md:p-8 cursor-pointer flex items-center justify-between gap-6"
      >
        <div className="flex items-center gap-6 flex-1 min-w-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 interactive-fast ${config.bg} ${config.glow} ${expanded ? "scale-105" : "group-hover/card:scale-105"}`}>
                <Icon className="w-6 h-6" />
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${config.bg.split(' ')[2]}`}>{config.label}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{new Date(alert.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter truncate">
                    {alert.metric} <span className="text-zinc-700 italic lowercase ml-2">[{alert.type}]</span>
                </h3>
            </div>
        </div>

        <div className="flex items-center gap-8">
            <div className="hidden md:flex flex-col items-end">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Causal Sigma</p>
                <p className={`text-lg font-black font-mono ${alert.zScore > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {alert.zScore > 0 ? "+" : ""}{alert.zScore.toFixed(2)}z
                </p>
            </div>
            <div className={`p-3 rounded-full bg-white/[0.03] transition-transform duration-150 border border-white/5 ${expanded ? "rotate-90 bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "text-zinc-600 group-hover/card:bg-white/5 group-hover/card:text-zinc-300"}`}>
                <ChevronRight className="w-4 h-4" />
            </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden bg-black/40 border-t border-white/5"
          >
            <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {/* Diagnostic Matrix */}
                    <div>
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6">Diagnostic Matrix</h4>
                        <div className="space-y-4">
                            <StatRow label="Event Value" value={alert.value.toLocaleString()} />
                            <StatRow label="System Baseline" value={`~${Math.round(alert.expected).toLocaleString()}`} />
                            <StatRow label="Horizon Cycle" value="t+0" />
                            <StatRow label="Cluster ID" value={alert.id.split('_')[2]} />
                        </div>
                    </div>

                    {/* AI Trace */}
                    <div className="md:col-span-2">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6">AI Causal Trace</h4>
                        <div className="p-8 bg-zinc-900/50 rounded-3xl border border-white/5 shadow-inner relative overflow-hidden group/trace">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover/trace:opacity-[0.1] transition-opacity">
                                <Search className="w-12 h-12" />
                            </div>
                            <p className="text-sm font-medium leading-relaxed text-zinc-300 italic group-hover/trace:text-white transition-colors duration-150">
                                "{alert.cause}"
                            </p>
                        </div>
                        <div className="mt-8 flex gap-4">
                            <button className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl interactive-fast shadow-md shadow-indigo-600/20">
                                Pivot to Root Cause
                            </button>
                            <button className="px-8 py-3.5 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-2xl interactive-fast border border-white/5">
                                Acknowledge
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.alert.id === nextProps.alert.id && prevProps.index === nextProps.index;
});

function StatRow({ label, value }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-white/[0.03]">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">{label}</span>
            <span className="text-xs font-black text-zinc-300 font-mono">{value}</span>
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
    const processResult = (result) => {
      if (result.status !== "ok" || !result.anomalies) {
        setLoading(false);
        return;
      }

      const allAlerts = result.anomalies.map((a, i) => {
        const severity = a.severity || (Math.abs(a.z_score) >= 4.5 ? "critical" : Math.abs(a.z_score) >= 2.5 ? "medium" : "low");
        return {
          id: `alrt_${a.metric}_${i}_${a.date.replace(/-/g, "")}`,
          timestamp: a.date,
          metric: a.metric,
          type: a.type,
          severity,
          zScore: a.z_score,
          value: a.value,
          expected: a.baseline_mean || 0,
          cause: a.ai_insight ? a.ai_insight.cause : `Autonomous statistical anomaly detected at index ${i}. Manual verification recommended.`,
          duration: "1 Cycle",
        };
      });

      allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAlerts(allAlerts);
      setLoading(false);
    };

    const cached = sessionStorage.getItem("analysisData");
    if (cached) {
      try { processResult(JSON.parse(cached)); return; } catch (e) { }
    }

    getResults()
      .then(processResult)
      .catch(() => setLoading(false));
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (onlyCritical && a.severity !== "critical") return false;
      if (filterType !== "all" && a.type !== filterType) return false;
      return true;
    });
  }, [onlyCritical, filterType, alerts]);

  return (
    <div className="page-shell">
      <div className="page-container flex flex-col items-center">
        
        {/* Header — Elite Typography */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-14 text-center md:text-left"
        >
            <div className="flex flex-col md:flex-row items-baseline justify-between gap-8 border-b border-white/5 pb-12">
                <div>
                    <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4">Crisis Feed</h1>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                            <Activity className="w-3 h-3 text-indigo-500" /> {alerts.length} Records Indexed
                        </span>
                        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-red-500 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/10">
                            <ShieldAlert className="w-3 h-3" /> {alerts.filter(a => a.severity === 'critical').length} Critical
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                           type="checkbox" 
                           checked={onlyCritical} 
                           onChange={(e) => setOnlyCritical(e.target.checked)} 
                           className="hidden"
                        />
                        <div className={`w-10 h-5 rounded-full transition-all duration-300 relative ${onlyCritical ? "bg-red-500" : "bg-zinc-800"}`}>
                             <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${onlyCritical ? "translate-x-6" : "translate-x-1"}`} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-white transition-colors ${onlyCritical ? "text-red-500" : "text-zinc-600"}`}>Priority Only</span>
                    </label>

                    <select
                        className="bg-black/40 border border-white/10 px-6 py-3 rounded-2xl focus:outline-none focus:border-indigo-500/50 text-zinc-300 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">Global Matrix</option>
                        <option value="spike">Spike Surge</option>
                        <option value="drop">Decay Signal</option>
                    </select>
                </div>
            </div>
        </motion.div>

        {/* Alerts List */}
        <div className="w-full space-y-6">
           {loading ? (
             <div className="flex flex-col items-center py-40">
                <div className="w-12 h-12 border-b-2 border-indigo-600 rounded-full animate-spin mb-8" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700">Deciphering Alert Manifest</p>
             </div>
           ) : filteredAlerts.length === 0 ? (
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-40 text-center glass-card rounded-[3rem] border border-dashed border-white/5"
             >
                <FilterX className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">No alert signatures matched current filter</p>
                <button onClick={() => {setOnlyCritical(false); setFilterType('all');}} className="mt-8 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">Clear Matrix</button>
             </motion.div>
           ) : (
             <div className="grid grid-cols-1 gap-4 md:gap-6">
                {filteredAlerts.map((alert, idx) => (
                    <AlertCard key={alert.id} alert={alert} index={idx} />
                ))}
             </div>
           )}
        </div>

        {/* Footer — Success State */}
        {!loading && filteredAlerts.length > 0 && (
            <div className="mt-20 flex items-center gap-4 text-zinc-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Feed Synchronization Terminal: Online</p>
            </div>
        )}

      </div>
    </div>
  );
}
