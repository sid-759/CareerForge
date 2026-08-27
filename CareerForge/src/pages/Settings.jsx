import { useState } from "react";
import { api } from "../utils/api.js";
import { ProfileSettings } from "../components/settings/ProfileSettings.jsx";
import { AppearanceSettings } from "../components/settings/AppearanceSettings.jsx";
import { InterviewPreferences } from "../components/settings/InterviewPreferences.jsx";
import { SecuritySettings } from "../components/settings/SecuritySettings.jsx";
import { ArrowLeft, Settings, Shield, Sliders, Sun, User as UserIcon } from "lucide-react";

export function SettingsPage({ user, onUpdateUser, onLogout, onNavigateToDashboard }) {
  const [activeTab, setActiveTab] = useState("all");

  const handleUpdateSettingsAPI = async (updates) => {
    return await api.updateSettings(updates);
  };

  const handleChangePasswordAPI = async (currentPass, newPass) => {
    return await api.changePassword(currentPass, newPass);
  };

  const handleLogoutAllAPI = async () => {
    return await api.logoutAll();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in text-gray-300">
      
      {/* HUD Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0D0D0D] p-6 rounded-2xl border border-white/10 gap-4">
        <div>
          <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 rounded text-[10px] font-bold font-mono tracking-wider uppercase">
            SENSORY CONTROL PANEL
          </span>
          <h2 className="text-2xl font-bold text-white mt-1.5 font-sans flex items-center gap-2">
            <Settings className="h-6 w-6 text-indigo-505" /> Account Settings
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Customize system defaults, language models, security tokens, and profile avatars.
          </p>
        </div>
        
        <button
          onClick={onNavigateToDashboard}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl border border-white/10 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Dashboard
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Navigation Tab Sidebar */}
        <div className="w-full lg:w-64 bg-[#0D0D0D] p-4 rounded-2xl border border-white/10 space-y-1.5">
          <label className="text-[10px] text-gray-500 uppercase tracking-widest block font-mono pl-3 mb-2.5">
            SETTINGS NAVIGATION
          </label>
          
          <button
            onClick={() => setActiveTab("all")}
            className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === "all"
                ? "bg-indigo-650 bg-indigo-600 text-white font-bold"
                : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            <Settings className="h-4 w-4" /> All Preferences
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === "profile"
                ? "bg-indigo-650 bg-indigo-600 text-white font-bold"
                : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            <UserIcon className="h-4 w-4" /> Profile Identity
          </button>

          <button
            onClick={() => setActiveTab("appearance")}
            className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === "appearance"
                ? "bg-indigo-650 bg-indigo-600 text-white font-bold"
                : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            <Sun className="h-4 w-4" /> Visual Theme
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === "preferences"
                ? "bg-indigo-650 bg-indigo-600 text-white font-bold"
                : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            <Sliders className="h-4 w-4" /> Core Defaults
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === "security"
                ? "bg-indigo-650 bg-indigo-600 text-white font-bold"
                : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            <Shield className="h-4 w-4" /> Security Access
          </button>
        </div>

        {/* Content sections stack */}
        <div className="flex-1 w-full space-y-6">
          {(activeTab === "all" || activeTab === "profile") && (
            <ProfileSettings 
              user={user} 
              onUpdateUser={onUpdateUser} 
              apiUpdate={handleUpdateSettingsAPI} 
            />
          )}

          {(activeTab === "all" || activeTab === "appearance") && (
            <AppearanceSettings 
              user={user} 
              onUpdateUser={onUpdateUser} 
              apiUpdate={handleUpdateSettingsAPI} 
            />
          )}

          {(activeTab === "all" || activeTab === "preferences") && (
            <InterviewPreferences 
              user={user} 
              onUpdateUser={onUpdateUser} 
              apiUpdate={handleUpdateSettingsAPI} 
            />
          )}

          {(activeTab === "all" || activeTab === "security") && (
            <SecuritySettings 
              onLogout={onLogout}
              apiChangePassword={handleChangePasswordAPI} 
              apiLogoutAll={handleLogoutAllAPI} 
            />
          )}
        </div>

      </div>
    </div>
  );
}
