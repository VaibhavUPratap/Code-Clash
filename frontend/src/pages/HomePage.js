import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { analyzeData } from "../services/api";
import { Check, CloudUpload, Loader2 } from "lucide-react";

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
        if (!selectedFile) {
          setError("Please select a CSV file.");
          setIsAnalyzing(false);
          return;
        }
        data = await analyzeData({ file: selectedFile });
      } else if (inputType === "url") {
        if (!inputValue.trim()) {
          setError("Please enter a URL.");
          setIsAnalyzing(false);
          return;
        }
        const handle = inputValue.trim();
        data = await analyzeData({ source: "url", handle });
      } else {
        // "sample" or default
        data = await analyzeData({ source: "sample" });
      }

      // Cache result for dashboard & child pages
      sessionStorage.setItem("analysisData", JSON.stringify(data));
      navigate("/dashboard");
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to connect to the backend. Is the Flask server running?");
      setIsAnalyzing(false);
    }
  };

  const recentScans = [
    { target: "https://reddit.com/r/tech", type: "url", status: "Completed", time: "2m ago" },
    { target: "trending_dataset.csv", type: "csv", status: "Failed", time: "1hr ago" },
    { target: "https://twitter.com/elonmusk...", type: "url", status: "Completed", time: "3hrs ago" },
  ];

  return (
    <div className="flex-1 p-6 md:p-10 w-full xl:max-w-6xl mx-auto flex flex-col justify-center min-h-[90vh]">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl lg:text-4xl font-semibold text-zinc-100 tracking-tight drop-shadow-sm">Initialize Sequence</h1>
        <p className="text-sm font-mono text-zinc-500 mt-3 max-w-2xl">
          Connect to target data streams. Provide a platform identity, direct URL, or push a local historical dataset to the anomaly engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Col: Setup Form */}
        <div className="col-span-2 space-y-6 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl opacity-30 pointer-events-none rounded-3xl" />

          <div className="glass-panel rounded-2xl p-6 md:p-8 relative">
            <h2 className="text-[11px] font-semibold text-indigo-400 mb-6 uppercase tracking-[0.2em]">Target Configuration</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-2">SOURCE_TYPE</label>
                <div className="flex border border-white/10 rounded-lg overflow-hidden w-fit bg-zinc-950/50 p-1 gap-1">
                  {["url", "csv", "sample"].map((type) => (
                    <button
                      key={type}
                      className={`px-5 py-2 text-xs font-medium rounded-md transition-all duration-200 ${inputType === type
                        ? "bg-zinc-800 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                        }`}
                      onClick={() => setInputType(type)}
                    >
                      {type === "url" ? "URL" : type === "csv" ? "File Upload" : "Sample"}
                    </button>
                  ))}
                </div>
              </div>

              {inputType === "url" && (
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-2">TARGET_IDENTITY</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                    placeholder="https://twitter.com/..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStartAnalysis()}
                  />
                </div>
              )}

              {inputType === "csv" && (
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-2">LOCAL_DATASET</label>
                  <div className="border border-dashed border-white/10 hover:border-indigo-500/30 rounded-lg px-6 py-10 text-center bg-zinc-950/30 transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
                    <input
                      type="file"
                      id="dataset-upload"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                    <label htmlFor="dataset-upload" className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                      {selectedFile ? (
                        <span className="font-medium text-indigo-400 flex items-center justify-center gap-2 group">
                          <Check className="w-5 h-5 text-indigo-400 group-hover:scale-110 group-hover:text-indigo-300 transition-all duration-300" />
                          {selectedFile.name}
                        </span>
                      ) : (
                        <span className="flex flex-col items-center gap-3 group">
                          <CloudUpload className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400 group-hover:-translate-y-1 transition-all duration-300" />
                          <span className="group-hover:text-zinc-300 transition-colors">Upload a CSV file with <code className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-xs text-zinc-300 border border-white/5 font-mono">date, likes, comments, shares, posts</code> columns.</span>
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {inputType === "sample" && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-5 py-4 text-xs font-mono text-indigo-300">
                  <span className="font-bold text-indigo-400 mr-2">&gt;_</span>
                  Using bundled sample dataset — no credentials required.
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-xs font-mono text-red-400">
                  <span className="font-bold mr-2">ERROR:</span>{error}
                </div>
              )}

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing || (inputType === "csv" && !selectedFile) || (inputType === "url" && !inputValue)}
                  className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] border border-indigo-500/50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 text-white" />
                      ENGAGING...
                    </>
                  ) : (
                    "LAUNCH SEQUENCE"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Minimal List */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-5 border border-white/5">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-4">Scan History</h3>
            <div className="space-y-1">
              {recentScans.map((scan, idx) => (
                <div key={idx} className="group p-3 rounded-lg flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-300 truncate group-hover:text-amber-100 transition-colors">{scan.target}</p>
                    <p className="text-[10px] uppercase font-mono text-zinc-600 mt-1">{scan.type}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className={`text-[10px] font-medium inline-block px-1.5 py-0.5 rounded border uppercase tracking-wider ${scan.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {scan.status}
                    </span>
                    <span className="text-xs text-zinc-600 font-mono mt-1.5">{scan.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/dashboard" className="text-xs text-zinc-500 hover:text-indigo-400 font-mono inline-flex items-center gap-1 mt-4 transition-colors px-3">
              View all records &rarr;
            </Link>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between shadow-lg">
            <div>
              <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Engine Status</h3>
              <span className="text-xs font-mono text-zinc-400">Main cluster</span>
            </div>
            <span className="flex items-center gap-2 font-mono text-emerald-400 text-xs border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ONLINE
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
