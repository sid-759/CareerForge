import React, { useState, useEffect } from "react";
import { api } from "../utils/api.js";
import { 
  ArrowLeft, ArrowRight, HelpCircle, Hourglass, 
  CheckCircle2, AlertTriangle, Save, Loader2, Sparkles, AlertCircle
} from "lucide-react";

export function SessionSimulator({ 
  role, 
  companyName, 
  resumeText, 
  questions, 
  onSessionSubmit,
  onAbort
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 Minutes Session Timer
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize empty answers map
  useEffect(() => {
    const initial = {};
    questions.forEach((q) => {
      initial[q.id] = "";
    });
    setAnswers(initial);
  }, [questions]);

  // Session clock countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      // Auto-submit on expiration
      handleAutoSubmit();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const activeQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const formatTime = (secs) => {
    const mints = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mints.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const handleTextChange = (qId, val) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: val,
    }));
  };

  const nextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSingleSave = (qId) => {
    // Elegant highlight to show that state is captured comfortably
    const currentAnswer = answers[qId]?.trim() || "";
    if (currentAnswer) {
      const toast = document.getElementById(`toast-${qId}`);
      if (toast) {
        toast.innerText = "Draft Saved!";
        toast.className = "text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/15 animate-fade-in";
        setTimeout(() => {
          if (toast) {
            toast.className = "hidden";
          }
        }, 1500);
      }
    }
  };

  const getUnansweredCount = () => {
    return questions.filter((q) => !answers[q.id]?.trim()).length;
  };

  const handleAutoSubmit = () => {
    handleSubmitSession();
  };

  const handleSubmitSession = async () => {
    setError(null);
    setSubmitting(true);

    const compiledAnswers = questions.map((q) => ({
      questionId: q.id,
      questionText: q.question,
      userAnswer: answers[q.id]?.trim() || "[CANDIDATE ABSTAINED / TIMEOUT EXPIRED]",
    }));

    try {
      const interviewResult = await api.submitInterview(
        role,
        companyName,
        resumeText,
        questions,
        compiledAnswers
      );
      onSessionSubmit(interviewResult);
    } catch (err) {
      setError(err?.message || "An error occurred while evaluating your session. Ensure connectivity with backend.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in text-gray-350">
      {submitting ? (
        /* LOADING EVALUATION PANEL */
        <div className="bg-[#0D0D0D] border border-white/10 p-8 rounded-2xl text-center space-y-6 max-w-md mx-auto my-12 shadow-2xl">
          <div className="relative flex justify-center py-4">
            <Loader2 className="h-14 w-14 text-indigo-505 animate-spin" />
            <Sparkles className="h-6 w-6 text-amber-400 absolute top-2 right-2 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white font-sans">Evaluating Your Answers</h3>
            <p className="text-xs text-gray-400 font-sans max-w-xs mx-auto">
              Our Gemini model is evaluating technical accuracy, communication nuances, problem approach, and formatting recommendations...
            </p>
          </div>
          
          <div className="bg-[#050505] p-4 rounded-xl border border-white/10 text-left space-y-2 font-mono">
            <div className="flex justify-between items-center text-[10px] text-gray-500">
              <span>SESSION EVALUATION</span>
              <span className="text-indigo-400 font-bold animate-pulse">PROCESSING</span>
            </div>
            <div className="text-xs text-green-400 font-medium">✓ Analyzing response content...</div>
            <div className="text-xs text-amber-400 font-medium">✓ Evaluating technical answers...</div>
            <div className="text-xs text-indigo-400 font-medium">✓ Compiling tailored roadmap...</div>
          </div>
          <p className="text-[10px] text-gray-500 italic">Please wait, this will take approximately 8-15 seconds.</p>
        </div>
      ) : (
        /* INTERVIEW QUESTION CONTAINER */
        <div className="space-y-6">
          {/* Header Progress and Timer */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0D0D0D]/80 p-5 rounded-2xl border border-white/10 gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-mono font-bold uppercase tracking-wider">
                <span>SIMULATION TARGET:</span>
                <span className="text-indigo-450">{role}</span>
              </div>
              {companyName && (
                <div className="text-[11px] text-green-400 font-medium mt-0.5 flex items-center gap-1">
                  • tailoring for Standard {companyName} Rubric
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 shrink-0 font-mono w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-xs text-gray-400">
                PROG: <span className="text-white font-bold">{currentIndex + 1}</span> of <span className="text-white font-bold">{totalQuestions}</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-extrabold ${
                timeLeft < 5 * 60 
                  ? "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse" 
                  : "bg-[#050505] border-white/10 text-gray-200"
              }`}>
                <Hourglass className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar indicator */}
          <div className="w-full bg-[#0D0D0D] rounded-full h-1.5 border border-white/10 p-0.5">
            <div 
              className="bg-indigo-600 h-0.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-200 text-sm">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Active Question Panel */}
          {activeQuestion && (
            <div className="bg-[#0D0D0D]/70 p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 rounded-md text-[10px] font-bold font-mono tracking-wider uppercase">
                  {activeQuestion.category}
                </span>
                
                <span id={`toast-${activeQuestion.id}`} className="hidden" />
              </div>

              <div className="text-base sm:text-lg font-bold text-white flex gap-3 items-start font-sans leading-relaxed">
                <HelpCircle className="h-5 w-5 text-indigo-400 shrink-0 mt-1" />
                <p>{activeQuestion.question}</p>
              </div>

              {/* Target Concept Indicators */}
              <div className="bg-[#050505] p-4 rounded-xl border border-white/10">
                <span className="text-[10px] text-gray-500 block uppercase tracking-widest font-mono">Suggested Evaluation Anchors (STAR focus):</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {activeQuestion.expectedKeywords.map((k, kIdx) => (
                    <span key={kIdx} className="px-2 py-0.5 bg-[#0D0D0D] text-gray-300 rounded border border-white/5 text-[10px] font-mono">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              {/* Text Input Block */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-gray-400 uppercase tracking-wider font-mono text-[10px]">Your Response:</label>
                  <span className="text-[10px] text-gray-500 font-mono">{(answers[activeQuestion.id] || "").trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
                <textarea
                  value={answers[activeQuestion.id] || ""}
                  onChange={(e) => handleTextChange(activeQuestion.id, e.target.value)}
                  placeholder="Structure your answer clearly. Explain what you did, the details, and the results..."
                  rows={9}
                  className="w-full bg-[#050505] text-gray-100 border border-white/10 rounded-xl p-4 text-xs sm:text-sm font-mono placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Panel Controls */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => handleSingleSave(activeQuestion.id)}
                  className="px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.02] text-xs font-semibold text-gray-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  Save Draft
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={prevQuestion}
                    disabled={currentIndex === 0}
                    className="p-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-[#0D0D0D] text-gray-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={nextQuestion}
                    disabled={currentIndex === totalQuestions - 1}
                    className="p-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-[#0D0D0D] text-gray-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick HUD tracker */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`py-2 text-center rounded-xl text-xs font-bold font-mono transition border cursor-pointer ${
                  currentIndex === idx
                    ? "bg-indigo-605 border-indigo-500 text-white"
                    : (answers[q.id]?.trim() || "").length > 0
                      ? "bg-[#0D0D0D] border-white/10 text-gray-250"
                      : "bg-[#050505] border-white/5 text-gray-500"
                }`}
              >
                Q{idx + 1}
              </button>
            ))}
          </div>

          {/* Bottom Submission Panel */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-[#0D0D0D] p-5 rounded-2xl border border-white/10 gap-4 mt-8">
            <div className="text-center sm:text-left">
              {getUnansweredCount() > 0 ? (
                <div className="flex items-center gap-1.5 text-amber-500 font-medium text-xs justify-center sm:justify-start">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{getUnansweredCount()} unanswered questions remaining.</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-green-400 font-medium text-xs justify-center sm:justify-start">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>All questions answered successfully!</span>
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-0.5">Submit to trigger overall performance evaluation reports.</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-center font-sans">
              <button
                onClick={onAbort}
                className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-[#050505] text-xs font-medium text-gray-400 transition cursor-pointer text-center"
              >
                Quit / Abort
              </button>
              <button
                onClick={handleSubmitSession}
                className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                Submit Interview <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
