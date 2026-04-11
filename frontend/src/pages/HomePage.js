import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

/* ─── HomePage ───────────────────────────────────────────────── */

export default function HomePage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) setFile(droppedFile);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
              Detect Viral Trends{" "}
              <span className="text-indigo-600">Before They Happen</span>
            </h1>
            <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-md">
              Analyze social media patterns and uncover hidden spikes using
              intelligent detection.
            </p>
            <button
              onClick={() => {
                const el = document.getElementById("input-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-8 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Analyze Now
            </button>
          </div>

          {/* Right – abstract graph */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-50 rounded-2xl -rotate-2 scale-105" />
              <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <svg viewBox="0 0 420 200" fill="none" className="w-full">
                  {/* Grid */}
                  {[40, 80, 120, 160].map((y) => (
                    <line key={y} x1="30" y1={y} x2="400" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  ))}
                  {/* Area */}
                  <path
                    d="M30,160 60,148 90,152 120,140 150,130 180,95 210,110 240,80 270,105 300,65 330,90 360,85 390,70 390,180 30,180Z"
                    fill="url(#heroArea)"
                  />
                  {/* Line */}
                  <polyline
                    points="30,160 60,148 90,152 120,140 150,130 180,95 210,110 240,80 270,105 300,65 330,90 360,85 390,70"
                    stroke="#6366f1"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Anomaly markers */}
                  <circle cx="240" cy="80" r="5" fill="#ef4444" />
                  <circle cx="240" cy="80" r="10" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.4" />
                  <circle cx="300" cy="65" r="5" fill="#ef4444" />
                  <circle cx="300" cy="65" r="10" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.4" />
                  {/* Normal dots */}
                  {[[30, 160], [90, 152], [150, 130], [210, 110], [360, 85], [390, 70]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" />
                  ))}
                  <defs>
                    <linearGradient id="heroArea" x1="200" y1="60" x2="200" y2="180">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Engagement</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Anomaly</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Input Section ────────────────────────────────────── */}
      <section id="input-section" className="bg-gray-50 py-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-1">
              Start Your Analysis
            </h2>
            <p className="text-sm text-gray-400 text-center mb-8">
              Upload your dataset or analyze activity instantly
            </p>

            {/* Username */}
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Username <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. @johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />

            {/* File upload */}
            <label className="block text-sm font-medium text-gray-700 mt-6 mb-1.5">
              CSV File
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver
                  ? "border-indigo-400 bg-indigo-50/50"
                  : "border-gray-200 hover:border-gray-300"
                }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              {file ? (
                <p className="text-sm text-indigo-600 font-medium">{file.name}</p>
              ) : (
                <p className="text-sm text-gray-400">
                  Drag & drop a CSV file here, or <span className="text-indigo-500 font-medium">browse</span>
                </p>
              )}
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full mt-6 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start Analysis
            </button>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-14">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gray-200" />

          {STEPS.map(({ step, icon, title, desc }) => (
            <div key={step} className="text-center relative">
              <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 relative z-10">
                {icon}
              </div>
              <span className="inline-block text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">
                Step {step}
              </span>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            What You Get
          </h2>
          <p className="text-sm text-gray-500 text-center mb-14 max-w-md mx-auto">
            Built for developers and analysts who need clarity in noisy social data.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  {icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-gray-900">Trend Anomaly Finder</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            AI-powered anomaly detection for social media trends. Built for
            clarity in noisy data.
          </p>
          <p className="text-xs text-gray-300 mt-4">
            © {new Date().getFullYear()} Trend Anomaly Finder
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────────── */

const STEPS = [
  {
    step: 1,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    title: "Upload Data",
    desc: "Drop a CSV or enter a username to pull activity.",
  },
  {
    step: 2,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    title: "Process Patterns",
    desc: "Our engine runs statistical and ML-based analysis.",
  },
  {
    step: 3,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    title: "View Insights",
    desc: "See anomalies, spikes, and root-cause breakdowns.",
  },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Spike Detection",
    desc: "Identify sudden surges in engagement using Z-score and IQR-based statistical methods.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    title: "Bot Activity Detection",
    desc: "Flag suspicious patterns that suggest coordinated inauthentic behavior or automated posting.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    title: "Trend Prediction",
    desc: "Forecast upcoming spikes in activity based on historical patterns and time-series models.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
    title: "Smart Alerts",
    desc: "Get notified when anomalies cross severity thresholds so you can respond quickly.",
  },
];
