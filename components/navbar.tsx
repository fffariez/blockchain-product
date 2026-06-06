"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { ModeToggle } from "./mode-toggle";

export default function Navbar() {
  return (
    <nav className="w-full sticky top-0 z-50 h-16 border-b border-black/[0.06] dark:border-white/[0.06] bg-white/90 dark:bg-black/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#6C63FF] flex items-center justify-center shadow-md shadow-[#6C63FF]/30 group-hover:shadow-[#6C63FF]/50 transition-all duration-300">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white tracking-tight">
            Verify<span className="text-[#6C63FF]">Chain</span>
          </span>
        </Link>

        <ModeToggle />
      </div>
    </nav>
  );
}
