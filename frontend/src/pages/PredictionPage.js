import React, { useState, useEffect, useMemo } from "react";
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
} from "recharts";
import { 
  Radar, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Clock 
} from "lucide-react";
import { getResults } from "../services/api";

function buildForecast(historical, metric = "likes") {
    if (!historical?.length) return { past: [], future: [] };
    const past = historical.map(d => ({
        label: new Date(d.date).toLocaleString("default", { month: "short", day: "numeric" }).toUpperCase(),
        actual: d[metric] ?? 0,
        isFuture: false,
    }));
    const lastVal = past[past.length - 1].actual;
    const future = Array.from({ length: 7 }).map((_, i) => ({
        label: `T+${i+1}`,
        predicted: Math.round(lastVal * (1 + (i+1) * 0.05)),
        upper: Math.round(lastVal * (1 + (i+1) * 0.15)),
        lower: Math.max(0, Math.round(lastVal * (1 + (i+1) * -0.05))),
        isFuture: true,
    }));
    return { past, future };
}

export default function PredictionPage() {
    const [historical, setHistorical] = useState([]);
    const [loading, setLoading] = useState(true);
    const [metric, setMetric] = useState("likes");

    useEffect(() => {
        getResults().then(res => {
            if (res.status === "ok") setHistorical(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const { past, future } = useMemo(() => buildForecast(historical, metric), [historical, metric]);
    const chartData = [...past, ...future];

    if (loading) return <div className="page-shell flex items-center justify-center"><div className="w-10 h-10 border-2 border-indigo-600 rounded-full animate-spin" /></div>;

    return (
        <div className="page-shell">
            <div className="page-container">
                <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-12 leading-none">Horizon Forecast</h1>
                
                <div className="glass-card rounded-[3rem] p-6 md:p-8 lg:p-10 border-white/[0.05] relative overflow-hidden min-h-[420px] lg:min-h-[520px] flex flex-col">
                    <div className="flex items-center justify-between mb-8 md:mb-10">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">Synthetic Horizon Matrix</h3>
                        <div className="flex gap-4">
                            {["likes", "comments", "shares"].map(m => (
                                <button key={m} onClick={() => setMetric(m)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border interactive-fast ${metric === m ? "bg-indigo-600 border-indigo-500 text-white" : "border-white/10 text-zinc-600 hover:text-zinc-400"}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Final fix: Aspect Ratio stabilization */}
                    <div className="w-full flex-grow relative z-10 block min-h-[320px] md:min-h-[380px] lg:min-h-[420px] xl:min-h-[500px] aspect-[21/9] chart-container-gpu">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#52525b", fontWeight: 800 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 9, fill: "#52525b", fontWeight: 800 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #333", borderRadius: "12px", fontSize: "10px" }} />
                                <Area type="monotone" dataKey="upper" stroke="none" fill="#6366f1" fillOpacity={0.05} />
                                <Line type="monotone" dataKey="actual" stroke="#818cf8" strokeWidth={3} dot={false} />
                                <Line type="monotone" dataKey="predicted" stroke="#818cf8" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
