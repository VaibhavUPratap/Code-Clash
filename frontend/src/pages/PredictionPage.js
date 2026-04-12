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
    ReferenceArea,
} from "recharts";

/* ─── Forecast Engine ────────────────────────────────────────── */

function buildForecast(historical, metric = "likes") {
    if (!historical || historical.length === 0) return { past: [], future: [], spikeExpected: false };

    const past = historical
        .map(d => ({
            date: d.date,
            label: (() => {
                const obj = new Date(d.date);
                return obj.toLocaleString("default", { month: "short", day: "numeric" });
            })(),
            actual: d[metric] ?? 0,
            predicted: null,
            lower_bound: null,
            upper_bound: null,
            isFuture: false,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    if (past.length === 0) return { past: [], future: [], spikeExpected: false };

    const alpha = 0.3;
    let smoothed = past[0].actual;
    const smoothedSeries = past.map(p => {
        smoothed = alpha * p.actual + (1 - alpha) * smoothed;
        return smoothed;
    });

    const recentWindow = past.slice(-14);
    const recentValues = recentWindow.map(p => p.actual);
    const mean = recentValues.reduce((s, v) => s + v, 0) / recentValues.length;
    const variance = recentValues.reduce((s, v) => s + (v - mean) ** 2, 0) / recentValues.length;
    const stdDev = Math.sqrt(variance);

    const last7 = past.slice(-7);
    const avgGrowth = last7.length >= 2
        ? (last7[last7.length - 1].actual - last7[0].actual) / last7.length
        : 0;

    const spikeExpected = avgGrowth > stdDev * 1.5;

    const lastPoint = past[past.length - 1];
    const bridgePoint = {
        ...lastPoint,
        predicted: lastPoint.actual,
        lower_bound: null,
        upper_bound: null,
    };
    past[past.length - 1] = bridgePoint;

    let predValue = smoothedSeries[smoothedSeries.length - 1];

    const future = [];
    const lastDate = new Date(lastPoint.date);
    for (let i = 1; i <= 7; i++) {
        const d = new Date(lastDate);
        d.setDate(d.getDate() + i);
        const label = d.toLocaleString("default", { month: "short", day: "numeric" });

        predValue = Math.max(0, predValue + avgGrowth);

        const spread = stdDev * (1 + i * 0.25);
        future.push({
            date: d.toISOString().slice(0, 10),
            label,
            actual: null,
            predicted: Math.round(predValue),
            lower_bound: Math.max(0, Math.round(predValue - spread)),
            upper_bound: Math.round(predValue + spread),
            isFuture: true,
        });
    }

    return { past, future, spikeExpected, avgGrowth, stdDev, mean };
}

/* ─── Custom Tooltip ─────────────────────────────────────────── */

function ForecastTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;

    return (
        <div className="glass-panel border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] px-4 py-3 text-xs font-mono rounded-lg relative overflow-hidden min-w-[160px]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
            <p className="font-semibold text-zinc-100 mb-2 relative z-10">{label}</p>
            {data.isFuture ? (
                <div className="space-y-1.5 relative z-10">
                    <p className="flex justify-between text-zinc-300">
                        <span className="text-zinc-500">PREDICT:</span>
                        <span className="font-bold text-indigo-400">&nbsp;{data.predicted?.toLocaleString()}</span>
                    </p>
                    <p className="text-zinc-600 text-[9px] uppercase pt-1 border-t border-white/5">
                        Bounds: {data.lower_bound?.toLocaleString()} – {data.upper_bound?.toLocaleString()}
                    </p>
                </div>
            ) : (
                <p className="relative z-10 flex justify-between text-zinc-300">
                    <span className="text-zinc-500">ACTUAL:</span>
                    <span className="font-bold text-zinc-100">&nbsp;{data.actual?.toLocaleString()}</span>
                </p>
            )}
        </div>
    );
}

/* ─── Page Component ─────────────────────────────────────────── */

const METRICS = [
    { key: "likes", label: "Likes" },
    { key: "comments", label: "Comments" },
    { key: "shares", label: "Shares" },
    { key: "posts", label: "Posts" },
];

export default function PredictionPage() {
    const [historical, setHistorical] = useState([]);
    const [metric, setMetric] = useState("likes");
    const [loading, setLoading] = useState(true);
    const [dataSource, setDataSource] = useState("none");

    useEffect(() => {
        fetch("http://localhost:5000/api/get-results")
            .then(res => res.json())
            .then(result => {
                if (result.status === "ok" && result.data?.length) {
                    setHistorical(result.data);
                    setDataSource(result.source || "sample");
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const { past, future, spikeExpected, avgGrowth, stdDev, mean } = useMemo(
        () => buildForecast(historical, metric),
        [historical, metric]
    );

    const chartData = useMemo(() => [...past, ...future], [past, future]);

    const bridgeIdx = past.length - 1;
    const bridgeLabel = chartData[bridgeIdx]?.label;
    const lastFutureLabel = chartData[chartData.length - 1]?.label;

    const growthLabel = avgGrowth > 0
        ? `+${Math.round(avgGrowth).toLocaleString()} / day avg`
        : `${Math.round(avgGrowth).toLocaleString()} / day avg`;

    return (
        <div className="flex-1 p-6 md:p-10 w-full max-w-full flex justify-center h-screen overflow-y-auto">
            <div className="w-full max-w-6xl">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 mb-8 mt-2 relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative z-10">
                        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Exponential Smoothing Forecast</h1>
                        <p className="text-[10px] text-zinc-500 mt-2 font-mono uppercase tracking-widest bg-zinc-900/50 px-2 py-1 flex items-center gap-2 rounded border border-white/5 inline-flex">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                            Source: {dataSource} &nbsp;—&nbsp; a=0.30
                        </p>
                    </div>

                    <div className="mt-6 md:mt-0 flex gap-4 text-xs items-center relative z-10 font-mono">
                        <label className="text-indigo-400 uppercase font-bold text-[10px] tracking-widest hidden md:inline">Entity metric</label>
                        <select
                            value={metric}
                            onChange={(e) => setMetric(e.target.value)}
                            className="bg-zinc-900/80 border border-white/10 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 min-w-[120px] text-zinc-300 backdrop-blur-md"
                        >
                            {METRICS.map(({ key, label }) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="py-32 text-center text-xs font-mono text-indigo-400 animate-pulse glass-panel rounded-2xl border-white/5">Initializing forecast matrix...</div>
                ) : historical.length === 0 ? (
                    <div className="glass-panel p-8 rounded-2xl text-xs font-mono text-zinc-500 bg-zinc-950/50 text-center flex flex-col items-center">
                        <svg className="w-8 h-8 mb-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        ERR_NO_DATA: Run an analysis from the Root panel to cast forecast vectors.
                    </div>
                ) : (
                    <div className="glass-card rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/40 relative">

                        {/* Upper Warning Bar */}
                        {spikeExpected ? (
                            <div className="bg-red-500/10 border-b border-red-500/20 px-5 py-3 flex items-center justify-between shadow-[inset_0_0_20px_rgba(239,68,68,0.1)] glow-red relative z-10">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                        Target Breach
                                    </span>
                                    <span className="text-xs font-mono text-zinc-300">Model expects significant bound deviation in <span className="text-red-400 font-bold">t+7</span> steps.</span>
                                </div>
                                <span className="text-[10px] text-red-400/80 font-mono font-bold">Δ BASE: {growthLabel}</span>
                            </div>
                        ) : (
                            <div className="bg-zinc-950/50 px-5 py-3 border-b border-white/5 flex items-center justify-between relative z-10">
                                <span className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    System predicts stable state within expected variance bands.
                                </span>
                                <span className="text-[10px] text-zinc-600 font-mono uppercase font-bold tracking-widest">TRAIL: {growthLabel}</span>
                            </div>
                        )}

                        {/* Chart Area */}
                        <div className="h-[450px] w-full p-6 border-b border-white/5 relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                                    <defs>
                                        <linearGradient id="futureZone" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.05} />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.01} />
                                        </linearGradient>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
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

                                    <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#27272a" />

                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 10, fill: "#71717a", fontFamily: "monospace" }}
                                        axisLine={{ stroke: "#3f3f46" }}
                                        tickLine={false}
                                        minTickGap={20}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: "#71717a", fontFamily: "monospace" }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={60}
                                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                                    />

                                    <Tooltip content={<ForecastTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: "4 4", fill: 'transparent' }} />

                                    {/* Shaded future region */}
                                    {bridgeLabel && lastFutureLabel && (
                                        <ReferenceArea
                                            x1={bridgeLabel}
                                            x2={lastFutureLabel}
                                            fill="url(#futureZone)"
                                            fillOpacity={1}
                                        />
                                    )}

                                    {/* Confidence interval boundaries */}
                                    <Area type="monotone" dataKey="upper_bound" stroke="none" fill="url(#forecastBand)" isAnimationActive={false} />

                                    {/* Historical Actual Line */}
                                    <Line
                                        type="monotone"
                                        dataKey="actual"
                                        stroke="#818cf8"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 5, fill: "#818cf8", stroke: "#e0e7ff", strokeWidth: 2 }}
                                        isAnimationActive={false}
                                        filter="url(#glow)"
                                        connectNulls={false}
                                    />
                                    {/* Historical Area Fill */}
                                    <Area type="monotone" dataKey="actual" stroke="none" fill="url(#colorValue)" isAnimationActive={false} />

                                    {/* Forecast line */}
                                    <Line
                                        type="monotone"
                                        dataKey="predicted"
                                        stroke="#818cf8"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        dot={false}
                                        activeDot={{ r: 5, fill: "#818cf8", stroke: "#e0e7ff", strokeWidth: 2 }}
                                        connectNulls={true}
                                        filter="url(#glow)"
                                        isAnimationActive={false}
                                    />
                                    {/* Forecast Area Fill */}
                                    <Area type="monotone" dataKey="predicted" stroke="none" fill="url(#colorValue)" isAnimationActive={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Summary Data Footer */}
                        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/5 bg-zinc-950/80 relative z-10">
                            {[
                                { label: "H-Days Elapsed", value: past.length },
                                { label: "Projection Horizon", value: "7 Intervals" },
                                { label: "Confidence Model", value: "Trailing StDev Bands" },
                                { label: "Metric Volatility", value: stdDev > mean * 0.5 ? "High (Noise)" : "Low (Stable)" },
                            ].map(({ label, value }) => (
                                <div key={label} className="p-4 md:p-5 group hover:bg-white/5 transition-colors duration-300">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">{label}</p>
                                    <p className="text-xs font-mono text-zinc-300">{value}</p>
                                </div>
                            ))}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
