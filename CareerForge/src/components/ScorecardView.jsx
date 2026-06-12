import React, { useState } from "react";
import { 
  Award, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, 
  Compass, Copy, ShieldAlert,
  Flame, MessageSquareCode
} from "lucide-react";

export function ScorecardView({ interview, onNavigateToRoadmap, onNavigateToDashboard }) {
  const [expandedFeedbackId, setExpandedFeedbackId] = useState(null);
  const [copiedText, setCopiedText] = useState(false);

  const evalRaw = interview.evaluation;
  if (!evalRaw) {
    return (
      <div className="p-8 text-center bg-[#0D0D0D] border border-white/10 rounded-2xl max-w-sm mx-auto my-12 text-gray-300">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
        <p>No evaluation available for this report.</p>
        <button onClick={onNavigateToDashboard} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold cursor-pointer">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const toggleExpand = (qId) => {
    setExpandedFeedbackId(expandedFeedbackId === qId ? null : qId);
  };

  const copyResults = () => {
    const summary = `CareerForge Scorecard Summary:
Role: ${interview.role}
Overall Score: ${evalRaw.overallScore}%
Technical Score: ${evalRaw.technicalScore}%
Communication Score: ${evalRaw.communicationScore}%
Problem Solving: ${evalRaw.problemSolvingScore || 70}%
Confidence Rating: ${evalRaw.confidenceScore || 75}%`;
    navigator.clipboard.writeText(summary);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-gray-300">
      
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0D0D0D] p-6 rounded-2xl border border-white/10 gap-4 shadow-xl">
        <div>
          <span className="px-2.5 py-1 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/15 rounded text-[10px] font-bold font-mono tracking-wider uppercase">
            EVALUATION REPORT READY
          </span>
          <h2 className="text-2xl font-bold text-white mt-1.5 font-sans flex items-center gap-2">
            Interview Scorecard
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Target Title: <span className="text-white font-semibold">{interview.role}</span> &bull; Simulated on {new Date(interview.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <button
            onClick={copyResults}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            {copiedText ? "Copied Summary!" : "Copy Score Details"}
          </button>
          
          <button
            onClick={onNavigateToRoadmap}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Compass className="h-4 w-4" />
            Study Roadmap Plan
          </button>
        </div>
      </div>

      {/* Main Metric Circles Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Overall Score Meter */}
        <div className="p-4 bg-[#0D0D0D] rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center col-span-2 md:col-span-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-2">OVERALL</label>
          <div className="relative flex items-center justify-center">
            {/* SVG circle */}
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="#1A1A1A" strokeWidth="6" fill="transparent" />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#6366f1"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - evalRaw.overallScore / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl font-black text-white font-mono">{evalRaw.overallScore}%</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-2 font-mono uppercase bg-[#050505] px-2 py-0.5 rounded">Composite</span>
        </div>

        {/* Technical Score */}
        <div className="p-4 bg-[#0D0D0D] rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-2">TECHNICAL</label>
          <div className="relative flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="#1A1A1A" strokeWidth="6" fill="transparent" />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#10b981"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - evalRaw.technicalScore / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl font-black text-white font-mono">{evalRaw.technicalScore}%</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-2 font-mono uppercase bg-[#050505] px-2 py-0.5 rounded">Syllabus</span>
        </div>

        {/* Communication Score */}
        <div className="p-4 bg-[#0D0D0D] rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-2">VERBAL</label>
          <div className="relative flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="#1A1A1A" strokeWidth="6" fill="transparent" />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#f59e0b"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - evalRaw.communicationScore / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl font-black text-white font-mono">{evalRaw.communicationScore}%</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-2 font-mono uppercase bg-[#050505] px-2 py-0.5 rounded">Clarity</span>
        </div>

        {/* Problem Solving Score */}
        <div className="p-4 bg-[#0D0D0D] rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-2">STRATEGY</label>
          <div className="relative flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="#1A1A1A" strokeWidth="6" fill="transparent" />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#8b5cf6"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - (evalRaw.problemSolvingScore || 70) / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl font-black text-white font-mono">{evalRaw.problemSolvingScore || 70}%</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-2 font-mono uppercase bg-[#050505] px-2 py-0.5 rounded">Methodology</span>
        </div>

        {/* Confidence Score */}
        <div className="p-4 bg-[#0D0D0D] rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-2">PRESENCE</label>
          <div className="relative flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="#1A1A1A" strokeWidth="6" fill="transparent" />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#ec4899"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - (evalRaw.confidenceScore || 75) / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl font-black text-white font-mono">{evalRaw.confidenceScore || 75}%</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-2 font-mono uppercase bg-[#050505] px-2 py-0.5 rounded">Confidence</span>
        </div>
      </div>

      {/* Strong Areas vs Weak Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strong Areas */}
        <div className="p-5 bg-[#0D0D0D] rounded-2xl border border-white/10 space-y-4 shadow-md">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-4.5 w-4.5" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono">Expert Strong Areas</h3>
          </div>
          <ul className="space-y-2 text-xs text-gray-350">
            {evalRaw.strongAreas.map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weak Gaps */}
        <div className="p-5 bg-[#0D0D0D] rounded-2xl border border-white/10 space-y-4 shadow-md">
          <div className="flex items-center gap-2 text-indigo-400">
            <ShieldAlert className="h-4.5 w-4.5" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono">Prerequisite Gaps</h3>
          </div>
          <ul className="space-y-2 text-xs text-gray-350">
            {evalRaw.weakAreas.map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ATS CV Audit Feedback */}
      {evalRaw.atsReport && (
        <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-amber-500 border-b border-white/10 pb-3 justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4.5 w-4.5" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">ATS CV Audit Feedback</h3>
            </div>
            <span className="text-xs bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded border border-amber-500/15 font-mono">
              ATS SCORE: {evalRaw.atsReport.score}/100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-300">Missing Required Vocabulary</h4>
              <div className="flex flex-wrap gap-1">
                {evalRaw.atsReport.missingKeywords.length > 0 ? (
                  evalRaw.atsReport.missingKeywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-500/5 text-amber-400 rounded text-[10px] font-mono border border-amber-500/10">
                      + {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 italic">Resume matches vocabulary perfectly.</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-gray-300">Specific Resume Adjustments</h4>
              <ul className="space-y-1 text-gray-300 list-decimal pl-4">
                {evalRaw.atsReport.suggestions.slice(0, 3).map((sug, i) => (
                  <li key={i}>{sug}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Improvement Suggestions */}
      <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400">
          <Flame className="h-4.5 w-4.5 text-indigo-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono">Expert Actionable Advice</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {evalRaw.improvementSuggestions.map((sug, idx) => (
            <div key={idx} className="bg-[#050505] p-4 rounded-xl border border-white/5 flex gap-3">
              <span className="text-indigo-500 font-bold font-mono text-sm leading-none">{(idx + 1).toString().padStart(2, "0")}</span>
              <p className="text-xs text-gray-305 leading-relaxed font-sans">{sug}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Question Feedback Breakdown list */}
      <div className="space-y-4">
        <h3 className="text-md sm:text-lg font-bold text-white flex items-center gap-2 font-sans">
          <MessageSquareCode className="h-5 w-5 text-indigo-400 shrink-0" /> Answer Log & Diagnostic Logs
        </h3>

        <div className="space-y-3">
          {interview.generatedQuestions.map((q, idx) => {
            const ansObj = interview.answers.find((a) => a.questionId === q.id);
            const scoreObj = evalRaw.feedback.find((f) => f.questionId === q.id);
            const isExpanded = expandedFeedbackId === q.id;

            return (
              <div key={q.id} className="bg-[#0D0D0D] rounded-xl border border-white/10 overflow-hidden shadow-sm">
                <div 
                  onClick={() => toggleExpand(q.id)}
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-gray-500">Q{(idx + 1).toString()}</span>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-200 truncate max-w-[190px] sm:max-w-md md:max-w-xl">
                      {q.question}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                      (scoreObj?.score || 7) >= 8 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                        : (scoreObj?.score || 7) >= 5 
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" 
                          : "bg-red-500/10 text-red-400 border border-red-500/15"
                    }`}>
                      {scoreObj?.score || 7}/10 Score
                    </span>
                    {isExpanded ? <ChevronDown className="h-4 w-4 rotate-180 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-[#050505] border-t border-white/10 space-y-4 text-xs">
                    {/* The Question */}
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Question Syllabus focus:</span>
                      <p className="text-gray-200 font-medium mt-1 leading-relaxed">{q.question}</p>
                    </div>

                    {/* Candidate Answer */}
                    <div className="border-l-2 border-white/10 pl-3">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Your Answer:</span>
                      <p className="text-gray-400 italic mt-1 font-mono whitespace-pre-wrap leading-relaxed">
                        {ansObj?.userAnswer || "[CANDIDATE TIMED OUT]"}
                      </p>
                    </div>

                    {/* AI evaluation remarks */}
                    <div className="bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10 space-y-1">
                      <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold">Interviewer Remarks:</span>
                      <p className="text-gray-300 leading-relaxed">{scoreObj?.comment || "Provided general description, could integrate STAR metrics for complete clarity."}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Return Navigation */}
      <div className="flex justify-center p-2">
        <button
          onClick={onNavigateToDashboard}
          className="px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-[#0D0D0D] text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
