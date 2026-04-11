import React from "react";

/* ─── Mock Data ──────────────────────────────────────────────── */

// Generates simple, human-readable explanations rather than generic "AI" text
const INSIGHTS = [
  {
    id: "ins_101",
    date: "Apr 11, 2026",
    metric: "Engagement",
    explanation:
      "This massive spike in engagement happened over just 1 hour. It looks highly unnatural, driven primarily by repetitive, rapid-fire comments from newly created accounts.",
    classification: "Bot Activity",
    botProbability: 92, // percentage
  },
  {
    id: "ins_102",
    date: "Apr 09, 2026",
    metric: "Sentiment",
    explanation:
      "A sharp drop in sentiment occurred alongside an increase in mentions. This pattern usually points to a PR issue or a negative news story gaining traction.",
    classification: "Possible Crisis",
    botProbability: 14,
  },
  {
    id: "ins_103",
    date: "Apr 05, 2026",
    metric: "Shares",
    explanation:
      "Shares doubled compared to the baseline, but the growth was sustained over 48 hours with healthy sentiment. This is a classic organic viral trend.",
    classification: "Viral",
    botProbability: 8,
  },
  {
    id: "ins_104",
    date: "Mar 28, 2026",
    metric: "Likes",
    explanation:
      "A brief, sudden burst of likes from international IPs on a region-specific post. The traffic stopped as abruptly as it began.",
    classification: "Bot Activity",
    botProbability: 85,
  },
  {
    id: "ins_105",
    date: "Mar 15, 2026",
    metric: "Comments",
    explanation:
      "Steady, compounding increase in comments driven by a community discussion. The pattern matches organic platform reach algorithms.",
    classification: "Viral",
    botProbability: 12,
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */

const CLASSIFICATION_STYLES = {
  "Bot Activity": "bg-red-50 text-red-700 border-red-200",
  "Possible Crisis": "bg-amber-50 text-amber-700 border-amber-200",
  "Viral": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/* ─── Components ─────────────────────────────────────────────── */

function InsightCard({ insight }) {
  // Determine progress bar color based on probability
  const barColor =
    insight.botProbability >= 70
      ? "bg-red-500"
      : insight.botProbability >= 30
        ? "bg-amber-400"
        : "bg-emerald-500";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">

        {/* Left side: Header, Metric, Explanation */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <span className="text-sm font-semibold text-gray-900">
              {insight.metric} Anomaly
            </span>
            <span className="text-xs text-gray-400 font-mono tracking-tight">
              {insight.date}
            </span>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed max-w-2xl">
            {insight.explanation}
          </p>
        </div>

        {/* Right side: Classification & Bot Prob */}
        <div className="w-full sm:w-64 flex-shrink-0 flex flex-col gap-5 pt-1 sm:pt-0 border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-6">

          {/* Classification Tag */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-2">
              Classification
            </p>
            <div
              className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium ${CLASSIFICATION_STYLES[insight.classification] || "bg-gray-50 text-gray-700 border-gray-200"
                }`}
            >
              {insight.classification}
            </div>
          </div>

          {/* Bot Probability */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-2 flex justify-between">
              <span>Bot Probability</span>
              <span className="text-gray-900">{insight.botProbability}%</span>
            </p>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-500`}
                style={{ width: `${insight.botProbability}%` }}
              />
            </div>
            {insight.botProbability >= 70 && (
              <p className="text-[10px] text-red-500 mt-1.5 font-medium">
                High likelihood of artificial inflation.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Insights Page ──────────────────────────────────────────── */

export default function InsightsPage() {
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

        {/* Vertical Card Layout */}
        <div className="space-y-5">
          {INSIGHTS.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
}
