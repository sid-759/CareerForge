import React, { useState, useRef } from "react";
import { api } from "../utils/api.js";
import { 
  Upload, AlertCircle, CheckCircle2, 
  ArrowRight, Key, ShieldAlert, Award, FileSpreadsheet, 
  Settings, Loader2, Sparkles
} from "lucide-react";
import { JobMatchAnalyzer } from "./JobMatchAnalyzer.jsx";

const SPEC_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Software Engineer",
  "Java Developer",
  "MERN Developer",
];

const RECRUIT_COMPANIES = [
  "General Simulator",
  "Amazon",
  "Google",
  "TCS",
  "Infosys",
  "Wipro",
  "Accenture",
  "Cognizant",
];

export function ResumeAnalyzer({ onAnalysisComplete }) {
  const [role, setRole] = useState(SPEC_ROLES[0]);
  const [companyName, setCompanyName] = useState(RECRUIT_COMPANIES[0]);
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [analyzerResult, setAnalyzerResult] = useState(null);

  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a valid PDF file only.");
      setFile(null);
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmitAnalysis = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isPasteMode && !file) {
      setError("Please select a resume PDF file to upload.");
      return;
    }

    if (isPasteMode && pastedText.trim().length < 50) {
      setError("Please paste a comprehensive resume description (at least 50 chars).");
      return;
    }

    setLoading(true);
    try {
      const result = await api.uploadResume(
        isPasteMode ? null : file,
        isPasteMode ? pastedText : undefined,
        role
      );
      setAnalyzerResult(result);
    } catch (err) {
      setError(err?.message || "Resume upload or analysis failed. Ensure the server is active.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = () => {
    if (analyzerResult) {
      const selectedCompany = companyName === "General Simulator" ? undefined : companyName;
      onAnalysisComplete(
        analyzerResult.resumeText,
        analyzerResult.analysis,
        role,
        selectedCompany
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in text-gray-350">
      <div className="mb-8 text-center">
        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 rounded-full text-xs font-semibold font-mono tracking-wider">
          PREPARATION CORE
        </span>
        <h2 className="text-3xl font-bold text-white mt-3 font-sans">
          Resume Parser & Analysis
        </h2>
        <p className="text-gray-400 mt-2 text-sm sm:text-base">
          Fine tune resume keywords, score your CV, and trigger personalized interviewer questions.
        </p>
      </div>

      {!analyzerResult ? (
        <form onSubmit={handleSubmitAnalysis} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-200 text-sm animate-fade-in">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role and Company Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Role Selector */}
            <div className="bg-[#0D0D0D] p-5 rounded-2xl border border-white/10">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2 font-mono">
                Target Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#050505] text-gray-100 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 transition cursor-pointer"
              >
                {SPEC_ROLES.map((roleOpt) => (
                  <option key={roleOpt} value={roleOpt}>
                    {roleOpt}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-2 font-mono">
                AI will optimize keywords and generate questions centered precisely around this title.
              </p>
            </div>

            {/* Company Mode Setting */}
            <div className="bg-[#0D0D0D] p-5 rounded-2xl border border-white/10">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2 font-mono">
                Company Mode
              </label>
              <select
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-[#050505] text-gray-100 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 transition cursor-pointer"
              >
                {RECRUIT_COMPANIES.map((companyOpt) => (
                  <option key={companyOpt} value={companyOpt}>
                    {companyOpt}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-2 font-mono">
                Tailor situational filters matching top multinational culture types (e.g. Amazon LPs, Google GCA).
              </p>
            </div>
          </div>

          {/* Setup File Upload Section */}
          <div className="bg-[#0D0D0D] p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block font-mono">
                Resume Content Source
              </label>
              <div className="flex items-center gap-2 bg-[#050505] p-1 rounded-lg border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setIsPasteMode(false)}
                  className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                    !isPasteMode ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  PDF Upload
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasteMode(true)}
                  className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                    isPasteMode ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Plain Text
                </button>
              </div>
            </div>

            {isPasteMode ? (
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the raw text of your resume here to analyze instantly..."
                rows={9}
                className="w-full bg-[#050505] text-gray-100 border border-white/10 rounded-xl p-4 text-xs sm:text-sm font-mono placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  dragActive 
                    ? "border-indigo-500 bg-indigo-500/5" 
                    : file 
                      ? "border-green-500/45 bg-green-500/5 hover:border-green-500/60" 
                      : "border-white/10 hover:border-white/20 hover:bg-white/[0.01]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center border border-green-500/15">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB • Click to change</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/15 rounded-full text-[11px] text-green-400 font-medium tracking-wide">
                      <CheckCircle2 className="h-3.5 w-3.5" /> PDF Ready
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/15">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Drag and drop resume PDF, or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">Accepts only standard PDF files up to 5MB</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end p-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm transition shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Resume with Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze and Score Resume
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* ANALYSIS RESULTS DISPLAY */
        <div className="space-y-6 animate-fade-in text-gray-300">
          {/* Top Info HUD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ATS Metric Circle */}
            <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono mb-4">
                ATS COMPATIBILITY SCORE
              </label>
              
              <div className="relative flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="#1A1A1A"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="#6366f1"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - (analyzerResult.analysis.atsScore || 65) / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-extrabold text-white font-mono">
                    {analyzerResult.analysis.atsScore || 65}
                  </span>
                  <span className="text-gray-400 text-xs block -mt-1">%</span>
                </div>
              </div>

              <span className="text-xs text-gray-400 font-medium mt-4 bg-[#050505] px-3 py-1 rounded-full border border-white/10">
                {(analyzerResult.analysis.atsScore || 65) >= 75 ? "Excellent Match" : "Optimization Required"}
              </span>

              {/* WHY THIS SCORE EXPLAINER */}
              <div className="mt-4 pt-4 border-t border-white/5 text-left w-full space-y-2">
                <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-mono font-bold block">Why this score?</span>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Calculated by cross-referencing your resume's core stacks against verified technical industry criteria:
                </p>
                <ul className="space-y-1 text-[10px] text-gray-500 font-sans list-disc pl-3">
                  <li>Keyword Density ({analyzerResult.analysis.skills.length} core competencies matched)</li>
                  <li>Missing priority terms: {analyzerResult.analysis.missingKeywords.length} targets detected</li>
                  <li>Structural alignment with target role ({role})</li>
                </ul>
              </div>
            </div>

            {/* Quick extracted skills */}
            <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/10 md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400">
                  <Award className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Extracted Skills</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto">
                {analyzerResult.analysis.skills.map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-[#050505] text-gray-300 rounded-lg border border-white/10 text-xs">
                    {s}
                  </span>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Extracted Frameworks</span>
                <p className="text-xs text-gray-200 font-mono mt-1 font-medium italic truncate">
                  {analyzerResult.analysis.technologies.join(", ")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths & Gaps list */}
            <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">Candidate Strengths</h3>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                {analyzerResult.analysis.strengths.map((str, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <ShieldAlert className="h-4 w-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">Identified Gaps</h3>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                {analyzerResult.analysis.weakAreas.map((weak, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Missing Keywords & Suggestions section */}
          <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500">
                <Key className="h-4 w-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">Missing Core Keywords</h3>
              </div>
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/15 text-amber-500 px-2.5 py-0.5 rounded font-mono font-bold uppercase">
                CRITICAL TARGETS
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {analyzerResult.analysis.missingKeywords.length > 0 ? (
                analyzerResult.analysis.missingKeywords.map((kw, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-amber-500/5 text-amber-400/90 rounded-lg border border-amber-500/15 text-xs font-mono">
                    + {kw}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">No critical missing keywords identified. Your resume is robust!</span>
              )}
            </div>

            <div className="border-t border-white/10 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest font-mono">Optimized Actionable Suggestions:</h4>
              <ul className="space-y-2 text-xs text-gray-300">
                {analyzerResult.analysis.resumeSuggestions.map((sug, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-amber-500 font-bold font-mono">{(idx + 1).toString().padStart(2, "0")}</span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Call to Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-[#0D0D0D] p-5 rounded-2xl border border-white/10 gap-4 mt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-505/10 text-indigo-400 rounded-xl border border-indigo-500/15">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Analysis Synchronized</h4>
                <p className="text-xs text-gray-400 mt-0.5">Ready to trigger custom technical interview questions tailored for {role}.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <button
                onClick={() => setAnalyzerResult(null)}
                className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.02] text-xs font-medium text-gray-300 transition cursor-pointer text-center"
              >
                Reset / Re-upload
              </button>
              <button
                onClick={handleStartSimulation}
                className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(79,70,229,0.3)] cursor-pointer"
              >
                Start Simulator <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Resume vs Job Description Match Addon Block */}
      <JobMatchAnalyzer resumeText={analyzerResult ? analyzerResult.resumeText : null} />
    </div>
  );
}
