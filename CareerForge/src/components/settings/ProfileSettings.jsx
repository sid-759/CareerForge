import React, { useState, useRef } from "react";
import { User as UserIcon, Mail, Camera, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function ProfileSettings({ user, onUpdateUser, apiUpdate }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profileImage, setProfileImage] = useState(user.profileImage || "");
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setProfileImage(base64String);
      setErrorMsg("");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const resp = await apiUpdate({ name, email, profileImage });
      if (resp.success) {
        onUpdateUser(resp.user);
        setSuccessMsg("Profile settings changed successfully.");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setErrorMsg(err?.message || "Failed to save profile changes.");
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="profile-settings-card" className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-white/20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-600/15">
          <UserIcon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-base font-bold text-white">Profile Settings</h4>
          <p className="text-xs text-gray-400">Update your account identity and avatar</p>
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
        {/* Profile Image Row */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-2">
          <div className="relative group cursor-pointer" onClick={triggerFileInput}>
            <div className="w-20 h-20 rounded-full border-2 border-indigo-500/30 overflow-hidden bg-black/40 flex items-center justify-center relative transition group-hover:border-indigo-500">
              {profileImage ? (
                <img referrerPolicy="no-referrer" src={profileImage} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold font-mono text-indigo-400">
                  {name ? name.charAt(0).toUpperCase() : "C"}
                </span>
              )}
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Camera className="h-5 w-5 text-indigo-300" />
              </div>
            </div>
            
            <button 
              type="button" 
              className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 rounded-full border border-white/20 text-white hover:bg-indigo-500 transition shadow"
              title="Upload picture"
            >
              <Camera className="h-3 w-3" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="text-center sm:text-left space-y-1">
            <span className="text-xs font-semibold text-gray-200 block">Candidate Identity Avatar</span>
            <span className="text-[10px] text-gray-500 font-mono block uppercase">Max size: 2MB (JPEG, PNG)</span>
          </div>
        </div>

        {/* Name and Email inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Jane Candidate"
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-sans text-gray-200 focus:border-indigo-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-405 font-mono block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g. candidate@example.com"
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-sans text-gray-200 focus:border-indigo-500 focus:outline-none transition"
              />
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
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving Changes
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
