"use client";

import { motion } from "framer-motion";
import { Shield, QrCode, Lock, CheckCircle, ArrowRight, Zap, Monitor, Cpu, Database } from "lucide-react";
import { useRouter } from "next/navigation";

function FlowConnector({
  particleColor,
  glowColor,
  delay = 0,
}: {
  particleColor: string;
  glowColor: string;
  delay?: number;
}) {
  return (
    <div className="w-40 mx-2 relative self-start mt-14 h-px">
      <div
        className="w-full h-full"
        style={{
          background: `linear-gradient(to right, transparent, ${particleColor}90, transparent)`,
        }}
      />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: particleColor,
            boxShadow: `0 0 10px ${glowColor}, 0 0 4px ${particleColor}`,
            top: "-3px",
            left: 0,
          }}
          animate={{ x: [0, 152], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "linear",
            delay: delay + i * 0.6,
          }}
        />
      ))}
    </div>
  );
}

const heroNodeConfigs = [
  { angle: 0,   icon: QrCode,      color: "#6C63FF" },
  { angle: 60,  icon: CheckCircle, color: "#06D6A0" },
  { angle: 120, icon: Lock,        color: "#F59E0B" },
  { angle: 180, icon: Zap,         color: "#9D97FF" },
  { angle: 240, icon: Monitor,     color: "#60A5FA" },
  { angle: 300, icon: Database,    color: "#F472B6" },
];
const heroNodes = heroNodeConfigs.map(({ angle, icon, color }) => {
  const rad = (angle * Math.PI) / 180;
  return { x: Math.round(Math.cos(rad) * 130), y: Math.round(Math.sin(rad) * 130), icon, color };
});

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Immutable product authentication on the blockchain",
    },
    {
      icon: QrCode,
      title: "QR Verification",
      description: "Instant product verification via QR scan",
    },
    {
      icon: Lock,
      title: "Anti-Counterfeit",
      description: "Prevent fake and duplicated products",
    },
    {
      icon: CheckCircle,
      title: "Trusted Records",
      description: "Tamper-proof product history",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-gray-900 dark:text-white overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-150px] left-[-100px] w-[700px] h-[700px] bg-[#6C63FF]/[0.07] dark:bg-[#6C63FF]/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-[-100px] w-[600px] h-[600px] bg-purple-500/[0.06] dark:bg-purple-600/[0.05] rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.018] dark:opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, #374151 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* HERO */}
      <div className="relative max-w-7xl mx-auto px-8 pt-24 pb-32">
        <div className="grid grid-cols-2 gap-24 items-center">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6C63FF]/25 dark:border-[#6C63FF]/30 bg-[#6C63FF]/[0.06] dark:bg-[#6C63FF]/10 text-[#6C63FF] dark:text-[#9D97FF] text-sm font-medium mb-8"
            >
              <Zap className="w-3.5 h-3.5" />
              Powered by Ethereum Blockchain
            </motion.div>

            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight mb-6">
              <span className="bg-gradient-to-r from-[#6C63FF] via-[#8F88FF] to-[#B0ACFF] bg-clip-text text-transparent">
                VerifyChain
              </span>{" "}
              Blockchain Product Authentication
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mb-10 leading-relaxed">
              Secure your products using blockchain technology. Enable QR-based
              verification and eliminate counterfeit risks at scale.
            </p>

            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/login")}
                className="px-8 py-4 rounded-xl bg-[#6C63FF] hover:bg-[#5a52d5] text-white font-semibold text-base flex items-center gap-2.5 transition-all shadow-lg shadow-[#6C63FF]/30 hover:shadow-[#6C63FF]/50"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/sign-up")}
                className="px-8 py-4 rounded-xl border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/30 hover:text-gray-900 dark:hover:text-white font-semibold text-base transition"
              >
                Create Account
              </motion.button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-10 mt-12 pt-10 border-t border-gray-200 dark:border-white/[0.08]">
              {[
                { value: "10K+", label: "Products Verified" },
                { value: "99.9%", label: "Uptime" },
                { value: "<2s", label: "Avg Verification" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT VISUAL — Blockchain Network */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative flex items-center justify-center"
            style={{ height: 420 }}
          >
            {/* Background glow */}
            <div className="absolute w-80 h-80 rounded-full bg-[#6C63FF]/[0.08] dark:bg-[#6C63FF]/[0.14] blur-3xl pointer-events-none" />

            {/* SVG: rotating rings + connection lines + particles */}
            <svg viewBox="-210 -210 420 420" width="420" height="420" className="absolute inset-0">
              <defs>
                <filter id="heroGlow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Rotating orbit rings */}
              <motion.circle cx={0} cy={0} r={172} fill="none"
                stroke="rgba(108,99,255,0.14)" strokeWidth={1} strokeDasharray="8 18"
                animate={{ rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
              <motion.circle cx={0} cy={0} r={194} fill="none"
                stroke="rgba(108,99,255,0.06)" strokeWidth={0.5} strokeDasharray="3 22"
                animate={{ rotate: -360 }}
                transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />

              {/* Connection lines from center to each node */}
              {heroNodes.map((node, i) => (
                <motion.line key={`line-${i}`}
                  x1={0} y1={0} x2={node.x} y2={node.y}
                  stroke={`${node.color}38`} strokeWidth={1.5} strokeDasharray="5 6"
                  animate={{ strokeDashoffset: [33, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i * 0.25 }}
                />
              ))}

              {/* Glowing particles flowing outward */}
              {heroNodes.map((node, i) => (
                <motion.circle key={`p-${i}`} r={3.5}
                  fill={node.color} filter="url(#heroGlow)"
                  animate={{ cx: [0, node.x], cy: [0, node.y], opacity: [0, 1, 0.9, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.37 }}
                />
              ))}
            </svg>

            {/* Center shield node */}
            <div className="absolute z-20" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
              <motion.div
                animate={{ scale: [1, 1.07, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-24 h-24 rounded-3xl bg-[#6C63FF]/[0.1] dark:bg-[#6C63FF]/[0.18] border border-[#6C63FF]/40 flex items-center justify-center"
                style={{ boxShadow: "0 0 60px rgba(108,99,255,0.4), inset 0 0 30px rgba(108,99,255,0.06)" }}
              >
                <Shield className="w-11 h-11 text-[#6C63FF] dark:text-[#9D97FF]" />
                {[0, 1].map((i) => (
                  <motion.div key={i}
                    className="absolute inset-0 rounded-3xl border border-[#6C63FF]/40"
                    animate={{ scale: [1, 2.8], opacity: [0.5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 1.5 }}
                  />
                ))}
              </motion.div>
            </div>

            {/* Outer icon nodes */}
            {heroNodes.map((node, i) => {
              const Icon = node.icon;
              return (
                <motion.div key={`node-${i}`}
                  className="absolute z-10 w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    left: `calc(50% + ${node.x - 28}px)`,
                    top: `calc(50% + ${node.y - 28}px)`,
                    backgroundColor: `${node.color}12`,
                    border: `1px solid ${node.color}38`,
                    boxShadow: `0 0 28px ${node.color}22`,
                  }}
                  animate={{ scale: [1, 1.1, 1], y: [0, -4, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.55 }}
                >
                  <Icon className="w-6 h-6" style={{ color: node.color }} />
                </motion.div>
              );
            })}

            {/* Floating status badges */}
            <motion.div
              className="absolute bottom-6 right-0 z-30 flex items-center gap-2 px-3 py-2 rounded-xl border border-[#06D6A0]/30 bg-[#06D6A0]/[0.08] dark:bg-[#06D6A0]/[0.1]"
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-2 h-2 rounded-full bg-[#06D6A0] animate-pulse" />
              <span className="text-xs font-semibold text-[#06D6A0]">Verified On-Chain</span>
            </motion.div>

            <motion.div
              className="absolute top-8 left-0 z-30 px-3 py-2 rounded-xl border border-[#6C63FF]/25 bg-[#6C63FF]/[0.07] dark:bg-[#6C63FF]/[0.12]"
              animate={{ y: [3, -3, 3] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-xs font-mono text-[#9D97FF]">Block #8,241,903</span>
            </motion.div>

            <motion.div
              className="absolute top-1/3 right-0 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-400/25 bg-amber-400/[0.07]"
              animate={{ x: [2, -2, 2] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <CheckCircle className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Authentic</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* FLOW DIAGRAM */}
      <div className="relative px-8 py-24 border-t border-gray-100 dark:border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-3">End-to-End Verification Flow</h2>
            <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto">
              From product registration to consumer verification — all secured on-chain
            </p>
          </motion.div>

          {/* Nodes */}
          <div className="flex items-start justify-center">

            {/* NODE 1 — Computer */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center w-36"
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-2xl border border-[#6C63FF]/40"
                  animate={{ scale: [1, 1.55], opacity: [0.5, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-2xl border border-[#6C63FF]/20"
                  animate={{ scale: [1, 1.9], opacity: [0.3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
                />
                <div className="relative w-28 h-28 rounded-2xl bg-[#6C63FF]/[0.07] dark:bg-[#6C63FF]/[0.12] border border-[#6C63FF]/20 dark:border-[#6C63FF]/30 flex items-center justify-center shadow-[0_0_40px_rgba(108,99,255,0.12)]">
                  <Monitor className="w-12 h-12 text-[#6C63FF] dark:text-[#9D97FF]" />
                </div>
              </div>
              <p className="mt-5 font-semibold text-sm text-gray-900 dark:text-white">Computer</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 text-center leading-relaxed">Register &amp; Manage Products</p>
            </motion.div>

            <FlowConnector particleColor="#6C63FF" glowColor="rgba(108,99,255,0.9)" delay={0} />

            {/* NODE 2 — Blockchain */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col items-center w-36"
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-2xl border border-amber-400/40"
                  animate={{ scale: [1, 1.55], opacity: [0.5, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                />
                <motion.div
                  className="absolute inset-0 rounded-2xl border border-amber-400/20"
                  animate={{ scale: [1, 1.9], opacity: [0.3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 1.3 }}
                />
                <div className="relative w-28 h-28 rounded-2xl bg-amber-500/[0.07] dark:bg-amber-500/[0.1] border border-amber-400/25 dark:border-amber-400/20 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.12)]">
                  <Cpu className="w-12 h-12 text-amber-500 dark:text-amber-400" />
                </div>
              </div>
              <p className="mt-5 font-semibold text-sm text-gray-900 dark:text-white">Blockchain</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 text-center leading-relaxed">Ethereum Sepolia Network</p>
            </motion.div>

            <FlowConnector particleColor="#06D6A0" glowColor="rgba(6,214,160,0.9)" delay={0.5} />

            {/* NODE 3 — Database */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center w-36"
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-2xl border border-emerald-400/40"
                  animate={{ scale: [1, 1.55], opacity: [0.5, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
                />
                <motion.div
                  className="absolute inset-0 rounded-2xl border border-emerald-400/20"
                  animate={{ scale: [1, 1.9], opacity: [0.3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 1.8 }}
                />
                <div className="relative w-28 h-28 rounded-2xl bg-emerald-500/[0.07] dark:bg-emerald-500/[0.1] border border-emerald-400/25 dark:border-emerald-400/20 flex items-center justify-center shadow-[0_0_40px_rgba(6,214,160,0.12)]">
                  <Database className="w-12 h-12 text-emerald-500 dark:text-emerald-400" />
                </div>
              </div>
              <p className="mt-5 font-semibold text-sm text-gray-900 dark:text-white">Database</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 text-center leading-relaxed">Supabase Cloud Storage</p>
            </motion.div>
          </div>

          {/* Step descriptions */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { num: "01", color: "#6C63FF", title: "Register Product", desc: "Manufacturer submits product details via the web dashboard" },
              { num: "02", color: "#F59E0B", title: "On-Chain Record", desc: "Smart contract writes an immutable record to Ethereum Sepolia" },
              { num: "03", color: "#06D6A0", title: "Metadata Stored", desc: "Product info and images are saved in Supabase for fast retrieval" },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.4 }}
                className="text-center"
              >
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: `${step.color}99` }}>
                  {step.num}
                </p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">{step.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="relative border-t border-gray-100 dark:border-white/[0.06] px-8 py-28">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3">Why Blockchain Authentication?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
              Enterprise-grade product security powered by decentralized technology
            </p>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="group p-8 rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] hover:border-[#6C63FF]/25 dark:hover:border-[#6C63FF]/25 hover:shadow-xl hover:shadow-[#6C63FF]/5 dark:hover:shadow-[#6C63FF]/[0.04] transition-all duration-300 cursor-default"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#6C63FF]/[0.06] dark:bg-[#6C63FF]/15 border border-[#6C63FF]/15 dark:border-[#6C63FF]/20 flex items-center justify-center mb-6 group-hover:bg-[#6C63FF]/10 dark:group-hover:bg-[#6C63FF]/25 transition">
                    <Icon className="w-6 h-6 text-[#6C63FF] dark:text-[#9D97FF]" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed">
                    {f.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
