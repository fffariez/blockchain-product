"use client";

import { useEffect, useState } from "react";
import {
  Package, Shield, TrendingUp, CheckCircle, ShoppingCart, CreditCard, BarChart2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface Activity {
  product: string;
  manufacturer: string;
  time: string;
  id: string;
}

interface SaleActivity {
  product_name: string;
  payment_method: string;
  amount: number;
  time: string;
}

interface ScanDay {
  date: string;
  scans: number;
}

export default function DashboardPage() {
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [thisMonth, setThisMonth] = useState<number | null>(null);
  const [lastMonthProducts, setLastMonthProducts] = useState<number | null>(null);
  const [totalSales, setTotalSales] = useState<number | null>(null);
  const [thisMonthSales, setThisMonthSales] = useState<number | null>(null);
  const [lastMonthSales, setLastMonthSales] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [totalScans, setTotalScans] = useState<number | null>(null);
  const [thisMonthScans, setThisMonthScans] = useState<number | null>(null);
  const [lastMonthScans, setLastMonthScans] = useState<number | null>(null);
  const [scanChartData, setScanChartData] = useState<ScanDay[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentSales, setRecentSales] = useState<SaleActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      if (products) {
        setTotalProducts(products.length);
        setThisMonth(products.filter((p) => p.created_at >= startOfMonth).length);
        setLastMonthProducts(
          products.filter((p) => p.created_at >= lastMonthStart && p.created_at <= lastMonthEnd).length
        );
        setActivities(
          products.slice(0, 5).map((p) => ({
            product: p.product_name,
            manufacturer: p.manufacturer,
            time: new Date(p.created_at).toLocaleString("en-GB", {
              year: "numeric", month: "2-digit", day: "2-digit",
              hour: "2-digit", minute: "2-digit",
            }),
            id: `PRD-${p.id.slice(0, 8).toUpperCase()}`,
          }))
        );

        const blockchainIds = products.map((p) => p.blockchain_product_id).filter(Boolean);
        if (blockchainIds.length > 0) {
          try {
            const { data: allScans, error: scanErr } = await supabase
              .from("scan_logs")
              .select("scanned_at, is_verified")
              .in("blockchain_product_id", blockchainIds);
            if (scanErr) console.error("[Dashboard] scan_logs error:", scanErr.message);

            if (allScans) {
              setTotalScans(allScans.length);
              setThisMonthScans(allScans.filter((s) => s.scanned_at >= startOfMonth).length);
              setLastMonthScans(
                allScans.filter((s) => s.scanned_at >= lastMonthStart && s.scanned_at <= lastMonthEnd).length
              );

              const dayMap: Record<string, number> = {};
              for (let i = 6; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                dayMap[d.toISOString().split("T")[0]] = 0;
              }
              allScans.forEach((s) => {
                const key = s.scanned_at?.split("T")[0];
                if (key && key in dayMap) dayMap[key]++;
              });
              setScanChartData(
                Object.entries(dayMap).map(([dateStr, scans]) => ({
                  date: DAY_LABELS[new Date(dateStr).getDay()],
                  scans,
                }))
              );
            }
          } catch {
            setTotalScans(0);
            setThisMonthScans(0);
            setLastMonthScans(0);
          }
        } else {
          setTotalScans(0);
          setThisMonthScans(0);
          setLastMonthScans(0);
          setScanChartData(
            Array.from({ length: 7 }, (_, i) => {
              const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
              return { date: DAY_LABELS[d.getDay()], scans: 0 };
            })
          );
        }
      }

      const productIds = products?.map((p) => p.id) ?? [];
      if (productIds.length > 0) {
        const { data: sales } = await supabase
          .from("sales")
          .select("*")
          .in("product_id", productIds)
          .order("created_at", { ascending: false });

        if (sales) {
          setTotalSales(sales.length);
          setTotalRevenue(sales.reduce((sum, s) => sum + Number(s.amount), 0));
          setThisMonthSales(sales.filter((s) => s.created_at >= startOfMonth).length);
          setLastMonthSales(
            sales.filter((s) => s.created_at >= lastMonthStart && s.created_at <= lastMonthEnd).length
          );
          setRecentSales(
            sales.slice(0, 5).map((s) => ({
              product_name: s.product_name,
              payment_method: s.payment_method,
              amount: Number(s.amount),
              time: new Date(s.created_at).toLocaleString("en-GB", {
                year: "numeric", month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit",
              }),
            }))
          );
        }
      } else {
        setTotalSales(0);
        setTotalRevenue(0);
        setThisMonthSales(0);
        setLastMonthSales(0);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  function TrendBadge({ current, previous, noun }: { current: number | null; previous: number | null; noun: string }) {
    if (current === null || previous === null) return null;
    const diff = current - previous;
    if (diff === 0) return <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">Same as last month</span>;
    const up = diff > 0;
    return (
      <span className={`text-[10px] font-semibold ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
        {up ? "↑" : "↓"} {Math.abs(diff)} {noun} vs last month
      </span>
    );
  }

  const stats = [
    {
      title: "Total Registered",
      value: loading ? "—" : String(totalProducts ?? 0),
      icon: Package,
      color: "blue",
      trend: <TrendBadge current={thisMonth} previous={lastMonthProducts} noun="new" />,
    },
    {
      title: "Total Scans",
      value: loading ? "—" : String(totalScans ?? 0),
      icon: Shield,
      color: "emerald",
      trend: <TrendBadge current={thisMonthScans} previous={lastMonthScans} noun="scans" />,
    },
    {
      title: "This Month",
      value: loading ? "—" : String(thisMonth ?? 0),
      icon: TrendingUp,
      color: "purple",
      trend: <TrendBadge current={thisMonth} previous={lastMonthProducts} noun="products" />,
    },
    {
      title: "Total Sales",
      value: loading ? "—" : String(totalSales ?? 0),
      icon: ShoppingCart,
      color: "orange",
      trend: <TrendBadge current={thisMonthSales} previous={lastMonthSales} noun="sales" />,
    },
  ];

  const colorMap = {
    blue:    { bg: "bg-blue-100 dark:bg-blue-600/[0.1]",    border: "border-blue-200 dark:border-blue-500/20",    icon: "text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-600/[0.08]", border: "border-emerald-200 dark:border-emerald-500/20", icon: "text-emerald-600 dark:text-emerald-400" },
    purple:  { bg: "bg-purple-100 dark:bg-purple-600/[0.08]",  border: "border-purple-200 dark:border-purple-500/20",  icon: "text-purple-600 dark:text-purple-400" },
    orange:  { bg: "bg-orange-100 dark:bg-orange-600/[0.08]",  border: "border-orange-200 dark:border-orange-500/20",  icon: "text-orange-600 dark:text-orange-400" },
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Product authentication analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color as keyof typeof colorMap];
          return (
            <div
              key={index}
              className="rounded-2xl p-6 border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none hover:shadow-md dark:hover:bg-white/[0.05] transition"
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`p-3 rounded-xl border ${colors.bg} ${colors.border}`}>
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">{stat.title}</p>
              <h2 className={`text-3xl font-bold text-gray-900 dark:text-white mb-2 ${loading ? "animate-pulse text-gray-300 dark:text-gray-700" : ""}`}>
                {stat.value}
              </h2>
              <div className="min-h-[14px]">{!loading && stat.trend}</div>
            </div>
          );
        })}
      </div>

      {/* Scan Activity Chart */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Scan Activity</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Consumer verifications over the last 7 days</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">7-day view</span>
          </div>
        </div>
        {loading ? (
          <div className="h-48 bg-gray-100 dark:bg-white/[0.04] rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={scanChartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06D6A0" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06D6A0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: "10px",
                  fontSize: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
                formatter={(v: number) => [v, "Scans"]}
              />
              <Area
                type="monotone"
                dataKey="scans"
                stroke="#06D6A0"
                strokeWidth={2.5}
                fill="url(#scanGradient)"
                dot={{ fill: "#06D6A0", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#06D6A0" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Revenue banner */}
      {!loading && (totalRevenue ?? 0) > 0 && (
        <div className="rounded-2xl p-5 border border-orange-100 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/[0.06] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-500/15 border border-orange-200 dark:border-orange-500/20">
            <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-orange-800 dark:text-orange-300">RM {totalRevenue?.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Registrations</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Latest product registrations</p>
          </div>
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />)}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center mb-4">
                <Package className="w-7 h-7 text-blue-400 dark:text-blue-500" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No products yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Register your first product to get started</p>
              <a href="/dashboard/register-product" className="text-xs font-semibold text-[#6C63FF] dark:text-[#9D97FF] hover:underline">
                Register a product →
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{activity.product}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{activity.manufacturer} · {activity.id}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-right flex-shrink-0 ml-2">{activity.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Sales</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Latest purchases from the mobile app</p>
          </div>
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />)}
            </div>
          ) : recentSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center mb-4">
                <ShoppingCart className="w-7 h-7 text-orange-400 dark:text-orange-500" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No sales yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Sales will appear here once customers make purchases</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSales.map((sale, index) => (
                <div key={index} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex-shrink-0">
                      <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{sale.product_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{sale.payment_method}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">RM {sale.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{sale.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
