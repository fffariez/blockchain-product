"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: "",
    adminName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setStatus("error");
      setErrorMsg("Passwords do not match");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          company_name: formData.companyName,
          admin_name: formData.adminName,
        },
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("success");
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-[#6C63FF] dark:focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 outline-none transition";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center px-4 py-10">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] bg-[#6C63FF]/[0.06] dark:bg-[#6C63FF]/[0.05] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/[0.04] dark:bg-purple-600/[0.04] rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
          style={{
            backgroundImage: "radial-gradient(circle, #374151 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-xl shadow-[#6C63FF]/10 dark:shadow-[#6C63FF]/[0.1]">
              <Shield className="w-8 h-8 text-[#6C63FF]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1.5">
            Join <span className="text-[#6C63FF]">VerifyChain</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Register your company for blockchain authentication
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] backdrop-blur-xl p-10 shadow-xl shadow-black/5 dark:shadow-black/30">
          {/* Success Banner */}
          {status === "success" && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium">
                Registration successful! Please check your email to confirm.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {status === "error" && errorMsg && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/[0.08] text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company & Admin Name */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  placeholder="Acme Corporation"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Name
                </label>
                <input
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => updateField("adminName", e.target.value)}
                  placeholder="John Doe"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="admin@company.com"
                required
                className={inputClass}
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-xl bg-[#6C63FF] hover:bg-[#5a52d5] text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#6C63FF]/25 hover:shadow-[#6C63FF]/40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/[0.06] text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-[#6C63FF] dark:text-[#9D97FF] hover:text-[#5a52d5] dark:hover:text-[#B0ACFF] font-medium transition"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
