import React, { useState } from "react";
import { 
  Calendar, CheckCircle2, Bookmark, Flame,
  Compass, BookOpen, Clock, ArrowLeft
} from "lucide-react";

export function RoadmapView({ interview, onNavigateToDashboard }) {
  const [activePlan, setActivePlan] = useState("7days");
  const [checkedItems, setCheckedItems] = useState({});

  const roadmapData = interview.roadmap;

  if (!roadmapData) {
    return (
      <div className="p-8 text-center bg-[#0D0D0D] border border-white/10 rounded-2xl max-w-sm mx-auto my-12 text-gray-300">
        <Compass className="h-10 w-10 text-amber-500 mx-auto mb-4" />
        <p>No study roadmap has been configured for this interview segment yet.</p>
        <button onClick={onNavigateToDashboard} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold cursor-pointer">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Pick the active plan list
  const activePlanList = 
    activePlan === "7days" 
      ? roadmapData.plan7Days 
      : activePlan === "14days" 
        ? roadmapData.plan14Days 
        : roadmapData.plan30Days;

  const toggleCheck = (idx) => {
    const key = `${activePlan}-${idx}`;
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getCompletedCount = () => {
    return activePlanList.filter((_, idx) => checkedItems[`${activePlan}-${idx}`]).length;
  };

  const percentComplete = Math.round((getCompletedCount() / activePlanList.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in text-gray-350">
      
      {/* HUD Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0D0D0D] p-6 rounded-2xl border border-white/10 gap-4">
        <div>
          <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 rounded text-[10px] font-bold font-mono tracking-wider uppercase">
            STENCIL SYLLABUS DIRECTIVE
          </span>
          <h2 className="text-2xl font-bold text-white mt-1.5 font-sans flex items-center gap-2">
            Skill Study Roadmap
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Personalized study track compiled to target weak gaps in engineering interview criteria.
          </p>
        </div>

        <button
          onClick={onNavigateToDashboard}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl border border-white/10 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Return Home
        </button>
      </div>

      {/* Mode Switches & Target HUD */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        
        {/* Timeline selectors */}
        <div className="flex-1 bg-[#0D0D0D] p-5 rounded-2xl border border-white/10 space-y-3">
          <label className="text-[10px] text-gray-500 uppercase tracking-widest block font-mono">
            TIMELINE PLAN SELECTION
          </label>
          
          <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 border border-white/5 rounded-xl">
            <button
              onClick={() => setActivePlan("7days")}
              className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                activePlan === "7days" 
                  ? "bg-indigo-600 text-white font-bold" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              7-Day Sprint
            </button>
            <button
              onClick={() => setActivePlan("14days")}
              className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                activePlan === "14days" 
                  ? "bg-indigo-600 text-white font-bold" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              14-Day Review
            </button>
            <button
              onClick={() => setActivePlan("30days")}
              className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                activePlan === "30days" 
                  ? "bg-indigo-600 text-white font-bold" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              30-Day Master
            </button>
          </div>
          
          <p className="text-[11px] text-gray-400 leading-relaxed font-mono mt-2">
            {activePlan === "7days" 
              ? "⚡ Intensive high-impact schedule resolving fundamental technical gaps." 
              : activePlan === "14days" 
                ? "📚 Chronified sprint targeting conceptual deep-dives and mock diagnostics." 
                : "👑 4-week professional curriculum covering deployment architectural frameworks and system scale."}
          </p>
        </div>

        {/* Completion Progress graph */}
        <div className="bg-[#0D0D0D] p-5 rounded-2xl border border-white/10 md:w-80 flex flex-col justify-between gap-4">
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block font-mono">
              CURRICULUM RESOLUTION
            </label>
            <p className="text-xs text-gray-400 mt-1">Tick off modules as you review and finish studying.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end text-xs font-mono font-bold">
              <span className="text-gray-500">PROGRESS:</span>
              <span className="text-indigo-400">{percentComplete}%</span>
            </div>
            
            <div className="w-full bg-black/40 p-0.5 rounded-full border border-white/5">
              <div 
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            
            <div className="text-[10px] text-gray-500 font-mono text-right uppercase">
              {getCompletedCount()} of {activePlanList.length} Finished
            </div>
          </div>
        </div>
      </div>

      {/* Main Study Checklist Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        
        {/* Core Timeline steps (Spans 2 columns) */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest font-mono">STUDY TIMELINE SEGMENTS</h3>
          
          <div className="space-y-4 relative border-l border-white/10 pl-4 ml-2">
            {activePlanList.map((item, idx) => {
              const isChecked = Boolean(checkedItems[`${activePlan}-${idx}`]);
              return (
                <div 
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`relative p-5 rounded-xl border transition-all cursor-pointer select-none group text-left ${
                    isChecked 
                      ? "bg-indigo-500/5 border-emerald-500/15 opacity-60" 
                      : "bg-[#0D0D0D]/40 border-white/5 hover:border-white/20 hover:bg-white/[0.01]"
                  }`}
                >
                  {/* Timeline bullet handle */}
                  <div className={`absolute -left-[25px] top-6 w-3 h-3 rounded-full border transition-all ${
                    isChecked ? "bg-emerald-505 border-emerald-400" : "bg-black border-white/10 group-hover:border-indigo-505"
                  }`} />

                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 bg-black rounded text-[9px] font-mono font-bold text-indigo-405 uppercase">
                        {item.day}
                      </span>
                      <h4 className={`text-base font-bold text-white font-sans ${isChecked ? "line-through text-gray-500" : ""}`}>
                        {item.topic}
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans mt-2">
                        {item.focus}
                      </p>
                    </div>

                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition ${
                      isChecked ? "bg-emerald-505 border-emerald-400 text-white" : "border-white/10 group-hover:border-white/20"
                    }`}>
                      {isChecked && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Resource materials listed for the step */}
                  {item.resources && item.resources.length > 0 && (
                    <div className="border-t border-white/5 p-0.5 mt-4 pt-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-550 uppercase tracking-widest font-mono">
                        <BookOpen className="h-3.5 w-3.5 text-gray-550" /> Study Concepts:
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {item.resources.map((resItem, resIdx) => (
                          <span key={resIdx} className="px-2 py-0.5 bg-black rounded border border-white/5 text-gray-300 font-mono">
                            {resItem}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Study Advice & Guidelines HUD */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest font-mono">STUDY BLUEPRINTS</h3>
          
          <div className="bg-[#0D0D0D] p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex gap-3 leading-relaxed">
              <Bookmark className="h-4.5 w-4.5 text-indigo-405 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-white">Consolidate Fundamentals</h5>
                <p className="text-[11px] text-gray-400 mt-1">Reviewing the diagnostic keywords regularly fixes gaps before trying to practice complicated algorithms.</p>
              </div>
            </div>

            <div className="flex gap-3 leading-relaxed border-t border-white/10 pt-3">
              <Flame className="h-4.5 w-4.5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-white">STAR Response Structure</h5>
                <p className="text-[11px] text-gray-400 mt-1">Always state the Situation, Task, Action you performed, and the measurable overall Result when practicing your pitch.</p>
              </div>
            </div>

            <div className="flex gap-3 leading-relaxed border-t border-white/10 pt-3">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-white">Consistent Micro study</h5>
                <p className="text-[11px] text-gray-400 mt-1">30 to 45 minutes of targeted study per day is significantly more efficient than massive cramming sessions before interview rounds.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
