import React, { useState } from "react";
import { Sliders, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

export function InterviewPreferences({ user, onUpdateUser, apiUpdate }) {
  const [preferredRole, setPreferredRole] = useState(user.preferredRole || "Software Engineer");
  const [preferredDifficulty, setPreferredDifficulty] = useState(user.preferredDifficulty || "Medium");
  const [preferredQuestionCount, setPreferredQuestionCount] = useState(user.preferredQuestionCount || 5);
  
  // AI pref fields
  const [preferredLanguage, setPreferredLanguage] = useState(user.preferredLanguage || "English");
  const [feedbackMode, setFeedbackMode] = useState(user.feedbackMode || "Detailed");

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const resp = await apiUpdate({
        preferredRole,
        preferredDifficulty,
        preferredQuestionCount,
        preferredLanguage,
        feedbackMode,
      });

      if (resp.success) {
        onUpdateUser(resp.user);
        setSuccessMsg("Interview and AI preferences saved successfully.");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setErrorMsg(err?.message || "Failed to save preferences.");
    } finally {
      setLoading(false);
    }
  };

  const roles = ["Frontend", "Backend", "Full Stack", "Java Developer", "SDE"];
  const difficulties = ["Easy", "Medium", "Hard"];
  const questionCounts = [5, 10, 15];

  return (
    <div id="interview-preferences-card" className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-white/20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-600/15">
          <Sliders className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-base font-bold text-white">Interview & AI Preferences</h4>
          <p className="text-xs text-gray-400">Configure default simulation configurations and AI evaluator modes</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50 flex gap-2 text-emerald-200 text-xs items-center animate-fade-in animate-duration-150">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-2 text-red-200 text-xs items-center animate-fade-in animate-duration-150">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Core Interview configuration parameters */}
        <div className="space-y-4">
          <span className="text-[10px] text-indigo-400 font-mono tracking-widest block font-bold uppercase">INTERVIEW COGNITIVE PLAN</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Preferred Role Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Default Target Role</label>
              <select
                value={preferredRole}
                onChange={(e) => setPreferredRole(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-3 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none transition cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={r} value={r} className="bg-[#0D0D0D]">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Difficulty */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Default Difficulty</label>
              <select
                value={preferredDifficulty}
                onChange={(e) => setPreferredDifficulty(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-3 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none transition cursor-pointer"
              >
                {difficulties.map((d) => (
                  <option key={d} value={d} className="bg-[#0D0D0D]">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Questions count */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Questions count</label>
              <select
                value={preferredQuestionCount}
                onChange={(e) => setPreferredQuestionCount(Number(e.target.value))}
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-3 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none transition cursor-pointer"
              >
                {questionCounts.map((qty) => (
                  <option key={qty} value={qty} className="bg-[#0D0D0D]">
                    {qty} Questions
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        <div className="h-px bg-white/5 my-4" />

        {/* Section 2: AI Specific options */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-[10px] text-gray-400 font-mono tracking-widest block font-bold uppercase">AI GENERATOR ADJUSTMENTS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Preferred Language selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Preferred Language</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreferredLanguage("English")}
                  className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    preferredLanguage === "English"
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredLanguage("Hinglish")}
                  className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    preferredLanguage === "Hinglish"
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Hinglish
                </button>
              </div>
            </div>

            {/* Feedback Detail mode */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Feedback Detail Mode</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFeedbackMode("Brief")}
                  className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    feedbackMode === "Brief"
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Brief
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackMode("Detailed")}
                  className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    feedbackMode === "Detailed"
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Detailed
                </button>
              </div>
            </div>

          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
