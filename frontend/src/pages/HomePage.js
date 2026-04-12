import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function HomePage() {
  const [inputType, setInputType] = useState("username");
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    let payload = null;
    let url = "http://localhost:5000/api/analyze";
    let options = { method: "POST" };

    try {
      if (inputType === "username" || inputType === "url") {
        if (!inputValue) {
          alert("Please enter a value.");
          setIsAnalyzing(false);
          return;
        }
        options.headers = { "Content-Type": "application/json" };
        payload = JSON.stringify({
          type: inputType,
          value: inputValue,
          sample_size: 50,
        });
        options.body = payload;
      } else if (inputType === "csv" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        options.body = formData;
      } else {
        alert("Please provide the required input.");
        setIsAnalyzing(false);
        return;
      }

      console.log("Starting analysis with payload type:", inputType);

      const response = await fetch(url, options);
      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("analysisData", JSON.stringify(data));
        navigate("/dashboard");
      } else {
        alert(data.error || "Analysis failed.");
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Error connecting to backend:", error);
      alert("Failed to connect to the backend server. Is it running?");
      setIsAnalyzing(false);
    }
  };

  const recentScans = [
    { target: "@tech_insider", type: "username", status: "Completed", time: "2m ago" },
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
                  {["username", "url", "csv"].map((type) => (
                    <button
                      key={type}
                      className={`px-5 py-2 text-xs font-medium rounded-md transition-all duration-200 ${inputType === type
                        ? "bg-zinc-800 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                        }`}
                      onClick={() => setInputType(type)}
                    >
                      {type === "username" ? "Account" : type === "url" ? "URL" : "File Upload"}
                    </button>
                  ))}
                </div>
              </div>

              {(inputType === "username" || inputType === "url") && (
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-2">TARGET_IDENTITY</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                    placeholder={inputType === "username" ? "@username or target ID" : "https://..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
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
                        <span className="font-medium text-indigo-400 flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          {selectedFile.name}
                        </span>
                      ) : (
                        <span className="flex flex-col items-center gap-3">
                          <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          <span>Upload a CSV file containing <code className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-xs text-zinc-300 border border-white/5 font-mono">timestamp</code> and <code className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-xs text-zinc-300 border border-white/5 font-mono">value</code> cols.</span>
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing || (inputType === "csv" && !selectedFile) || (inputType !== "csv" && !inputValue)}
                  className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] border border-indigo-500/50"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
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
            <span className="flex items-center gap-2 font-mono text-emerald-400 text-xs border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 rounded-md glow-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ONLINE
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
