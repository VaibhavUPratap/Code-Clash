import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { researchLink, getResults } from "../services/api";

function buildTimeline(report) {
  const rows = new Map();

  const addRow = (dateKey, patch) => {
    if (!dateKey) return;
    const base = rows.get(dateKey) || { date: dateKey, newsMentions: 0, postEvents: 0 };
    rows.set(dateKey, { ...base, ...patch });
  };

  const toDateKey = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  };

  const platformCreatedAt = report?.signals?.platform?.created_at;
  const postKey = toDateKey(platformCreatedAt);
  if (postKey) addRow(postKey, { postEvents: 1 });

  const articles = report?.signals?.news?.articles || [];
  for (const article of articles) {
    const dateKey = toDateKey(article.published_at);
    if (!dateKey) continue;
    const current = rows.get(dateKey) || { date: dateKey, newsMentions: 0, postEvents: 0 };
    addRow(dateKey, { newsMentions: current.newsMentions + 1 });
  }

  const timeline = [...rows.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (timeline.length === 0) {
    const m24 = Number(report?.signals?.news?.mentions_24h || 0);
    const m7 = Number(report?.signals?.news?.mentions_7d || 0);
    return [
      { label: "24h", newsMentions: m24, postEvents: 0, cumulativeMentions: m24 },
      { label: "7d", newsMentions: m7, postEvents: 0, cumulativeMentions: m7 },
    ];
  }

  let cumulative = 0;
  return timeline.map((row) => {
    cumulative += row.newsMentions;
    const d = new Date(row.date);
    return {
      ...row,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      cumulativeMentions: cumulative,
    };
  });
}

function dedupeSources(sources) {
  const seen = new Set();
  const unique = [];
  for (const src of sources || []) {
    const url = (src?.url || "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    unique.push(src);
  }
  return unique;
}

function fmtNumber(value) {
  const n = Number(value || 0);
  return n.toLocaleString("en-US");
}

function fmtDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
  });
}

function TimelineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="glass-panel border-white/10 shadow-2xl px-4 py-3 text-[10px] uppercase font-mono rounded-lg relative overflow-hidden backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
      <p className="font-semibold text-zinc-100 mb-2 border-b border-white/10 pb-1.5 relative z-10">{label}</p>
      <div className="space-y-1.5 relative z-10 text-zinc-400">
        <p className="flex justify-between gap-4"><span>News Hits:</span> <span className="font-bold text-indigo-400">{row.newsMentions}</span></p>
        <p className="flex justify-between gap-4"><span>Sys Events:</span> <span className="font-bold text-zinc-100">{row.postEvents}</span></p>
        <p className="flex justify-between gap-4 pt-1 border-t border-white/5"><span>Aggregate:</span> <span className="font-bold text-zinc-300">{row.cumulativeMentions}</span></p>
      </div>
    </div>
  );
}

