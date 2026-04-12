import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { analyzeData } from "../services/api";
import { 
  Check, 
  CloudUpload, 
  Loader2, 
  Zap, 
  Search, 
  Activity, 
  BarChart3, 
  ShieldCheck,
  ChevronRight,
  Database,
  Globe
} from "lucide-react";

const STATS = [
  { label: "Active Nodes", value: "2,481", icon: Activity, color: "text-indigo-400" },
  { label: "Anomalies Caught", value: "142k", icon: BarChart3, color: "text-purple-400" },
  { label: "Integrity Checks", value: "99.9%", icon: ShieldCheck, color: "text-emerald-400" },
];

export default function HomePage() {
  const [inputType, setInputType] = useState("url");
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleStartAnalysis = async () => {
    setError("");
    setIsAnalyzing(true);

    try {
      let data;
      if (inputType === "csv") {
        if (!selectedFile) throw new Error("Please select a CSV file.");
        data = await analyzeData({ file: selectedFile });
      } else if (inputType === "url") {
        if (!inputValue.trim()) throw new Error("Please enter a target URL.");
        data = await analyzeData({ source: "url", handle: inputValue.trim() });
      } else {
        data = await analyzeData({ source: "sample" });
      }

      sessionStorage.setItem("analysisData", JSON.stringify(data));
      setIsAnalyzing(false);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to engage system clusters.");
      setIsAnalyzing(false);
    }
  };

  const recentScans = [
    { target: "https://x.com/Cristiano", type: "social", status: "Success", time: "2m ago" },
    { target: "bot_fingerprint_01.csv", type: "dataset", status: "Analyzed", time: "1hr ago" },
    { target: "r/worldnews/spike_data", type: "stream", status: "Success", time: "3hrs ago" },
  ];

  return (
    <div className="page-shell">
      <div className="page-container-wide flex flex-col items-center justify-start">
      
      {/* Hero Section — High Impact */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl text-center mb-16 relative"
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-8 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            Intelligence v4.0
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter mb-8 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic uppercase">
          Detect Trends <br />
          <span className="text-indigo-500">Before They Explode</span>
        </h1>
        
        <p className="text-lg text-zinc-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Harness autonomous anomaly detection and crisis forensics. Identify bot activity, engagement spikes, and viral drivers with elite precision.
        </p>
      </motion.div>

      {/* Main Analysis Engine */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-start transition duration-200">
        
        {/* Input Control Center */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.04, duration: 0.2 }}
           className="lg:col-span-8 relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[2.5rem] blur-2xl opacity-30 pointer-events-none"></div>
          
          <div className="relative glass-card rounded-[2.5rem] p-4 md:p-10 border-white/[0.05]">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-6">
                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                {["url", "csv", "sample"].map((type) => (
                    <button
                        key={type}
                        onClick={() => setInputType(type)}
                    className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl interactive-fast ${
                            inputType === type ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-300"
                        }`}
                    >
                        {type}
                    </button>
                ))}
                </div>
                <div className="flex items-center gap-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                    <Globe className="w-4 h-4 text-indigo-500/50" />
                    Multi-Stream Support
                </div>
            </div>

            <div className="space-y-8">
              {inputType === "url" && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Search className="w-6 h-6 text-zinc-700 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStartAnalysis()}
                    placeholder="Capture target ID or URL..."
                    className="w-full pl-16 pr-8 py-7 bg-black/40 border border-white/5 rounded-3xl text-lg font-bold text-white placeholder-zinc-800 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/40 transition duration-150 shadow-inner"
                  />
                  <div className="absolute right-4 inset-y-4 flex">
                     <button
                        onClick={handleStartAnalysis}
                        disabled={isAnalyzing || !inputValue}
                        className="px-8 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl interactive-fast shadow-md shadow-indigo-600/20 disabled:opacity-50"
                     >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Engage"}
                     </button>
                  </div>
                </div>
              )}

              {inputType === "csv" && (
                <div className="group relative">
                  <input
                    type="file"
                    id="csv-file"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                  <label 
                    htmlFor="csv-file"
                    className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-white/5 rounded-[3rem] bg-black/30 cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-500/[0.02] interactive-fast group"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        {selectedFile ? <Check className="w-8 h-8 text-emerald-400" /> : <CloudUpload className="w-8 h-8 text-indigo-400" />}
                    </div>
                    <span className="text-sm font-bold text-zinc-400 group-hover:text-zinc-200">
                      {selectedFile ? selectedFile.name : "Secure CSV Ingestion Layer"}
                    </span>
                    {!selectedFile && <span className="text-[10px] text-zinc-700 mt-2 font-mono">Accepts Date, Engagement, Activity metrics</span>}
                  </label>
                  {selectedFile && (
                      <button 
                        onClick={handleStartAnalysis} 
                        className="w-full mt-6 py-5 bg-indigo-600 rounded-[2rem] text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-500 shadow-md interactive-fast"
                      >
                         Analyze Dataset
                      </button>
                  )}
                </div>
              )}

              {inputType === "sample" && (
                <div className="p-12 border border-white/5 bg-indigo-500/[0.03] rounded-[3rem] text-center">
                    <Database className="w-12 h-12 text-indigo-500/40 mx-auto mb-6" />
                    <p className="text-zinc-400 text-sm font-medium mb-8">Deploying isolated benchmark dataset (Global Social Trends v2.1)</p>
                    <button 
                         onClick={handleStartAnalysis}
                        className="px-12 py-5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-[2rem] hover:bg-indigo-500 interactive-fast shadow-md shadow-indigo-500/20"
                    >
                         Initialize Demo
                    </button>
                </div>
              )}
              
              {error && <p className="text-center text-red-500 text-[10px] font-black uppercase tracking-wider bg-red-500/5 py-4 rounded-2xl">{error}</p>}
            </div>
          </div>
        </motion.div>

        {/* Sidebar Intel */}
        <div className="lg:col-span-4 space-y-10 group">
            
            {/* Real-time Stats */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06, duration: 0.2 }}
                className="grid grid-cols-1 gap-4"
            >
                {STATS.map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-3xl border border-white/5 flex items-center gap-6 hover:bg-white/[0.02] transition-colors overflow-hidden relative">
                         <div className={`p-4 rounded-2xl bg-zinc-900/50 ${stat.color} shadow-inner`}>
                            <stat.icon className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-xl font-black text-white">{stat.value}</p>
                         </div>
                         <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03]">
                            <stat.icon className="w-24 h-24" />
                         </div>
                    </div>
                ))}
            </motion.div>

            {/* Recent Scans */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.09, duration: 0.2 }}
              className="glass-card p-8 rounded-[2.5rem] border border-white/5 shadow-lg"
            >
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Scan Feed</h3>
                    <Link to="/dashboard" className="p-2 bg-white/5 rounded-lg hover:bg-indigo-500/20 transition-colors">
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </Link>
                </div>
                <div className="space-y-6">
                    {recentScans.map((scan, i) => (
                        <div key={i} className="flex items-center justify-between group/scan cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover/scan:scale-150 transition-transform" />
                                <div>
                                    <p className="text-xs font-black text-zinc-200 group-hover/scan:text-white transition-colors truncate max-w-[140px]">{scan.target}</p>
                                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{scan.type}</p>
                                </div>
                            </div>
                            <span className="text-[9px] font-bold text-zinc-700 italic">{scan.time}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

        </div>

      </div>

      {/* Background Animated Assets */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[200px] opacity-30 select-none pointer-events-none z-[-1]" />
      </div>
    </div>
  );
}
