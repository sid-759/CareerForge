import React, { useState, useEffect } from "react";
import { api } from "./utils/api.js";
import { Navbar } from "./components/Navbar.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { ResumeAnalyzer } from "./components/ResumeAnalyzer.jsx";
import { SessionSimulator } from "./components/SessionSimulator.jsx";
import { ScorecardView } from "./components/ScorecardView.jsx";
import { RoadmapView } from "./components/RoadmapView.jsx";
import { SettingsPage } from "./pages/Settings.jsx";
import { 
  Lock, Mail, User as UserIcon, Terminal, Sparkles, 
  ChevronRight, AlertCircle, Loader2
} from "lucide-react";

export default function App() {
  // Authentication & session cache states
  const [user, setUser] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Router layout states
  // Views: "login" | "register" | "dashboard" | "analyze" | "session-active" | "report-active" | "roadmap-active"
  const [activeView, setActiveView] = useState("login");

  // In-session temporary buffers
  const [activeResumeText, setActiveResumeText] = useState("");
  const [activeTargetRole, setActiveTargetRole] = useState("Software Engineer");
  const [activeCompanyName, setActiveCompanyName] = useState(undefined);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [activeInterview, setActiveInterview] = useState(null);

  // Form handling errors/loading
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Form input logs
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Validate active login status on mount
  useEffect(() => {
    async function checkCurrentUser() {
      try {
        const verifiedUser = await api.getMe();
        if (verifiedUser) {
          setUser(verifiedUser);
          setActiveView("dashboard");
          loadUserHistory();
        } else {
          setActiveView("login");
        }
      } catch (err) {
        setActiveView("login");
      } finally {
        setLoadingUser(false);
      }
    }
    checkCurrentUser();
  }, []);

  // Globally apply and synchronize visual themes
  useEffect(() => {
    const savedTheme = localStorage.getItem("ai_interview_theme") || user?.theme || "dark";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (savedTheme === "light") {
      root.classList.add("light");
    } else if (savedTheme === "dark") {
      root.classList.add("dark");
    } else {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemPrefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }
    }
  }, [user?.theme]);

  // Fetch candidate history
  const loadUserHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getHistory();
      setHistoryList(data);
    } catch (err) {
      console.error("Failed to fetch historical session data lists", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ai_interview_token");
    setUser(null);
    setHistoryList([]);
    setActiveView("login");
    // Clear credentials
    setLoginPassword("");
    setRegPassword("");
  };

  // Perform Register action
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const resp = await api.register(regName, regEmail, regPassword);
      localStorage.setItem("ai_interview_token", resp.token);
      setUser(resp.user);
      setActiveView("dashboard");
      setRegPassword("");
      await loadUserHistory();
    } catch (err) {
      setAuthError(err?.message || "Registration failed. Ensure backend connectivity.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Perform Login action
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const resp = await api.login(loginEmail, loginPassword);
      localStorage.setItem("ai_interview_token", resp.token);
      setUser(resp.user);
      setActiveView("dashboard");
      setLoginPassword("");
      await loadUserHistory();
    } catch (err) {
      setAuthError(err?.message || "Invalid credentials or network failure.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Triggered when resume analyzing completes successfully
  const handleAnalysisComplete = async (
    resumeText, 
    analysis, 
    role, 
    companyName
  ) => {
    setAuthError(null);
    setAuthLoading(true); // Overlay loading state

    try {
      // 1. Save buffers to local React context state
      setActiveResumeText(resumeText);
      setActiveTargetRole(role);
      setActiveCompanyName(companyName);

      // 2. Fetch technical structured questions matching criteria
      const resultObj = await api.generateQuestions(role, resumeText, companyName);
      
      setActiveQuestions(resultObj.questions);
      setActiveView("session-active"); // Start questionnaire Simulator View
    } catch (err) {
      alert("Error generating questions: " + (err?.message || "Communication with Gemini failed. Let's try again."));
    } finally {
      setAuthLoading(false);
    }
  };

  // Triggered on interview session submission
  const handleSessionSubmit = async (evaluatedInterview) => {
    setActiveInterview(evaluatedInterview);
    setActiveView("report-active"); // Redirect right to report scoreboard!
    await loadUserHistory(); // Trigger dashboard history list refresh
  };

  // Navigate to score details direct from logs list row
  const handleViewSessionReport = async (id) => {
    const found = historyList.find((i) => i.id === id);
    if (found) {
      setActiveInterview(found);
      setActiveView("report-active");
    } else {
      try {
        const fullDetail = await api.getInterviewById(id);
        setActiveInterview(fullDetail);
        setActiveView("report-active");
      } catch (err) {
        alert("Failed to load historical record details.");
      }
    }
  };

  // Navigate to study roadmap direct from logs list row or scorecard view
  const handleViewRoadmapDirect = async (id) => {
    const found = historyList.find((i) => i.id === id);
    if (found) {
      setActiveInterview(found);
      setActiveView("roadmap-active");
    } else {
      try {
        const fullDetail = await api.getInterviewById(id);
        setActiveInterview(fullDetail);
        setActiveView("roadmap-active");
      } catch (err) {
        alert("Failed to load roadmap blueprint details.");
      }
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400 mt-3 font-mono">Syncing Client Security sessions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      
      {/* Navigation Layout Bar */}
      <Navbar 
        user={user} 
        activeView={activeView}
        onNavigate={(view) => {
          setAuthError(null);
          setActiveView(view);
        }}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {/* VIEW ROUTER FOR STATE LOGICS */}

        {/* 1. LOGIN SCREEN CARD */}
        {activeView === "login" && (
          <div className="max-w-md mx-auto px-4 py-16 animate-fade-in">
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
              
              <div className="text-center">
                <div className="mx-auto w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/15 mb-3">
                  <Terminal className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white font-sans">Welcome to CareerForge</h3>
                <p className="text-xs text-slate-400 mt-1">Prepare Smarter. Interview Better.</p>
              </div>

              {authError && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-2.5 text-red-200 text-xs">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      placeholder="e.g. candidate@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-sans text-slate-205 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Secret Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-sans text-slate-205 focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 font-bold text-xs text-slate-50 transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/15 cursor-pointer"
                >
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Identity"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </form>

              <div className="border-t border-slate-850 pt-4 text-center">
                <button
                  onClick={() => {
                    setAuthError(null);
                    setActiveView("register");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Don't have a profile? <span className="text-blue-400 font-semibold underline">Register here</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. REGISTER SCREEN CARD */}
        {activeView === "register" && (
          <div className="max-w-md mx-auto px-4 py-16 animate-fade-in">
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
              
              <div className="text-center">
                <div className="mx-auto w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/15 mb-3">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white font-sans">Create your CareerForge Account</h3>
                <p className="text-xs text-slate-400 mt-1">Initiate CV checking metrics and AI mock interviews.</p>
              </div>

              {authError && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-2.5 text-red-200 text-xs text-left">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Candidate Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      placeholder="e.g. Jane Candidate"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-sans text-slate-205 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      placeholder="e.g. candidate@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-sans text-slate-205 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Security Password (min 6 chars)</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-sans text-slate-205 focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 font-bold text-xs text-slate-50 transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/15 cursor-pointer"
                >
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Identity"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </form>

              <div className="border-t border-slate-850 pt-4 text-center">
                <button
                  onClick={() => {
                    setAuthError(null);
                    setActiveView("login");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Already have an account? <span className="text-blue-400 font-semibold underline">Login instead</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay loading states during question generation background pipelines */}
        {authLoading && (activeView === "analyze" || activeView === "dashboard") && (
          <div className="fixed inset-0 bg-slate-960/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <h4 className="text-white font-bold mt-4">Generating Questions with Gemini...</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto text-center mt-1">Our system is reading your analyzed CV focus areas and compiling personalized situational interview questions.</p>
          </div>
        )}

        {/* 3. VERIFIED DASHBOARD COCKPIT */}
        {activeView === "dashboard" && user && (
          <Dashboard 
            user={user}
            historyList={historyList}
            loadingHistory={loadingHistory}
            onStartNewSimulator={() => setActiveView("analyze")}
            onViewSessionReport={handleViewSessionReport}
            onViewRoadmapDirect={handleViewRoadmapDirect}
          />
        )}

        {/* 4. RESUME UPLOAD AND ATS CHECKER VIEW */}
        {activeView === "analyze" && (
          <ResumeAnalyzer onAnalysisComplete={handleAnalysisComplete} />
        )}

        {/* 5. INTERACTIVE QUESTIONNAIRE PANEL PANEL */}
        {activeView === "session-active" && (
          <SessionSimulator 
            role={activeTargetRole}
            companyName={activeCompanyName}
            resumeText={activeResumeText}
            questions={activeQuestions}
            onSessionSubmit={handleSessionSubmit}
            onAbort={() => setActiveView("dashboard")}
          />
        )}

        {/* 6. EVALUATION SCORECARD DISPLAY */}
        {activeView === "report-active" && activeInterview && (
          <ScorecardView 
            interview={activeInterview}
            onNavigateToRoadmap={() => setActiveView("roadmap-active")}
            onNavigateToDashboard={() => setActiveView("dashboard")}
          />
        )}

        {/* 7. CUSTOM LEARNING TIMELINE BLUEPRINTS */}
        {activeView === "roadmap-active" && activeInterview && (
          <RoadmapView 
            interview={activeInterview}
            onNavigateToDashboard={() => setActiveView("dashboard")}
          />
        )}

        {/* 8. SETTINGS MANAGEMENT CONSOLE */}
        {activeView === "settings" && user && (
          <SettingsPage 
            user={user}
            onUpdateUser={(updatedUser) => setUser(updatedUser)}
            onLogout={handleLogout}
            onNavigateToDashboard={() => setActiveView("dashboard")}
          />
        )}

      </main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-gray-500 font-mono bg-[#0D0D0D]/40">
        <div className="max-w-7xl mx-auto px-6">
          CareerForge © 2025
        </div>
      </footer>
    </div>
  );
}
