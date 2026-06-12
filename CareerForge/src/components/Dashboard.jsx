import React from "react";
import { 
  Clock, RotateCw, Plus, ArrowRight, BarChart2 
} from "lucide-react";

export function Dashboard({ 
  user, 
  historyList, 
  loadingHistory, 
  onStartNewSimulator, 
  onViewSessionReport,
  onViewRoadmapDirect 
}) {

  // Calculate metrics
  const totalSessions = historyList.length;
  const evaluatedSessions = historyList.filter((i) => i.evaluation !== undefined);
  
  const averageScore = evaluatedSessions.length > 0
    ? Math.round(evaluatedSessions.reduce((acc, curr) => acc + (curr.evaluation?.overallScore || 0), 0) / evaluatedSessions.length)
    : 0;

  const averageTech = evaluatedSessions.length > 0
    ? Math.round(evaluatedSessions.reduce((acc, curr) => acc + (curr.evaluation?.technicalScore || 0), 0) / evaluatedSessions.length)
    : 0;

  const averageComm = evaluatedSessions.length > 0
    ? Math.round(evaluatedSessions.reduce((acc, curr) => acc + (curr.evaluation?.communicationScore || 0), 0) / evaluatedSessions.length)
    : 0;

  // Extrapolate all weak areas identified to summarize them on dashboard cockpit
  const recentGaps = Array.from(
    new Set(
      evaluatedSessions
        .slice(0, 3)
        .flatMap((i) => i.evaluation?.weakAreas || [])
    )
  ).slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-gray-300">
      
      {/* Welcome header HUD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0D0D0D] p-6 rounded-2xl border border-white/10 gap-4">
        <div>
          <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 rounded text-[10px] font-bold font-mono tracking-widest uppercase">
            CareerForge Dashboard
          </span>
          <h2 className="text-2xl font-bold text-white mt-1.5 font-sans">
            Welcome back, <span className="text-gray-200 font-semibold">{user.name}</span>!
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Track your career readiness, interview performance, and skill development.
          </p>
        </div>

        <button
          onClick={onStartNewSimulator}
          className="w-full md:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
        >
          <Plus className="h-4 w-4" /> Start Interview Session
        </button>
      </div>
 
      {/* Metrics board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Simulations card */}
        <div className="p-5 bg-[#0D0D0D] rounded-2xl border border-white/10 space-y-2 text-left">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Simulations Conducted</span>
          <p className="text-3xl font-extrabold text-white font-mono">{totalSessions}</p>
          <div className="text-[10px] text-gray-500 mt-1 font-sans font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Historic performance history
          </div>
        </div>
 
        {/* Avg Score card */}
        <div className="p-5 bg-[#0D0D0D] rounded-2xl border border-white/10 space-y-2 text-left">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Average Scorecard</span>
          <p className="text-3xl font-extrabold text-white font-mono">{averageScore}%</p>
          <div className="text-[10px] mt-1 font-sans font-medium flex items-center gap-1.5 text-indigo-400">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> Overall Candidate Readiness
          </div>
        </div>
 
        {/* Tech Proficiency card */}
        <div className="p-5 bg-[#0D0D0D] rounded-2xl border border-white/10 space-y-2 text-left">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Technical Knowledge avg</span>
          <p className="text-3xl font-extrabold text-white font-mono">{averageTech}%</p>
          <div className="text-[10px] text-gray-500 mt-1 font-sans font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Syllabus category mastery
          </div>
        </div>
 
        {/* Communication Proficiency card */}
        <div className="p-5 bg-[#0D0D0D] rounded-2xl border border-white/10 space-y-2 text-left">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Communication Clearances</span>
          <p className="text-3xl font-extrabold text-white font-mono">{averageComm}%</p>
          <div className="text-[10px] text-gray-500 mt-1 font-sans font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> Structural feedback match
          </div>
        </div>
      </div>
 
      {/* Main Board splitting */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        
        {/* Previous Simulation History (Spans 2 columns) */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-transparent">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-mono flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-indigo-500" /> SIMULATION SESSION HISTORY
            </h3>
            <span className="text-[10px] bg-[#0D0D0D] text-gray-400 px-2.5 py-1 rounded border border-white/10 font-mono">
              SESSION LOGS
            </span>
          </div>

          {loadingHistory ? (
            <div className="p-8 bg-white/[0.02] rounded-2xl border border-white/10 text-center text-gray-400 text-xs">
              <RotateCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
              Syncing historical records...
            </div>
          ) : historyList.length === 0 ? (
            /* EMPTY HISTORY STATE */
            <div className="p-10 bg-[#0D0D0D] rounded-2xl border border-white/10 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-gray-500">
                <Plus className="h-6 w-6" />
              </div>
              <div className="max-w-xs mx-auto space-y-1">
                <h4 className="text-sm font-bold text-white">No Simulation History Found</h4>
                <p className="text-xs text-gray-400 leading-normal">
                  CareerForge helps you analyze resumes, compare job descriptions, practice interviews, and improve career readiness.
                </p>
              </div>
              <button
                onClick={onStartNewSimulator}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.2)]"
              >
                Start Simulating Now <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            /* PRINT HISTORY ROW ENTRIES */
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {historyList.map((item) => (
                <div 
                  key={item.id}
                  className="p-4 bg-white/[0.02] rounded-xl border border-white/10 hover:border-white/15 transition flex items-center justify-between gap-4 text-left"
                >
                  <div className="truncate space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase font-sans truncate">{item.role}</span>
                      {item.companyName && (
                        <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 rounded text-[9px] font-bold font-mono">
                          {item.companyName}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                      <span>Questions: {item.generatedQuestions.length}</span>
                      <span>&bull;</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {item.evaluation ? (
                      <div className="text-right">
                        <span className="block text-sm font-extrabold text-indigo-400 font-mono">{item.evaluation.overallScore}%</span>
                        <span className="text-[8px] text-gray-500 block uppercase font-mono tracking-widest leading-none">Score</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-mono">Incomplete</span>
                    )}

                    <div className="h-6 w-[1px] bg-white/10" />

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onViewSessionReport(item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold text-gray-205 transition cursor-pointer"
                      >
                        Scorecard
                      </button>
                      <button
                        onClick={() => onViewRoadmapDirect(item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/15 hover:bg-indigo-600/20 text-[10px] font-bold transition cursor-pointer"
                      >
                        Roadmap
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic Weak areas cockpit summary */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-mono flex items-center gap-2">
            <BarChart2 className="h-4.5 w-4.5 text-indigo-500 font-bold" /> DIAGNOSTIC SYLLABUS GAPS
          </h3>

          <div className="bg-[#0D0D0D] p-5 rounded-2xl border border-white/10 space-y-4">
            <div>
              <p className="text-xs text-gray-400">
                Here are the core topics identified from your previous evaluations requiring focused review.
              </p>
            </div>

            {recentGaps.length === 0 ? (
              <div className="p-4 bg-white/[0.01] rounded-xl border border-white/10 text-center text-[11px] text-gray-400 italic">
                No diagnostic gaps identified yet. Conduct simulations to trigger analytics.
              </div>
            ) : (
              <div className="space-y-2">
                {recentGaps.map((gap, idg) => (
                  <div key={idg} className="bg-white/[0.02] p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                    <span className="text-xs font-mono text-gray-300 truncate font-semibold uppercase">{gap}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-white/10 pt-3">
              <span className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">Study Blueprint Status</span>
              <p className="text-[11px] text-indigo-300 mt-1 font-sans italic leading-normal">
                Study roadmap items inside each syllabus timeline can turn these gaps into professional strengths.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
