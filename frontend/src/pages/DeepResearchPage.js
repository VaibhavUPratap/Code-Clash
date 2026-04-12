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

function buildTimeline(report) {
  const rows = new Map();

  const addRow = (dateKey, patch) => {
    if (!dateKey) return;
    const base = rows.get(dateKey) || {
      date: dateKey,
      newsMentions: 0,
      postEvents: 0,
    };
    rows.set(dateKey, {
      ...base,
      ...patch,
    });
  };

  const toDateKey = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  };

  const platformCreatedAt = report?.signals?.platform?.created_at;
  const postKey = toDateKey(platformCreatedAt);
  if (postKey) {
    addRow(postKey, { postEvents: 1 });
  }

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
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TimelineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      <p className="text-gray-600">News mentions: <span className="font-semibold text-gray-900">{row.newsMentions}</span></p>
      <p className="text-gray-600">Post events: <span className="font-semibold text-gray-900">{row.postEvents}</span></p>
      <p className="text-gray-600">Cumulative mentions: <span className="font-semibold text-gray-900">{row.cumulativeMentions}</span></p>
    </div>
  );
}

export default function DeepResearchPage() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/get-results")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok" && data.link_research) {
          setReport(data.link_research);
          setUrl(data.link_research.url || "");
        }
      })
      .catch(() => {
        // No-op: this page can still run direct research from manual URL input.
      });
  }, []);

  const timelineData = useMemo(() => buildTimeline(report), [report]);
  const citations = useMemo(() => dedupeSources(report?.sources), [report]);

  const metrics = report?.signals?.platform?.metrics || {};
  const assessment = report?.assessment || {};
  const virality = report?.virality || {};
  const breakdown = virality.breakdown || {};
  const platformSignal = report?.signals?.platform || {};
  const newsSignal = report?.signals?.news || {};

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
      const response = await fetch("http://localhost:5000/api/research-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });

      const payload = await response.json();
      if (!response.ok || payload.status !== "ok") {
        setError(payload.message || "Deep research request failed.");
        return;
      }

      setReport(payload.research);
      setUrl(payload.research?.url || normalized);
    } catch (e) {
      setError("Unable to reach backend. Ensure Flask is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Deep Research</h1>
          <p className="text-sm text-gray-500 mt-2 max-w-3xl">
            Analyze a post URL for cross-signal virality using platform metrics, external mentions,
            evidence citations, and an AI/heuristic final verdict.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-8">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Research Input</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://x.com/user/status/123456789"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              onClick={handleResearch}
              disabled={loading}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "Researching..." : "Run Deep Research"}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>

        {!report ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">
            No research report yet. Submit a post URL to start.
          </div>
        ) : (
          <>
            {/* Platform API warning banner */}
            {!platformSignal.available && platformSignal.reason && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
                <span className="text-amber-500 text-lg leading-none mt-0.5">⚠</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Platform Metrics Unavailable</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">{platformSignal.reason}</p>
                  <p className="text-xs text-amber-600 mt-1">Virality score is computed from news signals only.</p>
                </div>
              </div>
            )}

            {/* News query info banner */}
            {newsSignal.query && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 mb-6 text-xs text-blue-700 flex items-center gap-2">
                <span className="font-semibold">News search query:</span>
                <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">{newsSignal.query}</span>
                <span className="text-blue-500 ml-auto">{newsSignal.mentions_7d} mention{newsSignal.mentions_7d !== 1 ? 's' : ''} in past 7 days</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wider text-gray-400">Verdict</p>
                <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">{assessment.verdict || virality.label || "normal"}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wider text-gray-400">Virality Score</p>
                <p className="text-lg font-semibold text-indigo-600 mt-1">{virality.score ?? 0}/100</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wider text-gray-400">Confidence</p>
                <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">{assessment.confidence || virality.confidence || "low"}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wider text-gray-400">Research Mode</p>
                <p className="text-lg font-semibold text-gray-900 mt-1 uppercase">{report.research_mode || "heuristic"}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <p className="text-sm text-gray-700 leading-relaxed">{assessment.summary || "No summary returned."}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400">Engagement Signal</p>
                  <p className="text-gray-900 font-semibold mt-1">{breakdown.engagement ?? 0}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400">Conversation Signal</p>
                  <p className="text-gray-900 font-semibold mt-1">{breakdown.conversation ?? 0}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400">News Signal</p>
                  <p className="text-gray-900 font-semibold mt-1">{breakdown.news ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Signal Timeline</h2>
                    <p className="text-xs text-gray-500 mt-1">News mentions and event density across captured dates.</p>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<TimelineTooltip />} />
                      <Bar yAxisId="left" dataKey="newsMentions" fill="#6366f1" radius={[4, 4, 0, 0]} name="News Mentions" />
                      <Line yAxisId="right" type="monotone" dataKey="cumulativeMentions" stroke="#0f766e" strokeWidth={2} dot={{ r: 2 }} name="Cumulative Mentions" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Platform Metrics</h2>
                <div className="space-y-3 text-sm">
                  <MetricRow label="Platform" value={(report.platform || "web").toUpperCase()} />
                  <MetricRow label="Likes" value={fmtNumber(metrics.likes)} />
                  <MetricRow label="Comments" value={fmtNumber(metrics.comments)} />
                  <MetricRow label="Shares" value={fmtNumber(metrics.shares)} />
                  <MetricRow label="Quotes" value={fmtNumber(metrics.quotes)} />
                  <MetricRow label="News mentions (24h)" value={fmtNumber(report?.signals?.news?.mentions_24h)} />
                  <MetricRow label="News mentions (7d)" value={fmtNumber(report?.signals?.news?.mentions_7d)} />
                  <MetricRow label="Generated" value={fmtDateTime(report.generated_at)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Why This Verdict</h2>
                {Array.isArray(assessment.reasons) && assessment.reasons.length > 0 ? (
                  <div className="space-y-2">
                    {assessment.reasons.map((reason, idx) => (
                      <p key={`reason_${idx}`} className="text-sm text-gray-700 leading-relaxed">{idx + 1}. {reason}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No detailed reasons returned.</p>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Recommended Actions</h2>
                {Array.isArray(assessment.recommended_actions) && assessment.recommended_actions.length > 0 ? (
                  <div className="space-y-2">
                    {assessment.recommended_actions.map((action, idx) => (
                      <p key={`act_${idx}`} className="text-sm text-gray-700 leading-relaxed">{idx + 1}. {action}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No actions returned.</p>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Full Citations</h2>
              {citations.length === 0 ? (
                <p className="text-sm text-gray-500">No citations were collected for this query.</p>
              ) : (
                <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                  {citations.map((src, idx) => (
                    <div key={`src_${idx}`} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-semibold uppercase tracking-wider">
                          {src.type || "source"}
                        </span>
                        {src.source && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-semibold uppercase tracking-wider">
                            {src.source}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {fmtDateTime(src.published_at)}
                        </span>
                      </div>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline break-words"
                      >
                        {src.title || src.url}
                      </a>
                      <p className="text-xs text-gray-500 mt-1 break-all">{src.url}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value || "-"}</span>
    </div>
  );
}
