import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { reports } from "../../lib/api";

/**
 * ReportsPage — রিপোর্ট ও বিশ্লেষণ
 * API থেকে real data: pipeline funnel, source analysis, dropout, country-wise
 */
export default function ReportsPage() {
  const t = useTheme();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState("funnel");

  // ── API থেকে analytics data লোড ──
  useEffect(() => {
    (async () => {
      try {
        const d = await reports.analytics();
        setData(d);
      } catch (err) {
        console.error("Reports load error:", err);
      }
      setLoading(false);
    })();
  }, []);

  // ── Currency format ──
  const fmt = (n) => `৳${Number(n || 0).toLocaleString("en-IN")}`;
  const fmtShort = (n) => {
    const num = Number(n || 0);
    if (num >= 100000) return `৳${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `৳${(num / 1000).toFixed(0)}K`;
    return fmt(num);
  };

  // ── CSV Export ──
  const doExport = () => {
    if (!data) return;
    const rows = (data.pipeline || []).map(p => `"${p.stage}","${p.count}"`);
    const csv = "পর্যায়,সংখ্যা\n" + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`,
    }).click();
    toast.exported(`Analytics Report (${(data.pipeline || []).length} rows)`);
  };

  // ── লোডিং ──
  if (loading) {
    return (
      <div className="space-y-5 anim-fade">
        <h2 className="text-xl font-bold">Reports & Analytics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <Card key={i} delay={i*50}><div className="h-16 animate-pulse rounded-lg" style={{ background: `${t.muted}15` }} /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-5 anim-fade">
        <h2 className="text-xl font-bold">Reports & Analytics</h2>
        <Card><p className="text-xs text-center py-10" style={{ color: t.muted }}>ডাটা লোড করতে সমস্যা হয়েছে</p></Card>
      </div>
    );
  }

  const kpi = data.kpi || {};

  // ── Pipeline funnel chart — active statuses only (CANCELLED/PAUSED বাদ) ──
  const funnelData = (data.pipeline || []).filter(p => !["CANCELLED","PAUSED"].includes(p.status));

  // ── Pipeline conversion rates ──
  const pMap = {};
  (data.pipeline || []).forEach(p => { pMap[p.status] = p.count; });
  const visitorCount = (pMap.VISITOR || 0) + (pMap.FOLLOW_UP || 0);
  const enrolledCount = kpi.totalStudents - (pMap.VISITOR || 0) - (pMap.FOLLOW_UP || 0) - (pMap.CANCELLED || 0) - (pMap.PAUSED || 0);
  const visaCount = (pMap.VISA_GRANTED || 0) + (pMap.ARRIVED || 0) + (pMap.COMPLETED || 0);
  const convVisitorEnroll = visitorCount > 0 ? Math.round((enrolledCount / (visitorCount + enrolledCount)) * 100) : 0;
  const convEnrollVisa = enrolledCount > 0 ? Math.round((visaCount / enrolledCount) * 100) : 0;

  // ── Country flags ──
  const flagMap = { Japan: "🇯🇵", Germany: "🇩🇪", Korea: "🇰🇷", Canada: "🇨🇦", Australia: "🇦🇺", UK: "🇬🇧" };

  return (
    <div className="space-y-5 anim-fade">
      {/* হেডার */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">রিপোর্ট ও বিশ্লেষণ</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>পারফরম্যান্স রিপোর্ট ও বিশ্লেষণ</p>
        </div>
        <Button variant="ghost" icon={Download} size="xs" onClick={doExport}>Export</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Conversion Rate", value: `${kpi.overallConversion || 0}%`, color: t.emerald, icon: TrendingUp },
          { label: "খরচ/স্টুডেন্ট", value: fmtShort(kpi.costPerStudent), color: t.amber, icon: DollarSign },
          { label: "পৌঁছেছে (YTD)", value: kpi.totalArrived || 0, color: t.cyan, icon: TrendingUp },
          { label: "Dropout Rate", value: `${kpi.dropoutRate || 0}%`, color: t.rose, icon: TrendingDown },
        ].map((k, i) => (
          <Card key={i} delay={i * 50}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{k.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
              </div>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15` }}>
                <k.icon size={16} style={{ color: k.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {[
          { key: "funnel", label: "📊 পাইপলাইন ফানেল" },
          { key: "source", label: "📡 সোর্স বিশ্লেষণ" },
          { key: "dropout", label: "📉 Dropout রিপোর্ট" },
          { key: "country", label: "🌏 দেশ ভিত্তিক" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveReport(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: activeReport === tab.key ? (t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#ffffff") : "transparent",
              color: activeReport === tab.key ? t.text : t.muted,
              boxShadow: activeReport === tab.key && t.mode === "light" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Pipeline Funnel ═══ */}
      {activeReport === "funnel" && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-4">Pipeline Conversion Funnel</h3>
          {funnelData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
                  <XAxis type="number" tick={{ fill: t.chartAxisTick, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="stage" tick={{ fill: t.chartAxisTick, fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: t.text }} />
                  <Bar dataKey="count" fill={t.cyan} radius={[0, 8, 8, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-4 pt-4" style={{ borderTop: `1px solid ${t.border}` }}>
                <div className="text-center">
                  <p className="text-xs" style={{ color: t.muted }}>Visitor → Enrolled</p>
                  <p className="text-lg font-bold" style={{ color: t.amber }}>{convVisitorEnroll}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs" style={{ color: t.muted }}>Enrolled → Visa</p>
                  <p className="text-lg font-bold" style={{ color: t.purple }}>{convEnrollVisa}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs" style={{ color: t.muted }}>Overall Conversion</p>
                  <p className="text-lg font-bold" style={{ color: t.emerald }}>{kpi.overallConversion || 0}%</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-center py-10" style={{ color: t.muted }}>পর্যাপ্ত ডাটা নেই</p>
          )}
        </Card>
      )}

      {/* ═══ Source Analysis ═══ */}
      {activeReport === "source" && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-4">Source-wise Conversion</h3>
          {(data.sourceAnalysis || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["সোর্স", "মোট", "Enrolled", "পৌঁছেছে", "Conversion", "গ্রাফ"].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.sourceAnalysis.map(s => (
                    <tr key={s.source} style={{ borderBottom: `1px solid ${t.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td className="py-3 px-3 font-semibold">{s.source}</td>
                      <td className="py-3 px-3 font-mono">{s.visitors}</td>
                      <td className="py-3 px-3 font-mono" style={{ color: t.emerald }}>{s.enrolled}</td>
                      <td className="py-3 px-3 font-mono" style={{ color: t.cyan }}>{s.arrived}</td>
                      <td className="py-3 px-3 font-bold" style={{ color: s.conversion >= 45 ? t.emerald : t.amber }}>{s.conversion}%</td>
                      <td className="py-3 px-3 w-40">
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: `${t.muted}20` }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(s.conversion, 100)}%`, background: s.conversion >= 45 ? t.emerald : t.amber }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-center py-10" style={{ color: t.muted }}>পর্যাপ্ত ডাটা নেই</p>
          )}
        </Card>
      )}

      {/* ═══ Dropout Analysis ═══ */}
      {activeReport === "dropout" && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-4">Dropout বিশ্লেষণ — কোন ধাপে কতজন ঝরে যাচ্ছে</h3>
          {(data.dropoutAnalysis || []).length > 0 ? (
            <div className="space-y-3">
              {data.dropoutAnalysis.map((d, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-48 text-xs shrink-0" style={{ color: t.textSecondary }}>{d.stage}</span>
                  <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: `${t.muted}15` }}>
                    <div className="h-full rounded-lg flex items-center px-2"
                      style={{ width: `${Math.max(d.pct, 5)}%`, background: d.pct >= 30 ? `${t.rose}60` : `${t.amber}60` }}>
                      <span className="text-[10px] font-bold whitespace-nowrap">{d.count} জন</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold w-10 text-right" style={{ color: d.pct >= 30 ? t.rose : t.amber }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-center py-10" style={{ color: t.muted }}>কোনো dropout রেকর্ড নেই</p>
          )}
        </Card>
      )}

      {/* ═══ Country-wise ═══ */}
      {activeReport === "country" && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-4">Country-wise Student Distribution</h3>
          {(data.countryStats || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.countryStats.map((c, i) => {
                const colors = [t.rose, t.amber, t.cyan, t.purple, t.emerald];
                const color = colors[i % colors.length];
                return (
                  <div key={c.country} className="rounded-xl p-4" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                    <p className="text-sm font-bold mb-3">{c.country} {flagMap[c.country] || "🌍"}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs"><span style={{ color: t.muted }}>স্টুডেন্ট</span><span className="font-bold" style={{ color }}>{c.students} ({c.pct}%)</span></div>
                      <div className="flex justify-between text-xs"><span style={{ color: t.muted }}>পৌঁছেছে</span><span className="font-bold">{c.arrived}</span></div>
                      <div className="flex justify-between text-xs"><span style={{ color: t.muted }}>আনুমানিক আয়</span><span className="font-bold" style={{ color: t.emerald }}>{fmtShort(c.revenue)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-center py-10" style={{ color: t.muted }}>পর্যাপ্ত ডাটা নেই</p>
          )}
        </Card>
      )}
    </div>
  );
}
