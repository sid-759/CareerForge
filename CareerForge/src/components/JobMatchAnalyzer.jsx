import { useState, useEffect, useRef } from "react";
import { api } from "../utils/api.js";
import { AlertCircle, Loader2 } from "lucide-react";

export function JobMatchAnalyzer({ resumeText }) {
  const [jobDescription, setJobDescription] = useState("");
  const [jdFile, setJdFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsingJdFile, setParsingJdFile] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState("7");
  const [historyList, setHistoryList] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.getJobMatchHistory();
      setHistoryList(data);
    } catch (err) {
      console.error("Failed to load match history", err);
    }
  };

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
      handleJdFileSelection(droppedFile);
    }
  };

  const handleJdFileSelection = async (selectedFile) => {
    setError(null);
    setSuccessMsg(null);
    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a valid Job Description PDF file only.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setJdFile(selectedFile);
    setParsingJdFile(true);
    try {
      const parsed = await api.uploadJobDescription(selectedFile);
      if (parsed && parsed.text) {
        setJobDescription(parsed.text);
        setSuccessMsg("Successfully parsed Job Description PDF text contents!");
      }
    } catch (err) {
      setError(err?.message || "Failed to extract text from PDF. Please copy-paste description text instead.");
      setJdFile(null);
    } finally {
      setParsingJdFile(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleJdFileSelection(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyzeMatch = async () => {
    setError(null);
    setSuccessMsg(null);

    if (!resumeText || !resumeText.trim()) {
      setError("Please upload or paste your Resume in the tool above first.");
      return;
    }

    if (!jobDescription || !jobDescription.trim()) {
      setError("Please paste the Job Description text or upload a JD PDF first.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.analyzeJobMatch(resumeText, jobDescription);
      setSelectedAnalysis(data);
      loadHistory(); // Reload history array with new analysis item
    } catch (err) {
      setError(err?.message || "An error occurred during comparison matching.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJobDescription("");
    setJdFile(null);
    setError(null);
    setSuccessMsg(null);
    setSelectedAnalysis(null);
  };

  // Score dynamic coloring rules
  const getScoreColor = (score) => {
    if (score >= 90) {return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", progress: "#10B981" };}
    if (score >= 70) {return { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", progress: "#3B82F6" };}
    if (score >= 50) {return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", progress: "#F59E0B" };}
    return { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", progress: "#EF4444" };
  };

  const getProbabilityBadge = (scoreLabel) => {
    if (scoreLabel === "High Chance") {return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";}
    if (scoreLabel === "Medium Chance") {return "bg-blue-500/10 text-blue-400 border border-blue-500/25";}
    return "bg-red-500/10 text-red-400 border border-red-500/25";
  };

  return (
    <div className="mt-12 pt-12 border-t border-white/10 text-gray-300">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-violet-500/10 text-violet-300 border border-violet-500/25 rounded-full text-xs font-semibold font-mono tracking-wider">
            JD ALIGNMENT ANALYSIS
          </span>
          <h3 className="text-2xl font-bold text-white mt-2 font-sans flex items-center gap-2">
            <Layers className="h-5 w-5 text-violet-400" />
            Resume vs Job Description Match
          </h3>
          <p className="text-gray-400 mt-1 text-xs sm:text-sm">
            Evaluate exact compatibility metrics, identify missing target skills, and generate key resume tweaks.
          </p>
        </div>

        {/* Use past record shortcut */}
        {historyList.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">Select Previous Match ID:</span>
            <select
              onChange={(e) => {
                const found = historyList.find(h => h.id === e.target.value);
                if (found) {setSelectedAnalysis(found);}
              }}
              value={selectedAnalysis?.id || ""}
              className="bg-[#050505] text-gray-300 border border-white/10 rounded-lg px-3 py-1 text-xs focus:border-violet-500 appearance-none cursor-pointer"
            >
              <option value="">-- View Past Reports --</option>
              {historyList.map(h => (
                <option key={h.id} value={h.id}>
                  {new Date(h.createdAt).toLocaleDateString()} - Score {h.matchScore}%
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Warning banner if resume hasn't been compiled/analyzed yet */}
      {!resumeText && (
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 flex gap-3 text-amber-200 text-xs sm:text-sm my-4 animate-fade-in mb-6">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-white">Resume Source Missing</p>
            <p className="text-gray-400">Please upload or paste your resume in the <strong>Resume Parser</strong> section above first so there is data content to match against!</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/40 flex gap-3 text-red-200 text-sm mb-6 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/40 flex gap-3 text-emerald-200 text-sm mb-6 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Form Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Inputs and uploads */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#0D0D0D] p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-400 uppercase tracking-widest font-mono">Job Description Input</span>
              {resumeText && (
                <span className="inline-flex items-center gap-1 text-[11px] text-green-400 font-mono">
                  <Check className="h-3.5 w-3.5" /> Resume Source Loaded
                </span>
              )}
            </div>

            {/* Drag and Drop Container */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition text-xs ${
                dragActive 
                  ? "border-violet-500 bg-violet-500/5" 
                  : jdFile 
                    ? "border-emerald-500/35 bg-emerald-500/5 hover:border-emerald-500/50" 
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
              {parsingJdFile ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-4">
                  <Loader2 className="h-5 w-5 text-violet-400 animate-spin" />
                  <p className="text-gray-400">Extracting Job Description text contents...</p>
                </div>
              ) : jdFile ? (
                <div className="space-y-1">
                  <p className="font-semibold text-white truncate">{jdFile.name}</p>
                  <p className="text-gray-500 text-[10px]">{(jdFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Ready</p>
                </div>
              ) : (
                <div className="space-y-1.5 py-2">
                  <Upload className="h-4 w-4 text-violet-400 mx-auto" />
                  <p className="font-medium text-gray-300">Drag & drop JD PDF or click to parse</p>
                  <p className="text-gray-500 text-[10px]">Autofills the text field below from file</p>
                </div>
              )}
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here..."
              rows={8}
              className="w-full bg-[#050505] text-gray-200 border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm font-mono placeholder:text-gray-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />

            {/* Buttons Row */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="w-1/3 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.02] text-xs font-semibold text-gray-400 transition cursor-pointer text-center"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleAnalyzeMatch}
                disabled={loading || !resumeText || !jobDescription.trim()}
                className="w-2/3 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Analyze Match
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats overview of past records */}
          {historyList.length > 0 && (
            <div className="bg-[#0D0D0D] p-5 rounded-2xl border border-white/10 space-y-3">
              <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 font-semibold">Your Match History</span>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {historyList.map((hist) => {
                  const colors = getScoreColor(hist.matchScore);
                  return (
                    <div 
                      key={hist.id} 
                      onClick={() => setSelectedAnalysis(hist)}
                      className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                        selectedAnalysis?.id === hist.id 
                          ? "bg-violet-500/5 border-violet-500/25" 
                          : "bg-[#050505] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="truncate pr-3">
                        <p className="text-xs text-white font-medium truncate">
                          {hist.jobDescription.split("\n")[0].substring(0, 35) || "Unlabeled Match"}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                          {new Date(hist.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${colors.bg} ${colors.text} ${colors.border}`}>
                        {hist.matchScore}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: MATCH REPORT OUTPUTS */}
        <div className="lg:col-span-7">
          {loading ? (
            /* LOADING SKELETON */
            <div className="bg-[#0D0D0D] p-6 rounded-2xl border border-white/10 space-y-6 animate-pulse">
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
                <h4 className="text-white font-semibold text-lg">Performing Deep AI Alignment Match...</h4>
                <p className="text-xs text-gray-400 max-w-sm">
                  Gemini is parsing your resume skills, experience, and projects to align with the requirements, keywords, and qualifications of the target JD.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="h-3 bg-white/5 rounded-full w-2/3" />
                <div className="h-3 bg-white/5 rounded-full w-1/2" />
                <div className="h-3 bg-white/5 rounded-full w-5/6" />
              </div>
            </div>
          ) : selectedAnalysis ? (
            /* FINAL REPORT OUTPUT VIEWS */
            <div className="space-y-6 animate-fade-in text-xs sm:text-sm">
              
              {/* TOP HERO REPORT: Match Score Ring & Advanced Analysis */}
              <div className="bg-[#0D0D0D] p-6 rounded-2xl border border-white/10 space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                  <div className="text-center md:text-left">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono">
                      Overall Compatibility Report
                    </span>
                    <h4 className="text-lg font-bold text-white mt-1">ALIGNMENT OVERVIEW</h4>
                    
                    {/* Prob badge */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono uppercase ${getProbabilityBadge(selectedAnalysis.interviewProbability.score)}`}>
                        {selectedAnalysis.interviewProbability.score}
                      </span>
                      <span className="text-gray-400 text-xs font-mono">
                        {selectedAnalysis.interviewProbability.confidence}% confidence
                      </span>
                    </div>
                  </div>

                  {/* Visual Match scorecard */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="relative flex items-center justify-center bg-[#050505] p-3 rounded-full border border-white/5">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#151515"
                          strokeWidth="6"
                          fill="transparent"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke={getScoreColor(selectedAnalysis.matchScore).progress}
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 40}
                          strokeDashoffset={2 * Math.PI * 40 * (1 - selectedAnalysis.matchScore / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-2xl font-extrabold text-white font-mono leading-none">
                          {selectedAnalysis.matchScore}
                        </span>
                        <span className="text-gray-400 text-[10px] block">%</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold tracking-wider uppercase font-mono text-gray-400 mt-2">
                      Job Match Score
                    </span>
                  </div>
                </div>

                {/* Why this score? explanation */}
                <div className="bg-[#050505] p-4 rounded-xl border border-white/5 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-violet-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">Why this score?</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed font-sans">
                    This match score represents a composite alignment index evaluated by examining your resume's technical stack overlap ({selectedAnalysis.advancedAnalysis.technicalSkillMatch}%), candidate-specific requirements match ({selectedAnalysis.advancedAnalysis.experienceMatch}%), critical target keyword volume ({selectedAnalysis.advancedAnalysis.keywordMatch}%), and project relevance ({selectedAnalysis.advancedAnalysis.projectRelevanceMatch}%).
                  </p>
                  <ul className="text-[11px] text-gray-500 space-y-1 list-disc pl-4 mt-2">
                    <li>Found {selectedAnalysis.keywordAnalysis.foundKeywords.length} of the critical recruitment keywords in your profile.</li>
                    <li>Mapped {selectedAnalysis.matchedSkills.length} key professional skills exactly matching the JD requirements.</li>
                    <li>Identified {selectedAnalysis.missingSkills.length} prerequisite keyword gaps that still need optimization.</li>
                  </ul>
                </div>

                {/* ADVANCED CALCUALTED COMPARATIVE SCORES */}
                <div className="border-t border-white/5 pt-5 space-y-4">
                  <h5 className="text-[10px] font-bold text-gray-400 tracking-widest font-mono uppercase">
                    Advanced Compatibility Metrics
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Tech Skill match */}
                    <div className="bg-[#050505] p-3 rounded-xl border border-white/5 text-center">
                      <p className="text-gray-400 text-[10px] font-mono tracking-wider uppercase">Tech Match</p>
                      <p className="text-xl font-bold text-white font-mono mt-1">{selectedAnalysis.advancedAnalysis.technicalSkillMatch}%</p>
                    </div>

                    {/* Experience match */}
                    <div className="bg-[#050505] p-3 rounded-xl border border-white/5 text-center">
                      <p className="text-gray-400 text-[10px] font-mono tracking-wider uppercase">Exp Match</p>
                      <p className="text-xl font-bold text-white font-mono mt-1">{selectedAnalysis.advancedAnalysis.experienceMatch}%</p>
                    </div>

                    {/* Keyword Match */}
                    <div className="bg-[#050505] p-3 rounded-xl border border-white/5 text-center">
                      <p className="text-gray-400 text-[10px] font-mono tracking-wider uppercase">Keyword fit</p>
                      <p className="text-xl font-bold text-white font-mono mt-1">{selectedAnalysis.advancedAnalysis.keywordMatch}%</p>
                    </div>

                    {/* Project Relevance */}
                    <div className="bg-[#050505] p-3 rounded-xl border border-white/5 text-center">
                      <p className="text-gray-400 text-[10px] font-mono tracking-wider uppercase">Project fit</p>
                      <p className="text-xl font-bold text-white font-mono mt-1">{selectedAnalysis.advancedAnalysis.projectRelevanceMatch}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2 & 3. SKILL MATCH BREAKDOWN */}
              <div className="bg-[#0D0D0D] p-5 rounded-2xl border border-white/10 space-y-4">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Award className="h-4 w-4 text-emerald-400" />
                  Skill Gap & Match Breakdown
                </h4>
                
                {/* Green Matched tags */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">Matched Tag Stack:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAnalysis.matchedSkills.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs flex items-center gap-1 font-mono">
                        <Check className="h-3 w-3" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Amber Gaps tags */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase font-semibold">Missing Gap Stack:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAnalysis.missingSkills.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xs flex items-center gap-1 font-mono">
                        ⚠️ {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. KEYWORD ANALYSIS CONTAINER */}
              <div className="bg-[#0D0D0D] p-5 rounded-2xl border border-white/10 space-y-4">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <FileSearch className="h-4 w-4 text-violet-400" />
                  Keyword Frequency & ATS Parser Fit
                </h4>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Ats Critical keywords matching JD (Highest Priority):</span>
                    <p className="text-xs text-white bg-[#050505] p-2 rounded-lg border border-white/5 mt-1 leading-relaxed italic">
                      {selectedAnalysis.keywordAnalysis.atsCriticalKeywords.join(", ")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-[10px] font-mono text-green-400 uppercase">Found Keywords ({selectedAnalysis.keywordAnalysis.foundKeywords.length})</span>
                      <ul className="space-y-1 text-xs text-gray-300 mt-1 max-h-[80px] overflow-y-auto">
                        {selectedAnalysis.keywordAnalysis.foundKeywords.map((k, i) => (
                          <li key={i} className="text-gray-400">• {k}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase">Missing Keywords ({selectedAnalysis.keywordAnalysis.missingKeywords.length})</span>
                      <ul className="space-y-1 text-xs text-gray-300 mt-1 max-h-[80px] overflow-y-auto">
                        {selectedAnalysis.keywordAnalysis.missingKeywords.map((k, i) => (
                          <li key={i} className="text-gray-400">• {k}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5, 6 & 7. FIT QUALITATIVE ASSESSMENTS */}
              <div className="bg-[#0D0D0D] p-5 rounded-2xl border border-white/10 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Recruitment Fit Analysis
                  </h4>
                  <div className="mt-3 space-y-4">
                    {/* Strengths */}
                    <div>
                      <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Candidate Strengths & Fit Rationale</span>
                      <p className="text-xs text-gray-300 leading-relaxed mt-1 font-sans">{selectedAnalysis.strengths}</p>
                    </div>

                    {/* Hiring Risks */}
                    <div className="pt-2">
                      <span className="text-[10px] text-red-400 font-mono uppercase tracking-widest flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" /> Potential Gaps / GCA Risks
                      </span>
                      <ul className="space-y-1.5 text-xs text-gray-300 mt-1.5 pr-2">
                        {selectedAnalysis.risks.map((risk, idx) => (
                          <li key={idx} className="flex gap-2 text-gray-400">
                            <span className="text-red-500 font-bold font-mono">⊘</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actionable recommendation summary */}
                    <div className="pt-2">
                      <span className="text-[10px] text-amber-400 font-mono uppercase tracking-widest flex items-center gap-1">
                        <Lightbulb className="h-3.5 w-3.5" /> High-Priority General recommendations
                      </span>
                      <ul className="space-y-1.5 text-xs text-gray-300 mt-1.5 pr-2">
                        {selectedAnalysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex gap-2 text-gray-400">
                            <span className="text-amber-500 font-bold font-mono">✓</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 10. RESUME OPTIMIZATION ACTIONS */}
              <div className="bg-[#0D0D0D] p-5 rounded-2xl border border-white/10 space-y-4">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  ATS Resume Optimization Hacks
                </h4>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-gray-400 font-mono uppercase">Concrete Project Plugging Gaps:</span>
                    <ul className="space-y-1 text-xs text-gray-300 mt-1">
                      {selectedAnalysis.resumeOptimization.projectSuggestions.map((proj, idx) => (
                        <li key={idx} className="text-gray-400 bg-[#050505] p-2 border border-white/5 rounded-lg mb-1 leading-relaxed">
                          <strong>Proj {idx + 1}:</strong> {proj}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] text-violet-400 font-mono uppercase">Targeted Bullet Point Rephrasings:</span>
                    <ul className="space-y-1 text-xs text-gray-300 mt-1">
                      {selectedAnalysis.resumeOptimization.bulletPointSuggestions.map((bp, idx) => (
                        <li key={idx} className="text-gray-400 border-l border-white/10 pl-2 py-1 italic mb-1 text-[11px]">
                          "{bp}"
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-mono uppercase">Standard Formatting & Metadata Actions:</span>
                    <ul className="space-y-1 text-xs text-gray-300 mt-1 leading-relaxed">
                      {selectedAnalysis.resumeOptimization.atsImprovements.map((imp, idx) => (
                        <li key={idx} className="text-gray-400">• {imp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 9. LEARNING ROADMAP PREPARATION PLANS */}
              <div className="bg-[#0D0D0D] p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-violet-400" />
                    Targeted Upskilling Prep Timeline
                  </h4>
                  <div className="flex items-center gap-1.5 bg-[#050505] p-1 rounded-lg border border-white/5 text-[10px]">
                    <button
                      onClick={() => setActiveTab("7")}
                      className={`px-2.5 py-0.5 rounded transition ${activeTab === "7" ? "bg-violet-600 text-white font-bold" : "text-gray-400 hover:text-gray-200"}`}
                    >
                      7 Day
                    </button>
                    <button
                      onClick={() => setActiveTab("14")}
                      className={`px-2.5 py-0.5 rounded transition ${activeTab === "14" ? "bg-violet-600 text-white font-bold" : "text-gray-400 hover:text-gray-200"}`}
                    >
                      14 Day
                    </button>
                    <button
                      onClick={() => setActiveTab("30")}
                      className={`px-2.5 py-0.5 rounded transition ${activeTab === "30" ? "bg-violet-600 text-white font-bold" : "text-gray-400 hover:text-gray-200"}`}
                    >
                      30 Day
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {/* Render Roadmap items according to selection */}
                  {(activeTab === "7" 
                    ? selectedAnalysis.learningRoadmap.plan7Days 
                    : activeTab === "14" 
                      ? selectedAnalysis.learningRoadmap.plan14Days 
                      : selectedAnalysis.learningRoadmap.plan30Days
                  ).map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#050505] rounded-xl border border-white/5 flex gap-3 items-start">
                      <div className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded font-mono text-[10px] font-bold uppercase tracking-wider text-center shrink-0">
                        {item.day}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white uppercase tracking-wide font-mono">
                          {item.topic}
                        </p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          {item.focus}
                        </p>
                        <div className="pt-2">
                          <span className="text-[9px] text-gray-500 tracking-wider font-mono uppercase block">Resources:</span>
                          <p className="text-[10px] italic text-violet-300 truncate">
                            {item.resources.join(" • ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* PLACEHOLDER WHEN IDLE */
            <div className="bg-[#0D0D0D] p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center py-20">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/15 mb-4">
                <Briefcase className="h-6 w-6" />
              </div>
              <h4 className="text-white font-semibold text-base mb-1">Reports Container Empty</h4>
              <p className="text-xs text-gray-400 max-w-sm">
                Paste a Job Description or drag in a JD PDF and tap "Analyze Match" to generate compatibility matrices, missing keywords, and detailed resume optimizations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