export default function DeepResearchPage() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check sessionStorage for link_research from a previous analyze call
    const cached = sessionStorage.getItem("analysisData");
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.status === "ok" && data.link_research) {
          setReport(data.link_research);
          setUrl(data.link_research.url || "");
          return;
        }
      } catch (e) { /* fall through */ }
    }
    getResults()
      .then((data) => {
        if (data.status === "ok" && data.link_research) {
          setReport(data.link_research);
          setUrl(data.link_research.url || "");
        }
      })
      .catch(() => { });
  }, []);

  const timelineData = useMemo(() => buildTimeline(report), [report]);
  const citations = useMemo(() => dedupeSources(report?.sources), [report]);

  const metrics = report?.signals?.platform?.metrics || {};
  const assessment = report?.assessment || {};
  const virality = report?.virality || {};
  const breakdown = virality.breakdown || {};
  const platformSignal = report?.signals?.platform || {};
  const newsSignal = report?.signals?.news || {};
  const platformStatus = platformSignal.status || (platformSignal.available ? "ok" : "error");
  const platformReason = (platformSignal.reason || "").replace(/[.\s]+$/, "");
  const platformInDegradedMode = !platformSignal.available && (platformStatus === "degraded" || platformStatus === "info");
  const showPlatformNotice = !platformSignal.available && !!platformReason;

  const handleResearch = async () => {
    const raw = (url || "").trim();
    if (!raw) {
      setError("Enter a post URL to run deep research.");
      return;
    }

    const normalized = raw.includes("://") ? raw : `https://${raw}`;

    setLoading(true);
    setError("");
    try {
      const payload = await researchLink(normalized);
      if (payload.status !== "ok") {
        setError(payload.message || "Deep research request failed.");
        return;
      }
      setReport(payload.research);
      setUrl(payload.research?.url || normalized);
    } catch (e) {
      setError(e.message || "ERR_CONNECTION_REFUSED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 w-full max-w-full flex justify-center h-screen overflow-y-auto">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 mb-8 mt-2 relative">
          <div className="absolute top-0 right-1/4 w-80 h-40 bg-purple-500/10 rounded-[100%] blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-3xl font-semibold text-zinc-100 tracking-tight drop-shadow-lg">Cross-Signal Terminal</h1>
            <p className="text-[10px] text-zinc-500 mt-2 font-mono uppercase tracking-widest px-2 py-1 flex items-center gap-2 rounded border border-white/5 bg-zinc-900/50 inline-flex">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse glow-indigo" />
              Aggregating multi-modal vectors
            </p>
          </div>
        </div>

        <div className="glass-panel border-white/5 bg-zinc-900/40 p-5 rounded-2xl mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
          <div className="flex flex-col sm:flex-row gap-4 items-end pl-2">
            <div className="flex-1 w-full relative">
              <label className="block text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Target Node URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full pl-5 pr-4 py-3 bg-zinc-950/80 border border-white/10 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] transition-all font-mono"
              />
            </div>
            <button
              onClick={handleResearch}
              disabled={loading}
              className={`px-8 py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] border border-indigo-500/50 ${loading ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-700 shadow-none" : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
            >
              {loading ? "Scanning..." : "Execute"}
            </button>
          </div>
          {error && <p className="text-[10px] font-mono text-red-400 mt-4 px-2 tracking-widest uppercase">stderr: {error}</p>}
        </div>

        {!report ? (
          <div className="border border-white/5 border-dashed rounded-2xl p-16 text-center text-[10px] text-zinc-600 font-mono uppercase tracking-widest bg-zinc-950/30 flex flex-col items-center">
            <svg className="animate-spin h-6 w-6 text-zinc-700 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Awaiting input coordinates...
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            {/* API Warning */}
            {showPlatformNotice && (
              <div
                className={`${platformInDegradedMode
                  ? "bg-amber-500/10 border border-amber-500/25 text-amber-200 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]"
                  : "bg-red-500/10 border border-red-500/20 text-red-400 shadow-[inset_0_0_15px_rgba(239,68,68,0.1)] glow-red"
                  } p-4 text-[10px] uppercase font-mono flex items-center gap-3 rounded-xl`}
              >
                <span className={`w-2 h-2 rounded-full animate-pulse ${platformInDegradedMode ? "bg-amber-400" : "bg-red-500"}`} />
                <div>
                  <span className={`font-bold mr-2 ${platformInDegradedMode ? "text-amber-400" : "text-red-500"}`}>
                    {platformInDegradedMode ? "DEGRADED:" : "WARN:"}
                  </span>
                  {platformInDegradedMode
                    ? `Live platform metrics unavailable. ${platformReason}. Running external-signal analysis.`
                    : `Platform metrics unavailable. ${platformReason}. Analysis mode forced to external signals.`}
                </div>
              </div>
            )}

            {/* News Info */}
            {newsSignal.query && (
              <div className="glass-panel border-white/5 bg-zinc-900/40 p-4 text-[10px] font-mono text-zinc-500 flex justify-between items-center rounded-xl shadow-lg border border-indigo-500/10 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
                <span>QUERY_EX: <span className="bg-zinc-950 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded shadow-[inset_0_0_10px_rgba(79,70,229,0.1)]">{newsSignal.query}</span></span>
                <span className="bg-zinc-950 px-3 py-1 rounded border border-white/5">VOL_7D: <span className="text-zinc-200">{newsSignal.mentions_7d}</span></span>
              </div>
            )}

            {/* Top-Level Assessment Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/5 glass-card rounded-2xl overflow-hidden bg-zinc-900/60">
              <div className="p-6 relative overflow-hidden group hover:bg-white/5 transition-colors duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-white to-transparent pointer-events-none w-full h-full" />
                <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Final Verdict</p>
                <p className="text-xl font-mono font-bold text-zinc-100 uppercase drop-shadow-md">{assessment.verdict || virality.label || "normal"}</p>
              </div>
              <div className="p-6 relative group hover:bg-white/5 transition-colors duration-300">
                <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Virality Index</p>
                <p className="text-xl font-mono font-bold text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">{virality.score ?? 0} <span className="text-xs text-zinc-600">/100</span></p>
              </div>
              <div className="p-6 relative group hover:bg-white/5 transition-colors duration-300">
                <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Confidence Model</p>
                <p className="text-xl font-mono font-bold text-zinc-100 uppercase drop-shadow-md">{assessment.confidence || virality.confidence || "low"}</p>
              </div>
              <div className="p-6 relative group hover:bg-white/5 transition-colors duration-300">
                <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Execution Layer</p>
                <p className="text-xl font-mono font-bold text-zinc-100 uppercase drop-shadow-md">{report.research_mode || "heuristic"}</p>
              </div>
            </div>

            {/* Summary and Score breakdown */}
            <div className="flex flex-col md:flex-row glass-card border flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/5 rounded-2xl overflow-hidden">
              <div className="flex-1 p-6 md:p-8 bg-zinc-900/20">
                <p className="text-[9px] uppercase tracking-widest font-bold text-indigo-500 mb-4 border-b border-white/10 pb-2">AI Summary Payload</p>
                <p className="text-sm text-zinc-300 leading-relaxed font-mono whitespace-pre-line bg-black/40 p-4 border border-white/5 rounded-lg shadow-inner">
                  <span className="text-indigo-500 mr-2 font-bold">{'>_'}</span>
                  {assessment.summary || "NO_SUMMARY_AVAILABLE"}
                </p>
              </div>
              <div className="md:w-72 p-6 md:p-8 flex flex-col gap-4 bg-zinc-950/60">
                <p className="text-[9px] uppercase tracking-widest font-bold text-indigo-500 mb-2 border-b border-white/10 pb-2">Coefficient Breakdown</p>
                <div className="space-y-1">
                  <MetricRow label="Engagement" value={breakdown.engagement ?? 0} />
                  <MetricRow label="Conversation" value={breakdown.conversation ?? 0} />
                  <MetricRow label="News Volume" value={breakdown.news ?? 0} />
                </div>
              </div>
            </div>

            {/* Main Graphs and Platform Data */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Graph */}
              <div className="glass-card lg:col-span-2 p-6 rounded-2xl flex flex-col shadow-xl">
                <p className="text-[9px] uppercase tracking-widest font-bold text-indigo-500 mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                  <span>Cross-Signal Vector Map</span>
                  <span className="flex gap-4 text-zinc-600 text-[10px]">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-indigo-500/20 border border-indigo-500/50" /> Hits</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-zinc-300 rounded-full glow-white" /> Sum</span>
                  </span>
                </p>
                <div className="h-64 flex-1 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <filter id="glowWhite">
                          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#71717a", fontFamily: "monospace" }} tickLine={false} axisLine={{ stroke: "#3f3f46" }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#71717a", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#71717a" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<TimelineTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                      <Bar yAxisId="left" dataKey="newsMentions" fill="#4f46e5" fillOpacity={0.2} stroke="#4f46e5" name="News Mentions" barSize={20} radius={[2, 2, 0, 0]} />
                      <Line yAxisId="right" type="stepAfter" dataKey="cumulativeMentions" stroke="#d4d4d8" strokeWidth={1.5} dot={false} name="Cumulative Mentions" filter="url(#glowWhite)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Meta */}
              <div className="glass-card p-6 rounded-2xl shadow-xl bg-zinc-950/80">
                <p className="text-[9px] uppercase tracking-widest font-bold text-indigo-500 mb-4 border-b border-white/10 pb-2">Manifold Meta</p>
                <div className="space-y-0 divide-y divide-white/5 text-[11px]">
                  <MetricRow label="TARGET" value={(report.platform || "WEB").toUpperCase()} />
                  <MetricRow label="LIKES_COUNT" value={fmtNumber(metrics.likes)} />
                  <MetricRow label="CMT_COUNT" value={fmtNumber(metrics.comments)} />
                  <MetricRow label="SHARE_COUNT" value={fmtNumber(metrics.shares)} />
                  <MetricRow label="QUOTE_COUNT" value={fmtNumber(metrics.quotes)} />
                  <MetricRow label="NEWS_24H" value={fmtNumber(report?.signals?.news?.mentions_24h)} />
                  <MetricRow label="TS_RUN" value={fmtDateTime(report.generated_at)} />
                </div>
              </div>
            </div>

            {/* Analysis Detail */}
            <div className="flex flex-col md:flex-row glass-card divide-y md:divide-y-0 md:divide-x divide-white/5 rounded-2xl overflow-hidden shadow-xl">
              <div className="flex-1 p-6 md:p-8 bg-zinc-900/30">
                <h2 className="text-[9px] uppercase tracking-widest font-bold text-indigo-500 mb-5 border-b border-white/10 pb-2">Reasoning Protocol</h2>
                {Array.isArray(assessment.reasons) && assessment.reasons.length > 0 ? (
                  <ul className="text-xs text-zinc-300 font-mono space-y-3 pl-4 list-decimal shadow-inner bg-black/40 p-5 rounded-lg border border-white/5">
                    {assessment.reasons.map((reason, idx) => (
                      <li key={idx} className="pl-2 marker:text-indigo-500/50">{reason}</li>
                    ))}
                  </ul>
                ) : <p className="text-[10px] text-zinc-600 font-mono uppercase bg-black/40 p-3 rounded-md">NULL</p>}
              </div>
              <div className="flex-1 p-6 md:p-8 bg-zinc-900/40 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
                <h2 className="text-[9px] uppercase tracking-widest font-bold text-indigo-500 mb-5 border-b border-white/10 pb-2 relative z-10">System Directives</h2>
                {Array.isArray(assessment.recommended_actions) && assessment.recommended_actions.length > 0 ? (
                  <ul className="text-xs text-zinc-300 font-mono space-y-3 pl-4 list-disc relative z-10 shadow-inner bg-black/40 p-5 rounded-lg border border-white/5">
                    {assessment.recommended_actions.map((action, idx) => (
                      <li key={idx} className="pl-2 marker:text-red-500/50">{action}</li>
                    ))}
                  </ul>
                ) : <p className="text-[10px] text-zinc-600 font-mono uppercase bg-black/40 p-3 rounded-md relative z-10">NULL</p>}
              </div>
            </div>

            {/* Citations */}
            <div className="glass-card p-6 md:p-8 rounded-2xl mb-12shadow-xl">
              <h2 className="text-[9px] uppercase tracking-widest font-bold text-indigo-500 mb-4 border-b border-white/10 pb-2 flex justify-between">
                <span>Data Ledger</span>
                <span className="text-[10px] text-zinc-500">{citations.length} Nodes</span>
              </h2>
              {citations.length === 0 ? (
                <p className="text-[10px] font-mono text-zinc-600 bg-black/40 p-4 rounded-lg">[]</p>
              ) : (
                <div className="space-y-0 divide-y divide-white/5 border border-white/10 bg-black/40 rounded-lg max-h-60 overflow-y-auto shadow-inner">
                  {citations.map((src, idx) => (
                    <div key={idx} className="p-3 text-[10px] uppercase tracking-widest font-mono flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-white/5 transition-colors gap-2">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <span className="text-zinc-600 w-24 flex-shrink-0">{fmtDateTime(src.published_at).split(',')[0]}</span>
                        <span className="bg-zinc-800 text-zinc-400 border border-white/5 px-2 py-0.5 rounded text-[9px] font-bold w-16 text-center">{src.source || 'SYS'}</span>
                      </div>
                      <a href={src.url} target="_blank" rel="noreferrer" className="flex-1 truncate mx-0 md:mx-4 text-indigo-400 hover:text-indigo-300 transition-colors bg-white/5 px-2 py-1 rounded">
                        {src.title || src.url}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between font-mono bg-white/5 hover:bg-white/10 transition-colors px-4 py-2.5 rounded group">
      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest group-hover:text-indigo-300 transition-colors">{label}</span>
      <span className="text-xs font-bold text-zinc-100">{value || "-"}</span>
    </div>
  );
}
