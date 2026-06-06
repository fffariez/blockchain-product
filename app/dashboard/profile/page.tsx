"use client";

import { useEffect, useState } from "react";
import { User, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        setCompanyName(user.user_metadata?.company_name ?? "");
        setAdminName(user.user_metadata?.admin_name ?? "");
      }
    });
  }, []);

  const handleUpdateInfo = async () => {
    if (!companyName.trim() || !adminName.trim()) {
      setInfoMsg({ type: "error", text: "Company name and admin name cannot be empty." });
      return;
    }
    setInfoLoading(true);
    setInfoMsg(null);
    const { error } = await supabase.auth.updateUser({
      data: { company_name: companyName.trim(), admin_name: adminName.trim() },
    });
    setInfoLoading(false);
    if (error) {
      setInfoMsg({ type: "error", text: error.message });
    } else {
      setInfoMsg({ type: "success", text: "Profile updated successfully." });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setPwMsg({ type: "error", text: "Please fill in all password fields." });
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      setPwMsg({ type: "error", text: error.message });
    } else {
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-gray-100 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition";

  const Feedback = ({ msg }: { msg: { type: "success" | "error"; text: string } }) => (
    <div className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm ${
      msg.type === "success"
        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
        : "bg-red-50 dark:bg-red-500/[0.06] text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20"
    }`}>
      {msg.type === "success"
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {msg.text}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">Profile</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account details and password</p>
      </div>

      {/* Personal Info */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none p-7 space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Personal Info</h2>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className={`${inputClass} opacity-50 cursor-not-allowed`}
          />
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">Email cannot be changed.</p>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Admin Name</label>
          <input
            type="text"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            className={inputClass}
          />
        </div>

        {infoMsg && <Feedback msg={infoMsg} />}

        <div className="flex justify-end">
          <button
            onClick={handleUpdateInfo}
            disabled={infoLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {infoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none p-7 space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20">
            <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change Password</h2>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            className={inputClass}
          />
        </div>

        {pwMsg && <Feedback msg={pwMsg} />}

        <div className="flex justify-end">
          <button
            onClick={handleChangePassword}
            disabled={pwLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition shadow-lg shadow-purple-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
