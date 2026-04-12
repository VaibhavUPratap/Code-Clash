import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Loader2, 
  AlertTriangle, 
  TrendingUp, 
  Tag, 
  Link as LinkIcon, 
  Shield,
  CheckCircle,
  ExternalLink,
  Zap,
  Activity,
  ChevronRight,
  Brain,
  Sparkles,
  Fingerprint,
  Mic
} from "lucide-react";
import { researchLink, getResults } from "../services/api";

/**
 * Root Cause Lab — v5.2 (Final Stabilization)
 * Fixed: Re-render loop by using stable refs for the initial trigger.
 */
export default function DeepResearchPage() {
  const [inputValue, setInputValue] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [executionLog, setExecutionLog] = useState([]);
  
  // Stable tracking for the auto-start process
  const triggerRegistry = useRef({ autoStarted: false, hasInitialData: false });

  const addLog = useCallback((msg) => {
    setExecutionLog(prev => [...prev.slice(-4), msg]);
  }, []);

  const handleAnalyze = useCallback(async (forcedUrl = null) => {
    const rawInput = forcedUrl || inputValue;
    const raw = (rawInput || "").trim();
    
    if (!raw) {
      setError("No target URL detected for causal forensics.");
      return;
    }

    const normalized = raw.includes("://") ? raw : `https://${raw}`;
    
    setLoading(true);
    setError("");
    setExecutionLog(["Initializing Neural Forensic Link..."]);
    
    try {
      const cached = sessionStorage.getItem("analysisData");
      const sessionData = cached ? JSON.parse(cached) : null;
      const anomalies = sessionData?.anomalies || [];
      const candidateContext = anomalies.find(a => a.severity === 'critical') || anomalies[0];
      
      setTimeout(() => addLog("Mapping social entity footprint..."), 400);
      setTimeout(() => addLog("Cross-referencing anomaly manifold..."), 800);
      
      const payload = await researchLink(normalized, candidateContext);
      
      if (payload.status !== "ok") {
        setError(payload.message || "Root cause laboratory analysis failed.");
        return;
      }
      
      if (!payload.research?.metadata?.fetched) {
        addLog("Primary crawl restricted. Engaging AI Synthesis...");
      } else {
        addLog("Success. Synthesizing causal variables...");
      }

      setReport(payload.research);
      setInputValue(payload.research?.url || normalized);
      
      const current = JSON.parse(sessionStorage.getItem("analysisData") || "{}");
      sessionStorage.setItem("analysisData", JSON.stringify({ ...current, research: payload.research }));
      
    } catch (e) {
      setError(e.message || "Failed to establish secure forensics link.");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  }, [inputValue, addLog]);

  // Consolidated stable initialization
  useEffect(() => {
    if (triggerRegistry.current.autoStarted) return;

    const initialize = async () => {
        let data = null;
        const cached = sessionStorage.getItem("analysisData");
        
        if (cached) {
            try { data = JSON.parse(cached); } catch (e) {}
        }
        
        if (!data) {
            try { data = await getResults(); } catch (e) {}
        }

        if (data) {
            setDashboardData(data);
            const rep = data.research || data.link_research;
            const targetUrl = data.research_url || data.url;

            if (targetUrl && !rep && !triggerRegistry.current.autoStarted) {
                triggerRegistry.current.autoStarted = true;
                setInputValue(targetUrl);
                handleAnalyze(targetUrl);
            } else if (rep) {
                setReport(rep);
                setInputValue(rep.url || "");
                triggerRegistry.current.autoStarted = true;
            }
        }
    };

    initialize();
    
  }, []); // Strictly mount-only

  const correlatedAnomaly = useMemo(() => {
    if (!dashboardData?.anomalies || !report) return null;
    let reportDate = null;
    try {
      if (report.generated_at) {
        const d = new Date(report.generated_at);
        if (!isNaN(d.getTime())) reportDate = d.toISOString().split('T')[0];
      }
    } catch (e) {}
    return dashboardData.anomalies.find(a => a.date === reportDate) || 
           dashboardData.anomalies.find(a => a.severity === 'critical') ||
           dashboardData.anomalies[0];
  }, [dashboardData, report]);

  const assessment = report?.assessment || {};
  const score = report?.virality?.score ?? assessment.score ?? 0;
  const isSynthesized = !report?.metadata?.fetched || report?.research_mode === 'gemini';

  return (
    <div className="flex-1 min-h-full bg-[#030303] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto px-8 md:px-16 py-12 lg:py-24">
        
        <motion.header 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20 flex flex-col md:flex-row md:items-baseline justify-between gap-10 border-b border-white/5 pb-10"
        >
          <div>
            <div className="flex items-center gap-6 mb-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.2)] relative overflow-hidden group">
                <Brain className="w-8 h-8 text-indigo-400 relative z-10" />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tight text-white uppercase italic leading-none">Root Cause Lab</h1>
                <div className="flex items-center gap-4 mt-4">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/10">
                        Causal Intel
                    </span>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
                        Final Stable
                    </span>
                </div>
              </div>
            </div>
          </div>
          {report && (
            <div className={`px-6 py-3 rounded-full border text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 bg-white/[0.02] ${
              isSynthesized ? "border-amber-500/30 text-amber-400" : "border-emerald-500/30 text-emerald-400"
            }`}>
              <span className={`w-2 h-2 rounded-full animate-ping ${isSynthesized ? "bg-amber-400" : "bg-emerald-400"}`} />
              {isSynthesized ? "Neural Synthesis Active" : "Direct Analysis Live"}
            </div>
          )}
        </motion.header>

        <div className="relative mb-24 max-w-4xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-[3rem] blur-3xl opacity-20 pointer-events-none"></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-2.5 bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                <Fingerprint className="w-6 h-6 text-zinc-700" />
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                placeholder="Paste Post URL footprint for forensic mapping..."
                className="w-full pl-20 pr-6 py-8 bg-transparent text-white placeholder-zinc-800 focus:outline-none text-lg font-black italic tracking-tighter"
              />
            </div>
            <button
              onClick={() => handleAnalyze()}
              disabled={loading}
              className="px-14 py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 disabled:text-zinc-700 text-white font-black rounded-[2rem] transition-all flex items-center justify-center gap-4 shadow-xl shadow-indigo-600/20 uppercase tracking-[0.2em] text-[11px] group"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />}
              {loading ? "Forensics active" : "Map Root Cause"}
            </button>
          </motion.div>
          
          <AnimatePresence>
            {loading && executionLog.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-10 px-12 space-y-3"
                >
                    {executionLog.map((log, i) => (
                        <p key={i} className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-4 opacity-60">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            {log}
                        </p>
                    ))}
                </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex items-center gap-4 text-red-400 text-[10px] font-black uppercase tracking-widest px-10 py-5 bg-red-500/5 border border-red-500/10 rounded-[2rem]">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
            {!report && !loading ? (
            <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-40 glass-card rounded-[4rem] border border-dashed border-white/5"
            >
                <div className="w-24 h-24 rounded-full bg-zinc-900/50 flex items-center justify-center mb-10 border border-white/5">
                    <Search className="w-10 h-10 text-zinc-800" />
                </div>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em]">Awaiting Forensic Footprint</p>
            </motion.div>
            ) : (
            <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`space-y-10 transition-all duration-700 ${loading ? "opacity-20 blur-xl scale-[0.99]" : "opacity-100"}`}
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 p-12 md:p-14 glass-card rounded-[3rem] border-white/[0.05] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
                    <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-1000 pointer-events-none">
                        <Brain className="w-[500px] h-[500px]" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex flex-wrap items-center justify-between gap-6 mb-16">
                            <div className="flex items-center gap-6">
                                <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/10 shadow-xl">
                                    <Zap className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Causal Theory Identified</h3>
                                    <span className="text-[10px] font-black text-white bg-white/5 px-4 py-1.5 rounded-full border border-white/5 uppercase tracking-[0.2em]">{assessment.causal_category?.replace('_', ' ') || "Inferred"}</span>
                                </div>
                            </div>
                            
                            {report?.url_context?.handle && (
                                <div className="flex items-center gap-4 px-6 py-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full shadow-lg">
                                    <Mic className="w-4 h-4 text-indigo-400" />
                                    <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">@{report.url_context.handle}</span>
                                </div>
                            )}
                        </div>
                        
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-12 tracking-tighter italic uppercase text-shadow-glow">
                            {assessment.causal_hypothesis || "Determining Root Cause..."}
                        </h2>
                        
                        <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] backdrop-blur-xl group-hover:bg-white/[0.03] transition-all">
                            <p className="text-zinc-400 text-lg md:text-xl leading-relaxed italic font-medium">
                                "{assessment.summary || report?.metadata?.description || "Processing autonomous synthesis..."}"
                            </p>
                        </div>

                        {correlatedAnomaly && (
                            <div className="mt-16 pt-12 border-t border-white/5 flex items-start gap-8">
                                <Activity className="w-7 h-7 text-indigo-400" />
                                <div>
                                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Anomaly Manifold Correlation</p>
                                    <p className="text-zinc-200 text-lg italic font-bold border-l-4 border-indigo-500/40 pl-8">
                                        Confirmed mapping to <span className="text-indigo-400">{correlatedAnomaly.metric}</span> spike observed on {correlatedAnomaly.date}.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-12 md:p-16 glass-card rounded-[4rem] border-white/[0.05] flex flex-col justify-between relative overflow-hidden group text-center">
                    <h3 className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em] mb-16">Momentum DNA</h3>
                    <div className="relative">
                        <span className="text-[10rem] font-black text-white tracking-tighter italic leading-none">{Math.round(score)}</span>
                        <div className="h-4 w-full bg-white/5 rounded-full mt-10 overflow-hidden p-1">
                            <motion.div 
                                initial={{ width: 0 }} animate={{ width: `${score}%` }}
                                className="h-full bg-indigo-500 rounded-full"
                            />
                        </div>
                    </div>
                    <p className="text-2xl font-black italic uppercase tracking-tighter mt-12 text-indigo-400">{score >= 70 ? "CRITICAL SURGE" : "NOMINAL FLOW"}</p>
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <CardSection icon={Tag} title="Semantic Keywords" items={assessment.key_topics} />
                   <CardSection icon={Shield} title="Forensic Integrity" items={assessment.risk_signals} />
                </div>
            </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CardSection({ icon: Icon, title, items }) {
    return (
        <div className="p-16 glass-card rounded-[4rem] border-white/[0.05]">
            <h3 className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mb-12 flex items-center gap-4">
                <Icon className="w-5 h-5 text-indigo-500" /> {title}
            </h3>
            <div className="flex flex-wrap gap-4">
                {items?.map((item, i) => (
                    <span key={i} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400"># {item}</span>
                ))}
            </div>
        </div>
    );
}
