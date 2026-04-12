import React, { useState, useEffect, useMemo, memo } from "react";
import { motion } from "framer-motion";
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
  Activity, 
  Zap, 
  Shield, 
  BarChart2,
  AlertCircle,
  Clock
} from "lucide-react";
import { getResults } from "../services/api";

const METRICS = [
  { key: "likes", label: "Engagement", icon: Activity },
  { key: "comments", label: "Discussion", icon: Zap },
  { key: "shares", label: "Amplification", icon: Shield },
  { key: "posts", label: "Activity", icon: BarChart2 },
];

/**
 * Chart Component — Memoized for 144Hz stability
 */
const MetricChart = memo(({ data }) => (
  <div className="w-full h-full relative z-10 block aspect-[21/9] min-h-[340px] lg:min-h-[480px] xl:min-h-[560px] gpu-accelerated chart-container-gpu">
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#52525b", fontWeight: 800 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#52525b", fontWeight: 800 }} axisLine={false} tickLine={false} />
                <Tooltip 
                    content={<ChartTooltip />} 
                    cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}
                    isAnimationActive={false}
                />
                <Area type="monotone" dataKey="value" stroke="none" fill="#6366f1" fillOpacity={0.1} isAnimationActive={false} />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={false} isAnimationActive={false} />
                {data.filter(d => d.isAnomaly).map((a, i) => (
                    <ReferenceDot key={i} x={a.label} y={a.value} r={5} fill={a.severity === 'critical' ? '#ef4444' : '#f59e0b'} stroke="#000" strokeWidth={2} />
                ))}
            </ComposedChart>
        </ResponsiveContainer>
    </div>
));

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="glass-panel border-white/10 shadow-lg px-5 py-4 text-[11px] w-56 rounded-2xl relative z-50">
      <p className="font-black text-white uppercase tracking-widest mb-3 border-b border-white/5 pb-2">{d.label || label}</p>
      <div className="space-y-2">
        <p className="flex justify-between items-center text-zinc-400">
          <span className="font-bold uppercase tracking-tight">Signal:</span>
          <span className="font-black text-white text-sm">{d.value?.toLocaleString()}</span>
        </p>
        {d.isAnomaly && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${d.severity === "critical" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
              {d.severity === "critical" ? "CRITICAL_BREACH" : "ANOMALY_DETECTED"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [metric, setMetric] = useState("likes");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResults()
      .then((result) => {
      if (result.status !== "ok" || !result.data) {
        setLoading(false);
        return;
      }
      setAnalysisResult(result);
      setLoading(false);
    })
      .catch(() => setLoading(false));
  }, []);

  const rawData = useMemo(() => {
      if (!analysisResult?.data) return [];
      const data_points = analysisResult.data;
      const anomalies = (analysisResult.anomalies || []).filter(a => a.metric === metric);
      const anomalyMap = {};
      anomalies.forEach((a) => { anomalyMap[a.date] = a; });

      return data_points.map((dp) => {
        const isAnomaly = !!anomalyMap[dp.date];
        const aInfo = anomalyMap[dp.date];
        return {
          ...dp,
          label: new Date(dp.date).toLocaleString("default", { month: "short", day: "numeric" }).toUpperCase(),
          value: dp[metric],
          isAnomaly,
          severity: aInfo ? (Math.abs(aInfo.z_score) > 4.5 ? "critical" : "medium") : null,
        };
      });
  }, [analysisResult, metric]);

  const stats = useMemo(() => {
     const anomalies = rawData.filter((d) => d.isAnomaly);
     const critical = anomalies.filter((d) => d.severity === "critical").length;
     const avg = rawData.length ? Math.round(rawData.reduce((a, b) => a + (b.value || 0), 0) / rawData.length) : 0;
     return { total: anomalies.length, critical, avg };
  }, [rawData]);

  if (loading) {
     return (
       <div className="page-shell flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-t-2 border-indigo-600 rounded-full animate-spin shadow-[0_0_20px_rgba(79,70,229,0.2)]"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 animate-pulse">Syncing Operational Hub</p>
          </div>
       </div>
     );
  }

  return (
    <div className="flex-1 flex flex-col xl:flex-row w-full h-full overflow-hidden bg-[#030303]">
      <aside className="w-full xl:w-80 border-r border-white/5 glass-panel p-8 md:p-10 space-y-10 shrink-0 overflow-y-auto">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 mb-8">Signal Logic</h2>
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-3">
                {METRICS.map((m) => (
                    <button 
                        key={m.key} 
                        onClick={() => setMetric(m.key)} 
                        className={`p-5 rounded-3xl border text-left flex items-center gap-4 interactive-fast ${metric === m.key ? "bg-indigo-600/10 border-indigo-500/30 text-white shadow-md" : "bg-white/[0.02] border-white/[0.05] text-zinc-600 hover:border-white/10"}`}
                    >
                        <m.icon className={`w-4 h-4 ${metric === m.key ? "text-indigo-400" : "text-zinc-700"}`} /> 
                        <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                    </button>
                ))}
            </div>
          </div>
          
          <div className="pt-10 border-t border-white/5">
             <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 mb-6">System Health</h2>
             <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Signal Buffer</span>
                    <span className="text-emerald-500">Nominal</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-emerald-500/30 animate-pulse" />
                </div>
             </div>
          </div>
      </aside>

      <section className="flex-1 overflow-y-auto px-6 py-10 md:px-10 md:py-14 lg:px-14 lg:py-16">
        <header className="mb-12">
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">Operations Hub</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Metric Surveillance & Threat Mapping</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-12">
            <StatCard label="Critical Threats" value={stats.critical} icon={AlertCircle} color="text-red-500" />
            <StatCard label="Anomaly Count" value={stats.total} icon={Zap} color="text-indigo-400" />
            <StatCard label="Avg Magnitude" value={stats.avg.toLocaleString()} icon={Clock} color="text-zinc-200" />
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-[3.5rem] p-6 md:p-8 lg:p-10 border-white/[0.05] relative overflow-hidden flex flex-col group"
        >
          <div className="flex items-center justify-between mb-10">
                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Signal Topology Matrix</h3>
                <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[9px] font-black text-indigo-400 uppercase tracking-widest">Live Integration</div>
            </div>
            
            <MetricChart data={rawData} />
        </motion.div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
    return (
    <div className="glass-card p-8 md:p-10 rounded-[3rem] border-white/[0.05] relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <Icon className="w-32 h-32 text-white" />
            </div>
            <Icon className={`w-8 h-8 ${color} mb-8 relative z-10`} />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 mb-3 relative z-10">{label}</p>
            <p className="text-4xl font-black text-white italic leading-none relative z-10">{value}</p>
        </div>
    );
}
