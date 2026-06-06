"use client";

import { useState } from "react";
import {
  FileText,
  Calendar,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  FileDown,
  ChevronDown,
  CheckCircle,
  ShoppingCart,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ReportType = "registered-products" | "verification-records" | "sales";

interface ProductReportRow {
  kind: "product";
  id: string;
  name: string;
  manufacturer: string;
  location: string;
  date: string;
  status: string;
  etherscan: string;
}

interface SaleReportRow {
  kind: "sale";
  id: string;
  name: string;
  method: string;
  amount: string;
  date: string;
}

type ReportRow = ProductReportRow | SaleReportRow;

const PRODUCT_HEADERS = ["ID", "Product Name", "Manufacturer", "Location", "Date", "Status", "Etherscan"];
const SALE_HEADERS    = ["Sale ID", "Product Name", "Payment Method", "Amount (RM)", "Date"];

export default function GenerateReportPage() {
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const isSalesReport = reportType === "sales";

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (startDate && val && val < startDate) {
      setDateError("End date cannot be before start date.");
    } else {
      setDateError("");
    }
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (endDate && val && endDate < val) {
      setDateError("End date cannot be before start date.");
    } else {
      setDateError("");
    }
  };

  const handleGenerateReport = async () => {
    if (!reportType || !startDate || !endDate || dateError) return;

    setLoading(true);
    setHasData(null);
    setReportData([]);
    setExportMenuOpen(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { setLoading(false); setHasData(false); return; }

      if (isSalesReport) {
        // Get admin's product IDs first
        const { data: adminProducts } = await supabase
          .from("products")
          .select("id")
          .eq("user_id", user.id);

        const productIds = adminProducts?.map((p) => p.id) ?? [];

        if (productIds.length === 0) {
          setLoading(false);
          setHasData(false);
          return;
        }

        const { data, error } = await supabase
          .from("sales")
          .select("*")
          .in("product_id", productIds)
          .gte("created_at", `${startDate}T00:00:00`)
          .lte("created_at", `${endDate}T23:59:59`)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setLoading(false);

        if (!data || data.length === 0) { setHasData(false); return; }

        setHasData(true);
        setReportData(
          data.map((s) => ({
            kind: "sale" as const,
            id: `SLE-${s.id.slice(0, 8).toUpperCase()}`,
            name: s.product_name,
            method: s.payment_method,
            amount: Number(s.amount).toFixed(2),
            date: new Date(s.created_at).toLocaleDateString("en-GB"),
          }))
        );
      } else {
        // Products report
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", `${startDate}T00:00:00`)
          .lte("created_at", `${endDate}T23:59:59`)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setLoading(false);

        if (!data || data.length === 0) { setHasData(false); return; }

        setHasData(true);
        setReportData(
          data.map((p) => ({
            kind: "product" as const,
            id: `PRD-${p.id.slice(0, 8).toUpperCase()}`,
            name: p.product_name,
            manufacturer: p.manufacturer,
            location: p.location || "—",
            date: new Date(p.created_at).toLocaleDateString("en-GB"),
            status: reportType === "verification-records" ? "Verified" : "Registered",
            etherscan: p.tx_hash
              ? `https://sepolia.etherscan.io/tx/${p.tx_hash}`
              : "N/A",
          }))
        );
      }
    } catch {
      setLoading(false);
      setHasData(false);
    }
  };

  const reportTitle =
    reportType === "registered-products"  ? "Registered Products Report"   :
    reportType === "verification-records" ? "Verification Records Report"  :
    reportType === "sales"                ? "Sales Report"                 :
    "Report";

  const filename = `report-${reportType}-${startDate}-to-${endDate}`;

  const tableHeaders = isSalesReport ? SALE_HEADERS : PRODUCT_HEADERS;

  const tableRows: string[][] = reportData.map((r) =>
    r.kind === "sale"
      ? [r.id, r.name, r.method, r.amount, r.date]
      : [r.id, r.name, r.manufacturer, r.location, r.date, r.status, r.etherscan]
  );

  // Total revenue row (sales only)
  const totalRevenue = isSalesReport
    ? reportData.reduce((sum, r) => sum + (r.kind === "sale" ? parseFloat(r.amount) : 0), 0)
    : null;

  // ── Shared analytics helpers ─────────────────────────────────────────────
  const _dailyCounts = (): [string, number][] => {
    const map: Record<string, number> = {};
    reportData.forEach((r) => { map[r.date] = (map[r.date] ?? 0) + 1; });
    return Object.entries(map).sort(([a], [b]) => {
      const p = (d: string) => { const [dd, mm, yy] = d.split("/").map(Number); return new Date(yy, mm - 1, dd).getTime(); };
      return p(a) - p(b);
    });
  };

  const _paymentCounts = (): [string, number, number][] => {
    const map: Record<string, { count: number; revenue: number }> = {};
    reportData.forEach((r) => {
      if (r.kind !== "sale") return;
      if (!map[r.method]) map[r.method] = { count: 0, revenue: 0 };
      map[r.method].count++;
      map[r.method].revenue += parseFloat(r.amount);
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([m, v]) => [m, v.count, v.revenue]);
  };

  const _locationCounts = (): [string, number][] => {
    const map: Record<string, number> = {};
    reportData.forEach((r) => {
      if (r.kind !== "product") return;
      const loc = r.location && r.location !== "—" ? r.location : "Not specified";
      map[loc] = (map[loc] ?? 0) + 1;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  };

  // ── CSV export ───────────────────────────────────────────────────────────
  const exportCSV = () => {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const today = new Date().toLocaleDateString("en-GB");
    const daily = _dailyCounts();

    const summaryLines: string[] = [
      `# VerifyChain — ${reportTitle}`,
      `# Period: ${startDate} to ${endDate}`,
      `# Generated: ${today}`,
      `# Total Records: ${reportData.length}`,
      "#",
      "# === ANALYTICS SUMMARY ===",
    ];

    if (isSalesReport && totalRevenue !== null) {
      const avg = reportData.length > 0 ? totalRevenue / reportData.length : 0;
      const pm = _paymentCounts();
      summaryLines.push(`# Total Revenue: RM ${totalRevenue.toFixed(2)}`);
      summaryLines.push(`# Average Sale Value: RM ${avg.toFixed(2)}`);
      if (pm.length > 0) summaryLines.push(`# Top Payment Method: ${pm[0][0]} (${pm[0][1]} sales)`);
      summaryLines.push("#");
      summaryLines.push("# Payment Method Breakdown:");
      pm.forEach(([m, c, r]) => summaryLines.push(`#   ${m}: ${c} sales — RM ${r.toFixed(2)}`));
    } else {
      const locs = _locationCounts();
      summaryLines.push(`# Unique Locations: ${locs.filter(([l]) => l !== "Not specified").length}`);
      summaryLines.push(`# Blockchain Verified: All records`);
      if (locs.length > 0) {
        summaryLines.push("#");
        summaryLines.push("# Location Breakdown:");
        locs.forEach(([l, c]) => summaryLines.push(`#   ${l}: ${c} product${c !== 1 ? "s" : ""}`));
      }
    }

    summaryLines.push("#");
    summaryLines.push("# Daily Breakdown:");
    daily.forEach(([d, c]) => summaryLines.push(`#   ${d}: ${c} record${c !== 1 ? "s" : ""}`));
    summaryLines.push("#");
    summaryLines.push("# === DATA ===");

    const dataRows = isSalesReport && totalRevenue !== null
      ? [...tableRows, ["", "", "", `Total: RM ${totalRevenue.toFixed(2)}`, ""]]
      : tableRows;

    const csv = [
      ...summaryLines,
      tableHeaders.map(escape).join(","),
      ...dataRows.map((r) => r.map(escape).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  // ── Excel export ─────────────────────────────────────────────────────────
  const exportExcel = async () => {
    const XLSX = (await import("xlsx")).default;
    const wb = XLSX.utils.book_new();
    const today = new Date().toLocaleDateString("en-GB");
    const daily = _dailyCounts();

    // Summary sheet
    const summaryAoa: (string | number)[][] = [
      ["VerifyChain — " + reportTitle],
      ["Period", `${startDate} to ${endDate}`],
      ["Generated", today],
      ["Total Records", reportData.length],
      [],
      ["=== ANALYTICS SUMMARY ==="],
    ];

    if (isSalesReport && totalRevenue !== null) {
      const avg = reportData.length > 0 ? totalRevenue / reportData.length : 0;
      const pm = _paymentCounts();
      summaryAoa.push(["Total Revenue (RM)", totalRevenue]);
      summaryAoa.push(["Average Sale (RM)", parseFloat(avg.toFixed(2))]);
      summaryAoa.push([]);
      summaryAoa.push(["Payment Method", "Count", "Revenue (RM)"]);
      pm.forEach(([m, c, r]) => summaryAoa.push([m, c, parseFloat(r.toFixed(2))]));
    } else {
      const locs = _locationCounts();
      summaryAoa.push(["Unique Locations", locs.filter(([l]) => l !== "Not specified").length]);
      summaryAoa.push(["Blockchain Verified", "All records"]);
      summaryAoa.push([]);
      summaryAoa.push(["Location", "Count"]);
      locs.forEach(([l, c]) => summaryAoa.push([l, c]));
    }

    summaryAoa.push([]);
    summaryAoa.push(["=== DAILY BREAKDOWN ==="]);
    summaryAoa.push(["Date", "Records"]);
    daily.forEach(([d, c]) => summaryAoa.push([d, c]));

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
    wsSummary["!cols"] = [{ wch: 32 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Data sheet
    const wsData = XLSX.utils.aoa_to_sheet([tableHeaders, ...tableRows]);
    wsData["!cols"] = isSalesReport
      ? [{ wch: 16 }, { wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 14 }]
      : [{ wch: 14 }, { wch: 28 }, { wch: 24 }, { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wsData, "Data");

    XLSX.writeFile(wb, `${filename}.xlsx`);
    setExportMenuOpen(false);
  };

  // ── PDF export ───────────────────────────────────────────────────────────
  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape" });
    const W = 297; // A4 landscape width mm
    const margin = 14;
    const today = new Date().toLocaleDateString("en-GB");
    const daily = _dailyCounts();

    // ── Header bar ──────────────────────────────────────────────────────
    doc.setFillColor(108, 99, 255);
    doc.rect(0, 0, W, 18, "F");
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("VerifyChain", margin, 12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Blockchain Product Authentication", margin + 42, 12);

    // Report title + meta
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(reportTitle, margin, 30);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Period: ${startDate}  →  ${endDate}`, margin, 38);
    doc.text(`Generated: ${today}`, margin, 44);

    // ── KPI cards ───────────────────────────────────────────────────────
    const kpiY = 52;
    const kpiH = 24;
    const kpiW = 62;
    const kpiGap = 4;

    const kpis = isSalesReport && totalRevenue !== null
      ? [
          { label: "Total Sales",   value: String(reportData.length),                  r: 108, g: 99,  b: 255 },
          { label: "Total Revenue", value: `RM ${totalRevenue.toFixed(2)}`,            r: 255, g: 183, b: 3   },
          { label: "Average Sale",  value: `RM ${(totalRevenue / (reportData.length || 1)).toFixed(2)}`, r: 6, g: 214, b: 160 },
          { label: "Top Method",    value: _paymentCounts()[0]?.[0] ?? "—",            r: 239, g: 71,  b: 111 },
        ]
      : [
          { label: "Total Products",     value: String(reportData.length),                r: 108, g: 99,  b: 255 },
          { label: "Date Range",         value: `${startDate} – ${endDate}`,             r: 37,  g: 99,  b: 235 },
          { label: "Unique Locations",   value: String(_locationCounts().filter(([l]) => l !== "Not specified").length), r: 6, g: 214, b: 160 },
          { label: "Blockchain Verified", value: "All Records",                           r: 16,  g: 185, b: 129 },
        ];

    kpis.forEach((kpi, i) => {
      const x = margin + i * (kpiW + kpiGap);
      // Card background
      doc.setFillColor(kpi.r, kpi.g, kpi.b);
      doc.roundedRect(x, kpiY, kpiW, kpiH, 3, 3, "F");
      // Label
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 255, 255);
      doc.setGState(doc.GState({ opacity: 0.8 }));
      doc.text(kpi.label.toUpperCase(), x + 4, kpiY + 7);
      // Value
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setGState(doc.GState({ opacity: 1 }));
      doc.text(kpi.value, x + 4, kpiY + 18);
    });

    // ── Daily bar chart ──────────────────────────────────────────────────
    const chartY = kpiY + kpiH + 10;
    const chartH = 48;
    const chartW = isSalesReport ? 160 : W - margin * 2;
    const maxCount = Math.max(...daily.map(([, c]) => c), 1);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("Daily Records Distribution", margin, chartY - 3);

    // Chart background
    doc.setFillColor(248, 248, 252);
    doc.roundedRect(margin, chartY, chartW, chartH, 2, 2, "F");

    // Bars
    if (daily.length > 0) {
      const barSlot = (chartW - 10) / daily.length;
      const barW = Math.min(barSlot * 0.65, 14);
      daily.forEach(([date, count], i) => {
        const bh = Math.max((count / maxCount) * (chartH - 12), 2);
        const bx = margin + 5 + i * barSlot + (barSlot - barW) / 2;
        const by = chartY + chartH - 8 - bh;
        doc.setFillColor(108, 99, 255);
        doc.roundedRect(bx, by, barW, bh, 1, 1, "F");
        // Count label above bar
        if (count > 0) {
          doc.setFontSize(6);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(108, 99, 255);
          doc.text(String(count), bx + barW / 2, by - 1, { align: "center" });
        }
        // Date label below bar (show if ≤20 dates)
        if (daily.length <= 20) {
          doc.setFontSize(5.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(140, 140, 140);
          const label = date.slice(0, 5); // DD/MM
          doc.text(label, bx + barW / 2, chartY + chartH - 2, { align: "center" });
        }
      });
    } else {
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text("No data", margin + chartW / 2, chartY + chartH / 2, { align: "center" });
    }

    // ── Sales: payment method breakdown panel ────────────────────────────
    if (isSalesReport) {
      const pm = _paymentCounts();
      const panelX = margin + chartW + 8;
      const panelW = W - margin - panelX;

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text("Payment Methods", panelX, chartY - 3);

      doc.setFillColor(248, 248, 252);
      doc.roundedRect(panelX, chartY, panelW, chartH, 2, 2, "F");

      const pmColors = [[108, 99, 255], [6, 214, 160], [255, 183, 3], [239, 71, 111], [17, 138, 178]];
      pm.forEach(([method, count, revenue], i) => {
        const rowY = chartY + 8 + i * 10;
        if (rowY + 8 > chartY + chartH) return;
        const [r, g, b] = pmColors[i % pmColors.length];
        doc.setFillColor(r, g, b);
        doc.roundedRect(panelX + 4, rowY - 3, 4, 4, 1, 1, "F");
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        doc.text(`${method}`, panelX + 11, rowY);
        doc.setFont("helvetica", "bold");
        doc.text(`${count}x  RM ${revenue.toFixed(2)}`, panelX + panelW - 4, rowY, { align: "right" });
      });
    }

    // ── Products: location breakdown (right panel) ───────────────────────
    if (!isSalesReport) {
      // already using full width for bar chart — add location breakdown below
      const locs = _locationCounts().slice(0, 5);
      if (locs.length > 0) {
        const locY = chartY + chartH + 8;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(50, 50, 50);
        doc.text("Top Locations", margin, locY - 3);

        const locColors = [[108, 99, 255], [6, 214, 160], [255, 183, 3], [239, 71, 111], [17, 138, 178]];
        const totalLoc = locs.reduce((s, [, c]) => s + c, 0);
        locs.forEach(([loc, count], i) => {
          const lx = margin + i * ((W - margin * 2) / locs.length);
          const lw = (W - margin * 2) / locs.length - 3;
          const [r, g, b] = locColors[i % locColors.length];
          doc.setFillColor(r, g, b);
          doc.roundedRect(lx, locY, lw, 12, 2, 2, "F");
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text(`${count}`, lx + lw / 2, locY + 5, { align: "center" });
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "normal");
          const label = loc.length > 18 ? loc.slice(0, 18) + "…" : loc;
          doc.text(label, lx + lw / 2, locY + 10, { align: "center" });
          doc.setTextColor(180, 180, 180);
          doc.text(`${Math.round((count / totalLoc) * 100)}%`, lx + lw / 2, locY + 16, { align: "center" });
        });
      }
    }

    // ── Data table (new page) ────────────────────────────────────────────
    doc.addPage();

    doc.setFillColor(108, 99, 255);
    doc.rect(0, 0, W, 12, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${reportTitle} — Full Records (${reportData.length})`, margin, 8);

    autoTable(doc, {
      startY: 16,
      head: [tableHeaders],
      body: tableRows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [108, 99, 255], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [247, 246, 255] },
      columnStyles: isSalesReport
        ? { 0: { cellWidth: 28 }, 4: { cellWidth: 22 } }
        : { 0: { cellWidth: 22 }, 5: { cellWidth: 16 }, 6: { cellWidth: 55 } },
    });

    doc.save(`${filename}.pdf`);
    setExportMenuOpen(false);
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition";

  const isFormValid = reportType && startDate && endDate && !dateError;

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
          Generate Report
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Generate and export reports on registered products, verifications, and sales
        </p>
      </div>

      {/* Filter Section */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none p-7">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
          Report Filters
        </h2>

        <div className="grid grid-cols-3 gap-5">
          {/* Report Type */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className={`${inputClass} px-4 py-3`}
            >
              <option value="" className="bg-white dark:bg-neutral-900 text-gray-400">
                Select report type
              </option>
              <option value="registered-products" className="bg-white dark:bg-neutral-900">
                Registered Products
              </option>
              <option value="verification-records" className="bg-white dark:bg-neutral-900">
                Verification Records
              </option>
              <option value="sales" className="bg-white dark:bg-neutral-900">
                Sales Report
              </option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className={`${inputClass} pl-10 pr-4 py-3`}
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className={`${inputClass} pl-10 pr-4 py-3 ${dateError ? "border-red-400 dark:border-red-500/60" : ""}`}
              />
            </div>
            {dateError && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {dateError}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleGenerateReport}
            disabled={!isFormValid || loading}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSalesReport ? (
              <ShoppingCart className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Generate Report
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] p-8">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-gray-100 dark:bg-white/[0.06] animate-pulse"
                style={{ opacity: 1 - (i - 1) * 0.25 }}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-4">
            Fetching data from database...
          </p>
        </div>
      )}

      {/* No Data */}
      {hasData === false && (
        <div className="flex items-center gap-4 p-5 rounded-2xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            No records found for the selected report type and date range.
          </p>
        </div>
      )}

      {/* Report Table */}
      {hasData === true && reportData.length > 0 && (
        <>
          {/* Summary cards */}
          <div className={`grid gap-4 ${isSalesReport ? "grid-cols-3" : "grid-cols-2"}`}>
            <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] p-5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.length}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{reportTitle}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] p-5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date Range</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{startDate}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">→ {endDate}</p>
            </div>
            {isSalesReport && totalRevenue !== null && (
              <div className="rounded-2xl border border-orange-100 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/[0.06] p-5">
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">RM {totalRevenue.toFixed(2)}</p>
                <p className="text-[10px] text-orange-400 dark:text-orange-500 mt-1">From {reportData.length} sale{reportData.length !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>

        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none overflow-hidden">
          {/* Table toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {reportTitle}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {reportData.length} record{reportData.length !== 1 ? "s" : ""} · {startDate} to {endDate}
              </p>
            </div>

            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition"
              >
                <FileDown className="w-4 h-4" />
                Export
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {exportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-neutral-900 shadow-xl z-20 overflow-hidden">
                    <button onClick={exportCSV} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition">
                      <FileText className="w-4 h-4 text-gray-400" /> Export as CSV
                    </button>
                    <button onClick={exportExcel} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export as Excel
                    </button>
                    <button onClick={exportPDF} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition">
                      <FileDown className="w-4 h-4 text-red-500" /> Export as PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
                  {tableHeaders.map((h) => (
                    <th key={h} className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {reportData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition">
                    {row.kind === "sale" ? (
                      <>
                        <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">{row.id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{row.method}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-orange-600 dark:text-orange-400">
                          RM {row.amount}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{row.date}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">{row.id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{row.manufacturer}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{row.location}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{row.date}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" />
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {row.etherscan !== "N/A" ? (
                            <a
                              href={row.etherscan}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 font-mono text-xs"
                            >
                              View ↗
                            </a>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>

              {/* Footer — total row for sales */}
              <tfoot>
                <tr className="border-t border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
                  {isSalesReport ? (
                    <>
                      <td colSpan={3} className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Total ({reportData.length} sale{reportData.length !== 1 ? "s" : ""})
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-orange-600 dark:text-orange-400">
                        RM {totalRevenue?.toFixed(2)}
                      </td>
                      <td />
                    </>
                  ) : (
                    <>
                      <td colSpan={4} className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Total Records
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-gray-900 dark:text-white">
                        {reportData.length}
                      </td>
                    </>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </>
      )}
    </div>
  );
}
