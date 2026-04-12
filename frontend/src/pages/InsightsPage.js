import React, { memo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Microscope, 
  Activity, 
  Zap, 
  Search, 
  Brain,
  ShieldAlert,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { getResults } from "../services/api";

function legacyFromAnomalies(anomalies) {
  if (!anomalies?.length) return [];
  return anomalies
    .filter((a) => a.ai_insight)
    .map((a, index) => ({
      kind: "anomaly",
      id: `ins_${index}`,
      date: a.date,
      metric: a.metric,
      anomaly_type: a.type,
      severity: a.severity || (Math.abs(a.z_score) > 3 ? "critical" : "medium"),
      classification: a.ai_insight.type,
      cause: a.ai_insight.cause,
      explanation: a.ai_insight.explanation || a.ai_insight.cause,
      impact: a.ai_insight.impact || "",
      recommendation: a.ai_insight.recommendation || "",
      confidence: a.ai_insight.confidence || "low",
      zScore: a.z_score,
    }));
}

/**
 * Neural Diagnostics — v5.1 (Elite SaaS Edition)
 * Fixed: Potential render loops by stabilizing effect dependencies.
 */
export default function InsightsPage() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    
    const processResult = (result) => {
      if (result.status !== "ok") {
        setLoading(false);
        return;
      }
      if (Array.isArray(result.insights) && result.insights.length > 0) {
        setInsights(
          result.insights.map((c, i) => ({ ...c, id: c.id || `card_${i}` }))
        );
      } else {
        setInsights(legacyFromAnomalies(result.anomalies));
      }
      setLoading(false);
      hasFetched.current = true;
    };

    const cached = sessionStorage.getItem("analysisData");
    if (cached) {
      try { 
        processResult(JSON.parse(cached)); 
      } catch (e) { }
    }

    getResults()
      .then(processResult)
      .catch(() => setLoading(false));
      
  }, []); 

  const fmtDate = (d) => {
    if (!d) return "Current Cycle";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).toUpperCase();
    } catch { return d; }
  };

  return (
    <div className="page-shell">
      <div className="page-container flex flex-col">
        
        {/* Header — Forensic Style */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-14 border-b border-white/5 pb-10 text-center md:text-left relative"
        >
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <Brain className="w-80 h-80" />
            </div>
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">Neural Diagnostics</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
                <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 bg-indigo-500/10 px-5 py-2.5 rounded-full border border-indigo-500/20 shadow-lg">
                    <Sparkles className="w-3.4 h-3.4" /> AI Trace Engine Active
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
                    Determining Causal Variables
                </span>
            </div>
        </motion.div>

        {/* Insights Grid */}
        <div className="space-y-8 pb-28">
          {loading ? (
            <div className="flex flex-col items-center py-40">
                <div className="w-12 h-12 border-b-2 border-indigo-600 rounded-full animate-spin mb-8" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700 animate-pulse">Synthesizing Neural Logs</p>
            </div>
          ) : insights.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="glass-card rounded-[3rem] p-24 text-center border-dashed border-white/5"
            >
              <Info className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">No diagnostic trace available in current manifold</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:gap-8">
              {insights.map((insight, idx) => (
                <InsightCard key={insight.id} insight={insight} index={idx} fmtDate={fmtDate} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const InsightCard = memo(function InsightCard({ insight, index, fmtDate }) {
  const isResearch = insight.kind === "research";
  
  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.015, 0.09), duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={`glass-card rounded-[3rem] overflow-hidden border-white/[0.05] relative group interactive-fast hover:border-indigo-500/20`}
    >
        <div className="flex flex-col md:flex-row h-full">
            
            <div className={`w-full md:w-72 p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative bg-white/[0.01]`}>
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isResearch ? "bg-indigo-500/20 text-indigo-400" : "bg-purple-500/20 text-purple-400"}`}>
                            {isResearch ? <Microscope className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
                           {isResearch ? "Forensics" : "Anomaly"}
                        </span>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Timeline</p>
                            <p className="text-xs font-black text-white font-mono">{fmtDate(insight.date)}</p>
                        </div>
                        {!isResearch && (
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Vector Sensitivity</p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xl font-black font-mono ${insight.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
                                        {Math.abs(insight.zScore || 0).toFixed(1)}σ
                                    </span>
                                    {insight.anomaly_type === 'spike' ? <TrendingUp className="w-4 h-4 text-red-500" /> : <TrendingDown className="w-4 h-4 text-indigo-500" />}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Confidence</span>
                        <span className="text-[10px] font-black text-indigo-500 font-mono uppercase">Full Trace</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-10 md:p-14 bg-black/20 flex flex-col justify-between">
                <div>
                   <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8 leading-tight">
                        {insight.title || (isResearch ? "Research Manifest" : `Spike Detection in ${insight.metric}`)}
                   </h3>
                   
                   <div className="relative mb-10">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/30 rounded-full" />
                        <div className="pl-8">
                            <p className="text-lg text-zinc-300 leading-relaxed italic font-medium">
                                "{insight.summary || insight.cause || insight.explanation}"
                            </p>
                        </div>
                   </div>

                   {insight.impact && (
                       <div className="mb-8 p-6 bg-red-500/[0.03] border border-red-500/10 rounded-3xl">
                           <p className="text-xs text-red-400 font-medium leading-relaxed">
                                <span className="text-[9px] font-black uppercase tracking-widest mr-4 opacity-50 underline decoration-red-500/30 underline-offset-4">Impact Profile</span>
                                {insight.impact}
                           </p>
                       </div>
                   )}
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                    <p className="text-xs text-zinc-500 font-medium italic">
                        Final Neural Classification: <span className="text-indigo-400 font-bold">{insight.classification || "ANOMALY"}</span>
                    </p>
                    <button className="flex items-center gap-3 text-[10px] font-black text-white uppercase tracking-[0.2em] group/btn interactive-fast">
                        Pivot To Investigation
                        <ChevronRight className="w-4 h-4 text-indigo-500 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

        </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.insight.id === nextProps.insight.id && prevProps.index === nextProps.index;
});
