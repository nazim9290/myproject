import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { REPORT_PIPELINE_FUNNEL, SOURCE_DATA, DROPOUT_DATA } from "../../data/mockData";

export default function ReportsPage({ students }) {
  const t = useTheme();
  const toast = useToast();
  const [activeReport, setActiveReport] = useState("funnel");

  const totalVisitors = 320;
  const totalArrived = 58;
  const overallConversion = Math.round((totalArrived / totalVisitors) * 100);
  const costPerStudent = Math.round(270000 / totalArrived);

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">রিপোর্ট ও বিশ্লেষণ</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>পারফরম্যান্স রিপোর্ট ও বিশ্লেষণ</p>
        </div>
        <Button variant="ghost" icon={Download} size="xs" onClick={() => {
          const rows = (students || []).map(s => `"${s.id}","${s.name_en}","${s.status}","${s.country || ""}","${s.school || ""}","${s.batch || ""}","${s.source || ""}","${s.branch || ""}"`);
          const csv = "ID,নাম,স্ট্যাটাস,দেশ,স্কুল,ব্যাচ,সোর্স,ব্রাঞ্চ\n" + rows.join("\n");
          const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
          Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `Analytics_Report_${new Date().toISOString().slice(0,10)}.csv` }).click();
          toast.exported(`Analytics Report (${(students || []).length} students)`);
        }}>সব এক্সপোর্ট</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "সামগ্রিক কনভার্শন", value: `${overallConversion}%`, color: t.emerald, icon: TrendingUp },
          { label: "স্টুডেন্ট প্রতি খরচ", value: `৳${(costPerStudent / 1000).toFixed(1)}K`, color: t.amber, icon: DollarSign },
          { label: "মোট এসেছে (YTD)", value: totalArrived, color: t.cyan, icon: TrendingUp },
          { label: "ঝরে পড়ার হার", value: "12%", color: t.rose, icon: TrendingDown },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 50}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {[
          { key: "funnel", label: "📊 পাইপলাইন ফানেল" },
          { key: "source", label: "📡 সোর্স বিশ্লেষণ" },
          { key: "dropout", label: "📉 ড্রপআউট রিপোর্ট" },
          { key: "country", label: "🌏 দেশভিত্তিক" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveReport(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
            style={{ background: activeReport === tab.key ? `${t.cyan}15` : "transparent", color: activeReport === tab.key ? t.cyan : t.muted }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeReport === "funnel" && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-4">Pipeline Conversion Funnel (2025-2026)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={REPORT_PIPELINE_FUNNEL} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
              <XAxis type="number" tick={{ fill: t.chartAxisTick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" tick={{ fill: t.chartAxisTick, fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: t.text }} />
              <Bar dataKey="count" fill={t.cyan} radius={[0, 8, 8, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4" style={{ borderTop: `1px solid ${t.border}` }}>
            <div className="text-center"><p className="text-xs" style={{ color: t.muted }}>Visitor → Enrolled</p><p className="text-lg font-bold" style={{ color: t.amber }}>45%</p></div>
            <div className="text-center"><p className="text-xs" style={{ color: t.muted }}>Enrolled → Visa</p><p className="text-lg font-bold" style={{ color: t.purple }}>45%</p></div>
            <div className="text-center"><p className="text-xs" style={{ color: t.muted }}>Visitor → Arrived</p><p className="text-lg font-bold" style={{ color: t.emerald }}>18%</p></div>
          </div>
        </Card>
      )}

      {activeReport === "source" && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-4">Source-wise Conversion</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["সোর্স", "Visitors", "Enrolled", "Conversion %", "গ্রাফ"].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SOURCE_DATA.map((s) => (
                  <tr key={s.source} style={{ borderBottom: `1px solid ${t.border}` }}
                    onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td className="py-3 px-3 font-semibold">{s.source}</td>
                    <td className="py-3 px-3 font-mono">{s.visitors}</td>
                    <td className="py-3 px-3 font-mono" style={{ color: t.emerald }}>{s.enrolled}</td>
                    <td className="py-3 px-3 font-bold" style={{ color: s.conversion >= 45 ? t.emerald : t.amber }}>{s.conversion}%</td>
                    <td className="py-3 px-3 w-40">
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: `${t.muted}20` }}>
                        <div className="h-full rounded-full" style={{ width: `${s.conversion}%`, background: s.conversion >= 45 ? t.emerald : t.amber }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] mt-3 p-2 rounded-lg" style={{ background: `${t.emerald}08`, color: t.emerald }}>💡 Agent source সবচেয়ে বেশি convert করছে (51%) — Agent network বাড়ানো উচিত</p>
        </Card>
      )}

      {activeReport === "dropout" && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-4">Dropout Analysis — কোন ধাপে কতজন ঝরে যাচ্ছে</h3>
          <div className="space-y-3">
            {DROPOUT_DATA.map((d, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-40 text-xs shrink-0" style={{ color: t.textSecondary }}>{d.stage}</span>
                <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: `${t.muted}15` }}>
                  <div className="h-full rounded-lg flex items-center px-2" style={{ width: `${d.pct}%`, background: d.pct >= 30 ? `${t.rose}60` : `${t.amber}60` }}>
                    <span className="text-[10px] font-bold">{d.count} জন</span>
                  </div>
                </div>
                <span className="text-xs font-bold w-10 text-right" style={{ color: d.pct >= 30 ? t.rose : t.amber }}>{d.pct}%</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-4 p-2 rounded-lg" style={{ background: `${t.amber}08`, color: t.amber }}>💡 Enrollment পর্যায়ে ৪৫% dropout — financial counseling ও flexible কিস্তি plan বাড়ালে dropout কমবে</p>
        </Card>
      )}

      {activeReport === "country" && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-4">Country-wise Student Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { country: "Japan 🇯🇵", students: 192, pct: 78, arrived: 48, revenue: "৳85L", color: t.rose },
              { country: "Germany 🇩🇪", students: 30, pct: 12, arrived: 5, revenue: "৳12L", color: t.amber },
              { country: "Korea 🇰🇷", students: 23, pct: 10, arrived: 5, revenue: "৳8L", color: t.cyan },
            ].map((c, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: `${c.color}08`, border: `1px solid ${c.color}20` }}>
                <p className="text-sm font-bold mb-3">{c.country}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs"><span style={{ color: t.muted }}>স্টুডেন্ট</span><span className="font-bold" style={{ color: c.color }}>{c.students} ({c.pct}%)</span></div>
                  <div className="flex justify-between text-xs"><span style={{ color: t.muted }}>পৌঁছেছে</span><span className="font-bold">{c.arrived}</span></div>
                  <div className="flex justify-between text-xs"><span style={{ color: t.muted }}>আয়</span><span className="font-bold" style={{ color: t.emerald }}>{c.revenue}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
