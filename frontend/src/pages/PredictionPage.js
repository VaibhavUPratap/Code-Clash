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

/**
 * Given a historical series of {date, value} points, produce 7 forecast days
 * using exponential smoothing + growing confidence intervals.
 */
function buildForecast(historical, metric = "likes") {
    if (!historical || historical.length === 0) return { past: [], future: [], spikeExpected: false };

    // Build sorted historical points
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

    // Exponential smoothing (α = 0.3)
    const alpha = 0.3;
    let smoothed = past[0].actual;
    const smoothedSeries = past.map(p => {
        smoothed = alpha * p.actual + (1 - alpha) * smoothed;
        return smoothed;
    });

    // Trailing std dev for confidence interval
    const recentWindow = past.slice(-14);
    const recentValues = recentWindow.map(p => p.actual);
    const mean = recentValues.reduce((s, v) => s + v, 0) / recentValues.length;
    const variance = recentValues.reduce((s, v) => s + (v - mean) ** 2, 0) / recentValues.length;
    const stdDev = Math.sqrt(variance);

    // Growth rate from last 7 days
    const last7 = past.slice(-7);
    const avgGrowth = last7.length >= 2
        ? (last7[last7.length - 1].actual - last7[0].actual) / last7.length
        : 0;

    // Detect if a spike is expected: trailing growth > 1.5x std dev
    const spikeExpected = avgGrowth > stdDev * 1.5;

    // Add "bridge" point at the join
    const lastPoint = past[past.length - 1];
    const bridgePoint = {
        ...lastPoint,
        predicted: lastPoint.actual,
        lower_bound: null,
        upper_bound: null,
    };
    past[past.length - 1] = bridgePoint;

    let predValue = smoothedSeries[smoothedSeries.length - 1];

    // Generate 7 future days
    const future = [];
    const lastDate = new Date(lastPoint.date);
    for (let i = 1; i <= 7; i++) {
        const d = new Date(lastDate);
        d.setDate(d.getDate() + i);
        const label = d.toLocaleString("default", { month: "short", day: "numeric" });

        predValue = Math.max(0, predValue + avgGrowth);

        const spread = stdDev * (1 + i * 0.25); // widen with time
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

    return { past, future, spikeExpected, avgGrowth, stdDev };
}

/* ─── Custom Tooltip ─────────────────────────────────────────── */

function ForecastTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3 text-sm">
            <p className="font-medium text-gray-900 mb-1">{label}</p>
            {data.isFuture ? (
                <div className="space-y-0.5">
                    <p className="text-indigo-600 font-medium">
                        Predicted: {data.predicted?.toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                        Expected Range: <br /> {data.lower_bound?.toLocaleString()} – {data.upper_bound?.toLocaleString()}
                    </p>
                </div>
            ) : (
                <p className="text-gray-600">
                    Actual: <span className="font-medium text-gray-900">{data.actual?.toLocaleString()}</span>
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

    const { past, future, spikeExpected, avgGrowth } = useMemo(
        () => buildForecast(historical, metric),
        [historical, metric]
    );

    const chartData = useMemo(() => [...past, ...future], [past, future]);

    // Find the bridge point index (first future item index in chartData)
    const bridgeIdx = past.length - 1;
    const bridgeLabel = chartData[bridgeIdx]?.label;
    const lastFutureLabel = chartData[chartData.length - 1]?.label;

    const growthLabel = avgGrowth > 0
        ? `+${Math.round(avgGrowth).toLocaleString()} / day avg`
        : `${Math.round(avgGrowth).toLocaleString()} / day avg`;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Trend Forecasting</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                7-day engagement forecast computed from your historical data via exponential smoothing.
                            </p>
                        </div>

                        {/* Metric selector */}
                        <div className="flex items-center gap-2">
                            {METRICS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setMetric(key)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                        metric === key
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-24 text-sm text-gray-500">Loading forecast data...</div>
                ) : historical.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-sm text-amber-800">
                        No analysis data available. Run an analysis from the{" "}
                        <a href="/" className="font-semibold underline hover:text-amber-900">Home page</a>{" "}
                        first to see a real forecast.
                    </div>
                ) : (
                    <>
                        {/* Spike Alert Banner */}
                        <div className={`border rounded-xl px-6 py-4 flex items-center gap-4 mb-8 ${
                            spikeExpected
                                ? "bg-indigo-50 border-indigo-200"
                                : "bg-gray-50 border-gray-200"
                        }`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                spikeExpected ? "bg-indigo-100" : "bg-gray-100"
                            }`}>
                                {spikeExpected ? (
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h2 className="text-base font-semibold text-gray-900">
                                        {spikeExpected ? "Spike likely in next 7 days" : "Stable trend expected"}
                                    </h2>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                        spikeExpected ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-600"
                                    }`}>
                                        {spikeExpected ? "Alert" : "Normal"}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {spikeExpected
                                        ? `Rising momentum detected — trailing growth of ${growthLabel} on ${METRICS.find(m => m.key === metric)?.label.toLowerCase()} exceeds recent volatility.`
                                        : `No significant spike signals detected. ${METRICS.find(m => m.key === metric)?.label} is tracking within expected volatility bounds.`
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Chart Card */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                        {METRICS.find(m => m.key === metric)?.label} Forecast
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Source: <span className="font-medium">{dataSource}</span> · {past.length} historical days
                                    </p>
                                </div>

                                {/* Legend */}
                                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-0.5 bg-gray-400 rounded-full" />
                                        <span>Historical</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-0.5 bg-indigo-600 rounded-full border-dashed" />
                                        <span>Predicted</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 bg-indigo-50 border border-indigo-100 rounded-sm" />
                                        <span>Confidence Interval</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-96 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                                        <defs>
                                            <linearGradient id="predictionArea" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.15} />
                                                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                                            axisLine={{ stroke: "#e2e8f0" }}
                                            tickLine={false}
                                            minTickGap={20}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={65}
                                            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                                        />

                                        <Tooltip content={<ForecastTooltip />} />

                                        {/* Shaded future region */}
                                        {bridgeLabel && lastFutureLabel && (
                                            <ReferenceArea
                                                x1={bridgeLabel}
                                                x2={lastFutureLabel}
                                                fill="#f8fafc"
                                                fillOpacity={1}
                                            />
                                        )}

                                        {/* Confidence interval */}
                                        <Area
                                            type="monotone"
                                            dataKey="upper_bound"
                                            stroke="none"
                                            fill="url(#predictionArea)"
                                            isAnimationActive={false}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="lower_bound"
                                            stroke="none"
                                            fill="#f8fafc"
                                            isAnimationActive={false}
                                        />

                                        {/* Historical line */}
                                        <Line
                                            type="monotone"
                                            dataKey="actual"
                                            stroke="#94a3b8"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 4, fill: "#fff", stroke: "#94a3b8", strokeWidth: 2 }}
                                            connectNulls={false}
                                        />

                                        {/* Forecast line */}
                                        <Line
                                            type="monotone"
                                            dataKey="predicted"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            strokeDasharray="5 4"
                                            dot={false}
                                            activeDot={{ r: 4, fill: "#fff", stroke: "#6366f1", strokeWidth: 2 }}
                                            connectNulls={true}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Summary row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                            {[
                                { label: "Historical Days", value: past.length },
                                { label: "Forecast Horizon", value: "7 days" },
                                { label: "Trailing Growth", value: growthLabel },
                                { label: "Spike Signal", value: spikeExpected ? "Detected ⚡" : "None" },
                            ].map(({ label, value }) => (
                                <div key={label} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
                                    <p className={`text-sm font-semibold ${spikeExpected && label === "Spike Signal" ? "text-indigo-600" : "text-gray-900"}`}>
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
