import React, { useState, useEffect } from "react";

/* ─── Helpers ────────────────────────────────────────────────── */

const CLASSIFICATION_STYLES = {
  "bot": "bg-red-50 text-red-700 border-red-200",
  "crisis": "bg-amber-50 text-amber-700 border-amber-200",
  "viral": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Bot Activity": "bg-red-50 text-red-700 border-red-200",
  "Possible Crisis": "bg-amber-50 text-amber-700 border-amber-200",
  "Viral": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/* ─── Components ─────────────────────────────────────────────── */

function InsightCard({ insight }) {
  // Determine progress bar color based on confidence
  const conf = insight.confidence?.toLowerCase() || "low";
  let botProbability = conf === "high" ? 90 : conf === "medium" ? 50 : 20;

  // Confidence bar: green = high signal quality, amber = medium, gray = low
  const barColor =
    conf === "high"
      ? "bg-emerald-500"
      : conf === "medium"
        ? "bg-amber-400"
        : "bg-gray-300";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">

        {/* Left side: Header, Metric, Explanation */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <span className="text-sm font-semibold text-gray-900 capitalize">
              {insight.metric} Anomaly
            </span>
            <span className="text-xs text-gray-400 font-mono tracking-tight">
              {insight.date}
            </span>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed max-w-2xl">
            {insight.explanation}
          </p>
          {insight.recommendation && (
            <div className="mt-3 text-sm text-indigo-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
              <strong>Recommendation:</strong> {insight.recommendation}
            </div>
          )}
        </div>

        {/* Right side: Classification & Bot Prob */}
        <div className="w-full sm:w-64 flex-shrink-0 flex flex-col gap-5 pt-1 sm:pt-0 border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-6">

          {/* Classification Tag */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-2">
              Classification
            </p>
            <div
              className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium capitalize ${CLASSIFICATION_STYLES[insight.classification] || "bg-gray-50 text-gray-700 border-gray-200"
                }`}
            >
              {insight.classification}
            </div>
          </div>

          {/* Confidence Indicator */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-2 flex justify-between">
              <span>AI Confidence</span>
              <span className="text-gray-900 capitalize">{insight.confidence}</span>
            </p>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-500`}
                style={{ width: `${botProbability}%` }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Insights Page ──────────────────────────────────────────── */

export default function InsightsPage() {
  const [insights, setInsights] = useState([]);
  const [linkResearch, setLinkResearch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/get-results")
      .then((res) => res.json())
      .then((result) => {
        if (result.status !== "ok") {
          setLoading(false);
          return;
        }

        setLinkResearch(result.link_research || null);

        const formatted = (result.anomalies || []).map((a, i) => {
          const ai = a.ai_insight || {};
          return {
            id: `ins_${i}`,
            date: a.date,
            metric: a.metric,
            classification: ai.type || "unknown",
            explanation: ai.cause || "No explanation provided.",
            confidence: ai.confidence || "low",
            recommendation: ai.recommendation || "",
          };
        });

        // Sort by newest first
        formatted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setInsights(formatted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch insights:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Anomaly Insights
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-xl leading-relaxed">
            Plain-English explanations for detected anomalies. We analyze the shape of the spike, account age, and velocity to tell you <i>why</i> it happened.
          </p>
        </div>

        {linkResearch && (
          <div className="mb-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Link Deep Research</h2>
                <p className="text-xs text-gray-500 mt-1 break-all">{linkResearch.url}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Virality Score</p>
                <p className="text-2xl font-bold text-indigo-600">{linkResearch.virality?.score ?? 0}/100</p>
                <p className="text-sm text-gray-600 capitalize">{linkResearch.assessment?.verdict || linkResearch.virality?.label || "normal"}</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {linkResearch.assessment?.summary || "No summary available for this link."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-sm">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wider text-gray-400">Engagement Signal</p>
                <p className="text-gray-900 font-semibold mt-1">{linkResearch.virality?.breakdown?.engagement ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wider text-gray-400">Conversation Signal</p>
                <p className="text-gray-900 font-semibold mt-1">{linkResearch.virality?.breakdown?.conversation ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wider text-gray-400">News Signal</p>
                <p className="text-gray-900 font-semibold mt-1">{linkResearch.virality?.breakdown?.news ?? 0}</p>
              </div>
            </div>

            {Array.isArray(linkResearch.sources) && linkResearch.sources.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Top Evidence Sources</p>
                <div className="space-y-2">
                  {linkResearch.sources.slice(0, 5).map((src, idx) => (
                    <a
                      key={`src_${idx}`}
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-indigo-700 hover:text-indigo-900 hover:underline break-words"
                    >
                      {src.title || src.url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vertical Card Layout */}
        <div className="space-y-5">
          {loading ? (
             <div className="text-center text-gray-500 py-12 text-sm">Loading insights...</div>
          ) : insights.length === 0 ? (
             <div className="text-center text-gray-500 py-12 text-sm">No insights available. Please run an analysis first.</div>
          ) : (
            insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
