"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, PackagePlus, Boxes, FileText, LogOut, Shield, UserCircle, Sun, Moon, BarChart2,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCompanyName(user.user_metadata?.company_name ?? "");
        setAdminName(user.user_metadata?.admin_name ?? user.email ?? "");
      }
    });
  }, []);

  const initials = companyName
    ? companyName.slice(0, 2).toUpperCase()
    : adminName
    ? adminName.slice(0, 2).toUpperCase()
    : "AD";

  const navItems = [
    { label: "Dashboard",        href: "/dashboard",                  icon: LayoutDashboard },
    { label: "Analytics",        href: "/dashboard/analytics",        icon: BarChart2 },
    { label: "Register Product", href: "/dashboard/register-product", icon: PackagePlus },
    { label: "Product Catalog",  href: "/dashboard/catalog",          icon: Boxes },
    { label: "Generate Report",  href: "/dashboard/reports-feature",  icon: FileText },
    { label: "Profile",          href: "/dashboard/profile",          icon: UserCircle },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <div className="w-64 min-h-screen border-r border-gray-100 dark:border-white/[0.06] bg-white dark:bg-neutral-950 flex flex-col">
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6C63FF] flex items-center justify-center shadow-lg shadow-[#6C63FF]/25 flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-0.5">
                VerifyChain
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none truncate">
                {companyName || "Admin Panel"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col px-3 py-4 gap-0.5 flex-1">
          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-widest px-3 mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-[#6C63FF]/[0.08] dark:bg-[#6C63FF]/[0.12] text-[#6C63FF] dark:text-[#9D97FF] border border-[#6C63FF]/20"
                    : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white border border-transparent"
                }`}
              >
                <Icon
                  size={18}
                  className={`flex-shrink-0 transition ${
                    isActive
                      ? "text-[#6C63FF] dark:text-[#9D97FF]"
                      : "text-gray-500 dark:text-gray-500 group-hover:text-gray-800 dark:group-hover:text-gray-300"
                  }`}
                />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6C63FF] dark:bg-[#9D97FF]" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 pb-4 pt-3 border-t border-gray-100 dark:border-white/[0.06] space-y-1">
          {/* User profile card */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] mb-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6C63FF, #9D97FF)" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">
                {adminName || "Admin"}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight">
                {companyName || "Administrator"}
              </p>
            </div>
          </div>

          {/* Dark / Light mode toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white transition-all duration-200 border border-transparent group"
            >
              {theme === "dark" ? (
                <Sun size={18} className="flex-shrink-0 text-amber-500 group-hover:text-amber-400 transition" />
              ) : (
                <Moon size={18} className="flex-shrink-0 text-indigo-500 group-hover:text-indigo-400 transition" />
              )}
              <span className="font-medium text-sm">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </button>
          )}

          {/* Logout */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/[0.08] transition-all duration-200 border border-transparent hover:border-red-100 dark:hover:border-red-500/15 group"
          >
            <LogOut size={18} className="flex-shrink-0 group-hover:text-red-500 dark:group-hover:text-red-400 transition" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-white/[0.08] shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Confirm Logout</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">You will be returned to the login page.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition shadow-lg shadow-red-600/25"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
