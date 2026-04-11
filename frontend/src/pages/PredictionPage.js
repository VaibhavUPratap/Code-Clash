import React from "react";
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

/* ─── Mock Data ──────────────────────────────────────────────── */

// Generate 30 days of past data + 7 days of future data
function generateForecastData() {
    const data = [];
    const start = new Date("2026-03-12");
    let value = 1500;

    // Past data (30 days)
    for (let i = 0; i <= 30; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = d.toLocaleString("default", { month: "short", day: "numeric" });

        value = Math.max(800, value + (Math.random() - 0.4) * 300);

        data.push({
            date: dateStr,
            isFuture: false,
            actual: Math.round(value),
            predicted: i === 30 ? Math.round(value) : null, // connect the line
            lower_bound: null,
            upper_bound: null
        });
    }

    // Prediction data (7 days)
    let predValue = value;
    for (let i = 1; i <= 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + 30 + i);
        const dateStr = d.toLocaleString("default", { month: "short", day: "numeric" });

        // Simulate an upcoming spike in the prediction
        let growth = (Math.random() - 0.2) * 200;
        if (i === 3 || i === 4) growth += 1200;

        predValue = Math.max(800, predValue + growth);

        data.push({
            date: dateStr,
            isFuture: true,
            actual: null,
            predicted: Math.round(predValue),
            lower_bound: Math.max(400, Math.round(predValue - 400 - (i * 100))),
            upper_bound: Math.round(predValue + 500 + (i * 150))
        });
    }

    return data;
}

const FORECAST_DATA = generateForecastData();

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
                        Expected Range: <br /> {data.lower_bound?.toLocaleString()} - {data.upper_bound?.toLocaleString()}
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

export default function PredictionPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center">

                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-2xl font-medium text-gray-900 mb-3">
                        Trend Forecasting
                    </h1>
                    <p className="text-gray-500 text-sm max-w-lg mx-auto">
                        Our predictive model analyzes historical patterns to forecast activity for the next 7 days.
                    </p>
                </div>

                {/* RIsk Indicator */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl px-6 py-4 flex items-center gap-4 mb-10 shadow-sm w-full max-w-3xl">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h2 className="text-base font-semibold text-gray-900">High chance of spike</h2>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                                Predicted
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">
                            The model expects a significant increase in engagement within the next 3-4 days based on current trajectory momentum.
                        </p>
                    </div>
                </div>

                {/* Graph Section */}
                <div className="w-full max-w-4xl bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

                    <div className="flex items-center justify-between mb-8 px-2">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Engagement Forecast</h3>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-0.5 bg-gray-400 rounded-full" />
                                <span>Historical</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-0.5 bg-indigo-600 rounded-full border border-indigo-600 border-dashed" />
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
                            <ComposedChart data={FORECAST_DATA} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="predictionArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#818cf8" stopOpacity={0.15} />
                                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                                    axisLine={{ stroke: "#e2e8f0" }}
                                    tickLine={false}
                                    minTickGap={20}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={60}
                                />

                                <Tooltip content={<ForecastTooltip />} />

                                {/* Shaded area for the future region background */}
                                <ReferenceArea
                                    x1={FORECAST_DATA[30].date}
                                    x2={FORECAST_DATA[37].date}
                                    fill="#f8fafc"
                                    fillOpacity={1}
                                />

                                {/* Confidence bound area */}
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

                                {/* Historical Line */}
                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    stroke="#94a3b8"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, fill: "#fff", stroke: "#94a3b8", strokeWidth: 2 }}
                                />

                                {/* Prediction Line */}
                                <Line
                                    type="monotone"
                                    dataKey="predicted"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    dot={false}
                                    activeDot={{ r: 4, fill: "#fff", stroke: "#6366f1", strokeWidth: 2 }}
                                />

                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
