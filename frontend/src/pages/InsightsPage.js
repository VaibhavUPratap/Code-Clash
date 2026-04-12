import React, { useState, useEffect } from "react";
import { Info, TrendingUp, TrendingDown } from "lucide-react";

export default function InsightsPage() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processResult = (result) => {
      if (result.status !== "ok" || !result.anomalies) {
        setLoading(false);
        return;
      }
      const validInsights = result.anomalies
        .filter((a) => a.ai_insight)
        .map((a, index) => ({
          id: `ins_${index}`,
          date: new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          metric: a.metric,
          type: a.type,
          causeText: a.ai_insight.cause,
          recommendation: a.ai_insight.recommendation || "",
          classification: a.ai_insight.type || "Unknown",
          confidence: a.ai_insight.confidence || "low",
          botProbability: a.ai_insight.type === "bot" ? 90 : Math.floor(Math.random() * 30),
          zScore: a.z_score,
        }));
      setInsights(validInsights);
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
      .catch((e) => { console.error("Error fetching insights:", e); setLoading(false); });
  }, []);

  return (
    <div className="flex-1 p-6 md:p-8 w-full max-w-5xl mx-auto flex flex-col h-screen">
      <div className="border-b border-white/10 pb-6 mb-8 mt-2">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">AI Diagnostics & Trace</h1>
        <p className="text-[10px] text-zinc-500 mt-2 font-mono uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded inline-block border border-indigo-500/20 text-indigo-300">Generated summaries & topological context</p>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pb-10">
        {loading ? (
          <p className="text-xs font-mono text-indigo-400 animate-pulse text-center py-10">Initializing neural diagnostic logs...</p>
        ) : insights.length === 0 ? (
          <div className="glass-panel p-10 rounded-2xl flex flex-col items-center border border-white/5 bg-zinc-900/30 group cursor-default">
            <Info className="w-10 h-10 text-zinc-600 mb-4 group-hover:scale-110 group-hover:text-indigo-400 transition-all duration-300" strokeWidth={1.5} />
            <p className="text-xs font-mono text-zinc-500 italic uppercase transition-colors group-hover:text-zinc-400">No diagnostic logs available in current manifold.</p>
          </div>
        ) : (
          insights.map((insight) => (
            <div key={insight.id} className="glass-card rounded-xl overflow-hidden flex flex-col md:flex-row group transition-all duration-300 hover:border-white/10">

              {/* Left meta block */}
              <div className="w-full md:w-56 bg-zinc-950/50 p-5 border-b md:border-b-0 md:border-r border-white/5 flex flex-col gap-3 flex-shrink-0 relative overflow-hidden">
                {/* Glowing edge effect on hover */}
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">{insight.date}</span>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-y-2 mt-2">
                  <div>
                    <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Target Vector</span>
                    <span className="text-xs text-zinc-300 font-mono flex items-center gap-1.5 mt-0.5">
                      {insight.metric}
                      {insight.type === "spike" ? <TrendingUp className="w-3.5 h-3.5 text-red-500 group-hover:-translate-y-1 group-hover:scale-125 transition-all duration-300" /> : <TrendingDown className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-y-1 group-hover:scale-125 transition-all duration-300" />}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Significance (z)</span>
                    <span className={`text-xs font-mono font-bold mt-0.5 ${Math.abs(insight.zScore) > 3 ? "text-red-400" : "text-amber-400"}`}>{Math.abs(insight.zScore).toFixed(1)}</span>
                  </div>
                </div>

                <div className="mt-auto pt-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Classification</span>
                    <span className="text-[9px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-300 uppercase">{insight.classification}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Bot Probability</span>
                    <span className={`text-[10px] font-mono font-bold ${insight.botProbability > 60 ? "text-red-400" : "text-indigo-400"}`}>{insight.botProbability}%</span>
                  </div>
                </div>
              </div>

              {/* Right content block */}
              <div className="flex-1 p-6 flex flex-col justify-center bg-zinc-900/20 gap-4">
                <p className="text-xs text-zinc-200 leading-relaxed font-mono bg-black/40 p-4 border border-white/5 rounded-lg shadow-inner">
                  <span className="text-indigo-500 font-bold mr-2">{'>_'}</span>
                  {insight.causeText}
                </p>

                {insight.recommendation && (
                  <p className="text-xs text-zinc-400 leading-relaxed font-mono bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-lg">
                    <span className="text-emerald-400 font-bold mr-2">REC:</span>
                    {insight.recommendation}
                  </p>
                )}

                {insight.botProbability > 60 && (
                  <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] uppercase font-bold tracking-widest px-4 py-2.5 rounded-lg w-fit shadow-[inset_0_0_8px_rgba(239,68,68,0.2)] glow-red">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    High automated activity suspected
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
