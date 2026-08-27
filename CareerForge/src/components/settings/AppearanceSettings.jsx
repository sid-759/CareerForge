import { useState, useEffect } from "react";
import { Monitor, Moon, Sun, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function AppearanceSettings({ user, onUpdateUser, apiUpdate }) {
  const [selectedTheme, setSelectedTheme] = useState(user.theme || "dark");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user.theme) {
      setSelectedTheme(user.theme);
    }
  }, [user.theme]);

  // Function to apply theme globally on root HTML element
  const applyThemeGlobally = (themeName) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    
    if (themeName === "light") {
      root.classList.add("light");
    } else if (themeName === "dark") {
      root.classList.add("dark");
    } else {
      // System Theme
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemPrefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }
    }
  };

  const handleThemeSelect = async (themeName) => {
    setSelectedTheme(themeName);
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const resp = await apiUpdate({ theme: themeName });
      if (resp.success) {
        // Save to localStorage
        localStorage.setItem("ai_interview_theme", themeName);
        // Apply globally
        applyThemeGlobally(themeName);
        // Sync user state in parent
        onUpdateUser(resp.user);
        
        setSuccessMsg(`Appearance changed to ${themeName} theme.`);
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      setErrorMsg(err?.message || "Failed to persist appearance selection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="appearance-settings-card" className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-white/20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-600/15">
          <Sun className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-base font-bold text-white">Appearance Settings</h4>
          <p className="text-xs text-gray-400">Configure visual themes and display overrides</p>
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

      <div className="space-y-4">
        <label className="text-[10px] uppercase font-bold text-gray-400 font-mono block">SELECT APPLICATION THEME</label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Dark option */}
          <button
            onClick={() => handleThemeSelect("dark")}
            disabled={loading}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition cursor-pointer select-none relative ${
              selectedTheme === "dark"
                ? "bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/5"
                : "bg-black/30 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
            }`}
          >
            <Moon className="h-6 w-6 mb-2 text-indigo-400" />
            <span className="text-xs font-semibold block">Dark Mode</span>
            <span className="text-[9px] text-gray-500 font-mono mt-0.5 uppercase">Futuristic Slate</span>
            {selectedTheme === "dark" && (
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
          </button>

          {/* Light option */}
          <button
            onClick={() => handleThemeSelect("light")}
            disabled={loading}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition cursor-pointer select-none relative ${
              selectedTheme === "light"
                ? "bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/5"
                : "bg-black/30 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
            }`}
          >
            <Sun className="h-6 w-6 mb-2 text-amber-500" />
            <span className="text-xs font-semibold block">Light Mode</span>
            <span className="text-[9px] text-gray-500 font-mono mt-0.5 uppercase">Premium Minimal</span>
            {selectedTheme === "light" && (
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
          </button>

          {/* System option */}
          <button
            onClick={() => handleThemeSelect("system")}
            disabled={loading}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition cursor-pointer select-none relative ${
              selectedTheme === "system"
                ? "bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/5"
                : "bg-black/30 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
            }`}
          >
            <Monitor className="h-6 w-6 mb-2 text-emerald-400" />
            <span className="text-xs font-semibold block">System default</span>
            <span className="text-[9px] text-gray-500 font-mono mt-0.5 uppercase">Auto Synchronization</span>
            {selectedTheme === "system" && (
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
          </button>
        </div>

        {loading && (
          <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5 justify-end">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Synchronizing settings...
          </div>
        )}
      </div>
    </div>
  );
}
