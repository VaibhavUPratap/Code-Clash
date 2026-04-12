import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Shield, 
  Filter, 
  Clock, 
  BarChart2,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { getResults } from "../services/api";

const METRICS = [
  { key: "likes", label: "Engagement", icon: Activity },
  { key: "comments", label: "Discussion", icon: Zap },
  { key: "shares", label: "Amplification", icon: Shield },
  { key: "posts", label: "Activity", icon: BarChart2 },
];

const DATE_RANGES = [
  { key: "7d", label: "7 Days", sub: "Short Horizon" },
  { key: "30d", label: "30 Days", sub: "Standard Month" },
  { key: "60d", label: "60 Days", sub: "Quarterly View" },
  { key: "all", label: "All Records", sub: "Complete History" },
];

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
  return { total: anomalies.length, critical, avgEngagement: avg };
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="glass-panel border-white/10 shadow-2xl px-5 py-4 text-[11px] w-56 rounded-2xl backdrop-blur-3xl">
      <p className="font-black text-white uppercase tracking-widest mb-3 border-b border-white/5 pb-2">{d.label || label}</p>
      <div className="space-y-2">
        <p className="flex justify-between items-center text-zinc-400">
          <span className="font-bold uppercase tracking-tight">Value:</span>
          <span className="font-black text-white text-sm">{d.value?.toLocaleString()}</span>
        </p>
        {d.isAnomaly && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${d.severity === "critical" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
              {d.severity === "critical" ? "CRITICAL BREACH" : "ANOMALY"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [metric, setMetric] = useState("likes");
  const [range, setRange] = useState("all");
  const [sensitivity, setSensitivity] = useState(50);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processResult = (result) => {
      if (result.status !== "ok" || !result.data) {
        setLoading(false);
        return;
      }
      const data_points = result.data;
      const anomalies = (result.anomalies || []).filter(a => a.metric === metric);
      const anomalyMap = {};
      anomalies.forEach((a) => { anomalyMap[a.date] = a; });

      const points = data_points.map((dp) => {
        const isAnomaly = !!anomalyMap[dp.date];
        const aInfo = anomalyMap[dp.date];
        return {
          ...dp,
          label: new Date(dp.date).toLocaleString("default", { month: "short", day: "numeric" }),
          value: dp[metric],
          isAnomaly,
          severity: aInfo ? (Math.abs(aInfo.z_score) > 4.5 ? "critical" : "medium") : null,
          z_score: aInfo ? Math.round(aInfo.z_score * 100) / 100 : 0,
        };
      });
      setRawData(points);
      setLoading(false);
    };

    getResults().then(processResult).catch(() => setLoading(false));
  }, [metric]);

  const data = useMemo(() => filterByRange(rawData, range), [range, rawData]);
  const stats = useMemo(() => getStats(data), [data]);

  if (loading) {
     return (
       <div className="flex-1 flex items-center justify-center bg-[#030303]">
          <div className="w-16 h-16 border-t-2 border-indigo-600 rounded-full animate-spin"></div>
       </div>
     );
  }

  return (
    <div className="flex-1 flex flex-col xl:flex-row w-full h-full overflow-hidden bg-[#030303]">
      <aside className="w-full xl:w-80 border-r border-white/5 glass-panel p-8 space-y-12 shrink-0">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Ops Config</h2>
          <div className="grid grid-cols-2 xl:grid-cols-1 gap-2">
              {METRICS.map((m) => (
                  <button key={m.key} onClick={() => setMetric(m.key)} className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${metric === m.key ? "bg-indigo-600/10 border-indigo-500/30 text-white" : "bg-black/20 border-white/5 text-zinc-600"}`}>
                      <m.icon className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                  </button>
              ))}
          </div>
      </aside>

      <section className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-12">System Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <StatCard label="Critical" value={stats.critical} icon={AlertCircle} color="text-red-500" />
            <StatCard label="Anomalies" value={stats.total} icon={Zap} color="text-indigo-400" />
            <StatCard label="Avg Magnitude" value={stats.avgEngagement.toLocaleString()} icon={Clock} color="text-zinc-100" />
        </div>

        {/* Deterministic Chart Container using Aspect Ratio and min-height */}
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card rounded-[3rem] p-10 border-white/[0.05] relative overflow-hidden flex flex-col min-h-[500px]"
        >
            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-8">Signal Topology</h3>
            {/* The magic fix: aspect-ratio + min-height + explicit block display */}
            <div className="w-full flex-grow relative z-10 block min-h-[400px] aspect-[21/9]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#52525b", fontWeight: 800 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: "#52525b", fontWeight: 800 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#ffffff20' }} />
                        <Area type="monotone" dataKey="value" stroke="none" fill="#6366f1" fillOpacity={0.1} />
                        <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={false} />
                        {data.filter(d => d.isAnomaly).map((a, i) => (
                            <ReferenceDot key={i} x={a.label} y={a.value} r={6} fill={a.severity === 'critical' ? '#ef4444' : '#f59e0b'} stroke="#000" strokeWidth={2} />
                        ))}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <div className="glass-card p-10 rounded-[2.5rem] border-white/[0.05]">
            <Icon className={`w-6 h-6 ${color} mb-6`} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-2">{label}</p>
            <p className="text-3xl font-black text-white italic leading-none">{value}</p>
        </div>
    );
}
