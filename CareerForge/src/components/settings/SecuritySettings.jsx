import React, { useState } from "react";
import { Shield, Lock, Loader2, CheckCircle, AlertCircle, LogOut } from "lucide-react";

export function SecuritySettings({ onLogout, apiChangePassword, apiLogoutAll }) {
  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  // Invalidate sessions state
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [logoutAllSuccess, setLogoutAllSuccess] = useState("");
  const [logoutAllError, setLogoutAllError] = useState("");
  const [showConfirmLogoutAll, setShowConfirmLogoutAll] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassSuccess("");
    setPassError("");

    if (newPassword !== confirmPassword) {
      setPassError("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPassError("New password must be at least 6 characters long.");
      return;
    }

    setPassLoading(true);

    try {
      const resp = await apiChangePassword(currentPassword, newPassword);
      if (resp.success) {
        setPassSuccess("Password updated successfully. Other active sessions revoked.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPassSuccess(""), 4000);
      }
    } catch (err) {
      setPassError(err?.message || "Failed to update password. Check your current password.");
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setLogoutAllLoading(true);
    setLogoutAllSuccess("");
    setLogoutAllError("");
    setShowConfirmLogoutAll(false);

    try {
      const resp = await apiLogoutAll();
      if (resp.success) {
        setLogoutAllSuccess("All other sessions successfully revoked. Redirecting to login shortly...");
        setTimeout(() => {
          onLogout(); // call home logout which redirects to login screen
        }, 1500);
      }
    } catch (err) {
      setLogoutAllError(err?.message || "Failed to invalidate sessions.");
    } finally {
      setLogoutAllLoading(false);
    }
  };

  return (
    <div id="security-settings-card" className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-white/20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-600/15">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-base font-bold text-white">Security Settings</h4>
          <p className="text-xs text-gray-400">Manage account access, updates and token invalidations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Passwords change card */}
        <div className="space-y-4">
          <span className="text-[10px] text-gray-400 font-mono tracking-widest block font-bold uppercase">CHANGE SECURITY PASSWORD</span>
          
          {passSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50 flex gap-2 text-emerald-200 text-xs items-center">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          {passError && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-2 text-red-200 text-xs items-center">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {passLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Update Password"}
            </button>
          </form>
        </div>

        {/* Revocations panel */}
        <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-6">
          <span className="text-[10px] text-gray-400 font-mono tracking-widest block font-bold uppercase text-red-400">SESSION TERMINAL</span>
          
          <div className="p-4 rounded-xl bg-red-950/5 border border-red-900/10 space-y-3">
            <h5 className="text-xs font-semibold text-white">Dynamic Session Eviction</h5>
            <p className="text-xs text-gray-400 leading-relaxed">
              If you suspect compromise or want to close your active simulators on work laptops, you can invalidate all existing tokens immediately.
            </p>
          </div>

          {logoutAllSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50 flex gap-2 text-emerald-200 text-xs items-center">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>{logoutAllSuccess}</span>
            </div>
          )}

          {logoutAllError && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-2 text-red-200 text-xs items-center">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span>{logoutAllError}</span>
            </div>
          )}

          {!showConfirmLogoutAll ? (
            <button
              type="button"
              onClick={() => setShowConfirmLogoutAll(true)}
              disabled={logoutAllLoading}
              className="px-4 py-2 bg-red-950/30 hover:bg-red-900/40 text-red-200 border border-red-900/40 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout From All Devices
            </button>
          ) : (
            <div className="p-4 bg-black/40 border border-red-900/30 rounded-xl space-y-3.5 animate-fade-in">
              <p className="text-xs text-red-200 font-semibold">Are you absolutely sure?</p>
              <p className="text-[11px] text-gray-400">This will immediately sign you out from this and all other devices. You will need to log back in.</p>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleLogoutAllDevices}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Confirm Sign Out
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmLogoutAll(false)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs rounded-lg transition border border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
