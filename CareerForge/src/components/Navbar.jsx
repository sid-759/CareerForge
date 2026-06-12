import React from "react";
import { LogOut, User as UserIcon, Terminal, Settings } from "lucide-react";

export function Navbar({ user, activeView, onNavigate, onLogout }) {
  return (
    <nav className="border-b border-white/10 bg-[#0D0D0D]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <div 
          onClick={() => onNavigate("dashboard")} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="p-2 rounded-lg bg-indigo-600/15 text-indigo-400 group-hover:bg-indigo-600/25 transition">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-1.5 font-sans">
              CareerForge
            </h1>
            <p className="text-[10px] text-gray-550 font-mono hidden sm:block">Career Preparation Platform</p>
          </div>
        </div>

        {/* Dynamic Navigations */}
        {user ? (
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => onNavigate("dashboard")}
              className={`text-sm font-medium transition cursor-pointer ${
                activeView === "dashboard" || activeView.startsWith("session-") || activeView.startsWith("report-")
                  ? "text-indigo-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate("analyze")}
              className={`text-sm font-medium transition cursor-pointer ${
                activeView === "analyze" ? "text-indigo-400" : "text-gray-400 hover:text-white"
              }`}
            >
              Analyze Resume
            </button>
            
            <div className="h-4 w-px bg-white/10" />

            {/* Profile Dropdown */}
            <div className="flex items-center gap-3">
              <div className="flex-col items-end text-right hidden sm:flex">
                <span className="text-xs font-semibold text-gray-200 max-w-[120px] truncate">{user.name}</span>
                <span className="text-[10px] text-gray-500 font-mono">CANDIDATE</span>
              </div>
              <div className="p-1.5 rounded-full bg-white/5 border border-white/10">
                <UserIcon className="h-4 w-4 text-gray-300" />
              </div>
              
              <button
                onClick={() => onNavigate("settings")}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  activeView === "settings"
                    ? "bg-indigo-600/15 border-indigo-500 text-indigo-400 font-bold"
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-red-950/10 border border-red-900/20 text-gray-400 hover:text-red-400 hover:bg-red-950/20 transition cursor-pointer"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono text-gray-450 uppercase tracking-widest">Platform Ready</span>
          </div>
        )}
      </div>
    </nav>
  );
}
