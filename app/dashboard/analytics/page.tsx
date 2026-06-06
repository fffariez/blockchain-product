"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Package, Shield, TrendingUp, ShoppingCart, RefreshCw } from "lucide-react";

interface MonthPoint  { month: string; count: number }
interface ScanDay     { date: string; scans: number }
interface PieSlice    { name: string; value: number }
interface TopProduct  { name: string; scans: number }
interface RevenueMonth { month: string; revenue: number }

const PALETTE = ["#6C63FF", "#06D6A0", "#FFB703", "#EF476F", "#118AB2", "#073B4C"];

const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-white/10 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="font-semibold text-gray-900 dark:text-white">
        {prefix}{payload[0].value}{suffix}
      </p>
    </div>
  );
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [regTrend,     setRegTrend]     = useState<MonthPoint[]>([]);
  const [scanActivity, setScanActivity] = useState<ScanDay[]>([]);
  const [verifyData,   setVerifyData]   = useState<PieSlice[]>([]);
  const [topProducts,  setTopProducts]  = useState<TopProduct[]>([]);
  const [paymentData,  setPaymentData]  = useState<PieSlice[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueMonth[]>([]);

  const [totalProducts,  setTotalProducts]  = useState(0);
  const [totalScans,     setTotalScans]     = useState(0);
  const [verifiedRate,   setVerifiedRate]   = useState(0);
  const [totalRevenue,   setTotalRevenue]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const now = new Date();

      // --- Products ---
      const { data: products } = await supabase
        .from("products")
        .select("id, created_at, blockchain_product_id")
        .eq("user_id", user.id);

      const blockchainIds = (products ?? []).map((p) => p.blockchain_product_id).filter(Boolean);
      const productIds    = (products ?? []).map((p) => p.id);

      setTotalProducts(products?.length ?? 0);

      // Monthly registration trend — last 6 months
      const regMonths: MonthPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        regMonths.push({
          month: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
          count: (products ?? []).filter((p) => p.created_at?.startsWith(key)).length,
        });
      }
      setRegTrend(regMonths);

      // --- Scan logs ---
      let scanLogs: any[] = [];
      if (blockchainIds.length > 0) {
        const { data, error: scanErr } = await supabase
          .from("scan_logs")
          .select("is_verified, scanned_at, product_name")
          .in("blockchain_product_id", blockchainIds);
        if (scanErr) console.error("[Analytics] scan_logs error:", scanErr.message, scanErr.code);
        scanLogs = data ?? [];
      }

      setTotalScans(scanLogs.length);

      const verified   = scanLogs.filter((s) => s.is_verified).length;
      const unverified = scanLogs.length - verified;
      setVerifiedRate(scanLogs.length > 0 ? Math.round((verified / scanLogs.length) * 100) : 0);
      setVerifyData([
        { name: "Verified",   value: verified },
        { name: "Not Found",  value: unverified },
      ]);

      // Daily scan activity — last 30 days
      const daily: ScanDay[] = [];
      for (let i = 29; i >= 0; i--) {
        const d   = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().split("T")[0];
        daily.push({
          date:  i % 5 === 0 ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "",
          scans: scanLogs.filter((s) => s.scanned_at?.startsWith(key)).length,
        });
      }
      setScanActivity(daily);

      // Top 5 scanned products
      const counts: Record<string, number> = {};
      scanLogs.forEach((s) => {
        if (s.product_name) counts[s.product_name] = (counts[s.product_name] ?? 0) + 1;
      });
      setTopProducts(
        Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, scans]) => ({
            name: name.length > 22 ? name.slice(0, 22) + "…" : name,
            scans,
          }))
      );

      // --- Sales ---
      let sales: any[] = [];
      if (productIds.length > 0) {
        const { data } = await supabase
          .from("sales")
          .select("amount, payment_method, created_at")
          .in("product_id", productIds);
        sales = data ?? [];
      }

      setTotalRevenue(sales.reduce((s, r) => s + Number(r.amount), 0));

      // Payment method breakdown
      const pmCounts: Record<string, number> = {};
      sales.forEach((s) => {
        pmCounts[s.payment_method] = (pmCounts[s.payment_method] ?? 0) + 1;
      });
      setPaymentData(Object.entries(pmCounts).map(([name, value]) => ({ name, value })));

      // Monthly revenue — last 6 months
      const rev: RevenueMonth[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        rev.push({
          month:   d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
          revenue: sales
            .filter((s) => s.created_at?.startsWith(key))
            .reduce((sum, s) => sum + Number(s.amount), 0),
        });
      }
      setRevenueTrend(rev);
    } catch (err: any) {
      setFetchError(err?.message ?? "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const statCards = [
    { label: "Total Products",  value: totalProducts,            suffix: "",   icon: Package,     color: "blue" },
    { label: "Total Scans",     value: totalScans,               suffix: "",   icon: Shield,      color: "emerald" },
    { label: "Verified Rate",   value: verifiedRate,             suffix: "%",  icon: TrendingUp,  color: "purple" },
    { label: "Total Revenue",   value: `RM ${totalRevenue.toFixed(2)}`, suffix: "", icon: ShoppingCart, color: "orange" },
  ];

  const colorMap: Record<string, string> = {
    blue:    "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-600/10 border-blue-100 dark:border-blue-500/20",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-600/10 border-emerald-100 dark:border-emerald-500/20",
    purple:  "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-600/10 border-purple-100 dark:border-purple-500/20",
    orange:  "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-600/10 border-orange-100 dark:border-orange-500/20",
  };

  const card = "rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none p-6";
  const skeleton = "h-full bg-gray-100 dark:bg-white/[0.04] rounded-xl animate-pulse";

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">Detailed performance metrics for your products</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.08] transition disabled:opacity-50 flex-shrink-0 mt-1"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {fetchError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/25 bg-red-50 dark:bg-red-500/[0.08] text-red-700 dark:text-red-400 text-sm">
          <span className="font-medium">Failed to load data:</span> {fetchError}
          <button onClick={load} className="ml-auto text-xs underline hover:opacity-70">Retry</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={card}>
              <div className={`inline-flex p-3 rounded-xl border mb-4 ${colorMap[s.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{s.label}</p>
              <p className={`text-2xl font-bold text-gray-900 dark:text-white ${loading ? "animate-pulse text-gray-200 dark:text-gray-700" : ""}`}>
                {loading ? "—" : s.value}{typeof s.value === "number" ? s.suffix : ""}
              </p>
            </div>
          );
        })}
      </div>

      {/* Row 1 — Registration trend + Scan activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={card}>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Registration Trend</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Products registered per month (last 6 months)</p>
          {loading ? <div className="h-48"><div className={skeleton} /></div> : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={regTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6C63FF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip suffix=" products" />} />
                <Area type="monotone" dataKey="count" stroke="#6C63FF" strokeWidth={2.5}
                  fill="url(#regGrad)" dot={{ fill: "#6C63FF", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={card}>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Scan Activity</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Consumer verifications per day (last 30 days)</p>
          {loading ? <div className="h-48"><div className={skeleton} /></div> : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={scanActivity} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="scanGrad30" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06D6A0" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06D6A0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip suffix=" scans" />} />
                <Area type="monotone" dataKey="scans" stroke="#06D6A0" strokeWidth={2.5}
                  fill="url(#scanGrad30)" dot={false} activeDot={{ r: 4, fill: "#06D6A0" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2 — Verification rate + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={card}>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Scan Verification Rate</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Authentic vs counterfeit scan results</p>
          {loading ? <div className="h-52"><div className={skeleton} /></div> : verifyData.every((d) => d.value === 0) ? (
            <div className="flex items-center justify-center h-52 text-sm text-gray-400 dark:text-gray-500">No scan data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={verifyData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={4} dataKey="value">
                  {verifyData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#06D6A0" : "#EF476F"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, "scans"]} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(val) => <span className="text-xs text-gray-600 dark:text-gray-400">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={card}>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Top Scanned Products</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Most verified products by consumers</p>
          {loading ? <div className="h-52"><div className={skeleton} /></div> : topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-sm text-gray-400 dark:text-gray-500">No scan data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip suffix=" scans" />} />
                <Bar dataKey="scans" radius={[0, 6, 6, 0]} fill="#6C63FF" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3 — Payment methods + Revenue trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={card}>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Sales by Payment Method</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Breakdown of how customers paid</p>
          {loading ? <div className="h-52"><div className={skeleton} /></div> : paymentData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-sm text-gray-400 dark:text-gray-500">No sales data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={4} dataKey="value">
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, "sales"]} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(val) => <span className="text-xs text-gray-600 dark:text-gray-400">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={card}>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Monthly Revenue</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Total sales revenue per month (last 6 months)</p>
          {loading ? <div className="h-52"><div className={skeleton} /></div> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueTrend} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `RM${v}`} />
                <Tooltip content={<CustomTooltip prefix="RM " />} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#FFB703" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
