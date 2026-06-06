"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Lock, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    setResetSent(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#6C63FF]/[0.06] dark:bg-[#6C63FF]/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/[0.04] dark:bg-purple-600/[0.04] rounded-full blur-3xl" />
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
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-xl shadow-[#6C63FF]/10">
              <Shield className="w-8 h-8 text-[#6C63FF]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1.5">
            Welcome to <span className="text-[#6C63FF]">VerifyChain</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your admin account</p>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] backdrop-blur-xl p-8 shadow-xl shadow-black/5 dark:shadow-black/30">
          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/[0.08] text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-[#6C63FF] dark:focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 outline-none transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setResetMode(true); setError(""); }}
                  className="text-xs text-[#6C63FF] dark:text-[#9D97FF] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-[#6C63FF] dark:focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#6C63FF] hover:bg-[#5a52d5] text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#6C63FF]/25 hover:shadow-[#6C63FF]/40 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Forgot password overlay */}
          {resetMode && (
            <div className="absolute inset-0 bg-white dark:bg-neutral-950 rounded-2xl p-8 flex flex-col justify-center">
              {resetSent ? (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <ArrowRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Check your email</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    A password reset link has been sent to <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.
                  </p>
                  <button
                    onClick={() => { setResetMode(false); setResetSent(false); }}
                    className="text-sm text-[#6C63FF] hover:underline"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Reset password</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Enter your email and we&apos;ll send you a reset link.
                  </p>
                  <form onSubmit={handleReset} className="space-y-4">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@company.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 outline-none transition"
                    />
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full py-3 rounded-xl bg-[#6C63FF] hover:bg-[#5a52d5] text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
                    >
                      {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                    </button>
                  </form>
                  <button
                    onClick={() => setResetMode(false)}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-center w-full"
                  >
                    ← Back to sign in
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/[0.06] text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <a
                href="/sign-up"
                className="text-[#6C63FF] dark:text-[#9D97FF] hover:text-[#5a52d5] font-medium transition"
              >
                Register your company
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-5 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3" />
          Secured by blockchain technology
        </p>
      </motion.div>
    </div>
  );
}
