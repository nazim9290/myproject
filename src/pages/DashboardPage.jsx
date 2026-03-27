import { useState, useEffect } from "react";
import { Users, DollarSign, FileText, Plane, TrendingUp, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../context/ThemeContext";
import Card from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PIPELINE_STATUSES } from "../data/students";
import { dashboard } from "../lib/api";

/**
 * DashboardPage — মূল ড্যাশবোর্ড
 * API থেকে real-time stats, pipeline, revenue, alerts দেখায়
 */
export default function DashboardPage() {
  const t = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── API থেকে stats লোড ──
  useEffect(() => {
    (async () => {
      try {
        const d = await dashboard.stats();
        setData(d);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
      setLoading(false);
    })();
  }, []);

  // ── লোডিং স্টেট ──
  if (loading) {
    return (
      <div className="space-y-5 anim-fade">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">ড্যাশবোর্ড</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>লোড হচ্ছে...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} delay={i * 60}>
              <div className="h-20 animate-pulse rounded-lg" style={{ background: `${t.muted}15` }} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── ডাটা না থাকলে ──
  if (!data) {
    return (
      <div className="space-y-5 anim-fade">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <Card><p className="text-xs text-center py-10" style={{ color: t.muted }}>ডাটা লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।</p></Card>
      </div>
    );
  }

  // ── আজকের তারিখ বাংলায় ──
  const today = new Date();
  const bnMonths = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
  const dateStr = `আজ ${today.getDate()} ${bnMonths[today.getMonth()]}, ${today.getFullYear()}`;

  // ── Pipeline chart data — PIPELINE_STATUSES থেকে label নিয়ে ──
  const pipelineChart = (data.pipeline || []).map(p => {
    const ps = PIPELINE_STATUSES.find(s => s.code === p.status);
    return { stage: ps ? ps.label : p.status, count: p.count };
  }).slice(0, 8); // শীর্ষ ৮টি দেখাবে

  // ── Currency format ──
  const fmt = (n) => `৳${Number(n || 0).toLocaleString("en-IN")}`;
  const fmtShort = (n) => {
    const num = Number(n || 0);
    if (num >= 100000) return `৳${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `৳${(num / 1000).toFixed(0)}K`;
    return fmt(num);
  };

  return (
    <div className="space-y-5 anim-fade">
      {/* ── হেডার ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Dashboard</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{dateStr}</p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Users, label: "মোট স্টুডেন্ট", value: data.students.total,
            sub: `Active: ${data.students.active}`, color: t.cyan,
          },
          {
            icon: DollarSign, label: "এই মাসের আয়", value: fmtShort(data.revenue.thisMonth),
            sub: `বকেয়া: ${fmtShort(data.dues)}`, color: t.emerald,
          },
          {
            icon: FileText, label: "ডক প্রসেসিং", value: data.docInProgress,
            sub: "ডকুমেন্ট পর্যায়ে আছে", color: t.amber,
          },
          {
            icon: Plane, label: "ভিসা/পৌঁছেছে", value: data.visaGranted,
            sub: "ভিসা পেয়েছে বা পৌঁছেছে", color: t.purple,
          },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 60}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
                <p className="mt-1.5 text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{kpi.sub}</p>
              </div>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* ── Monthly Revenue Chart ── */}
        <Card className="col-span-12 lg:col-span-8" delay={250}>
          <h3 className="text-sm font-semibold mb-4">মাসিক আয়</h3>
          {data.revenue.monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.revenue.monthly}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={t.cyan} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={t.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
                <XAxis dataKey="month" tick={{ fill: t.chartAxisTick, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: t.chartAxisTick, fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: t.text }}
                  formatter={(v) => [fmt(v), "আয়"]} />
                <Area type="monotone" dataKey="amount" stroke={t.cyan} strokeWidth={2} fill="url(#rg)" dot={{ fill: t.cyan, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-center py-10" style={{ color: t.muted }}>এখনো কোনো পেমেন্ট রেকর্ড নেই</p>
          )}
        </Card>

        {/* ── Alerts ── */}
        <Card className="col-span-12 lg:col-span-4" delay={300}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">সতর্কতা</h3>
            {data.alerts.filter(a => a.type === "critical").length > 0 && (
              <Badge color={t.rose} size="xs">{data.alerts.filter(a => a.type === "critical").length} critical</Badge>
            )}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.alerts.length > 0 ? data.alerts.map((a, i) => {
              const bg = a.type === "critical" ? `border-rose-500/20 bg-rose-500/5`
                : a.type === "warning" ? `border-amber-500/20 bg-amber-500/5`
                : `border-sky-500/20 bg-sky-500/5`;
              return (
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${bg}`}>
                  <span className="text-sm">{a.icon}</span>
                  <div>
                    <p className="text-[11px] leading-snug">{a.text}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: t.muted }}>{a.time}</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-xs text-center py-6" style={{ color: t.muted }}>কোনো সতর্কতা নেই</p>
            )}
          </div>
        </Card>

        {/* ── Pipeline Funnel ── */}
        <Card className="col-span-12 lg:col-span-6" delay={350}>
          <h3 className="text-sm font-semibold mb-3">পাইপলাইন ফানেল</h3>
          {pipelineChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pipelineChart} layout="vertical">
                <XAxis type="number" tick={{ fill: t.chartAxisTick, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="stage" tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: t.text }} />
                <Bar dataKey="count" fill={t.cyan} radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-center py-10" style={{ color: t.muted }}>কোনো স্টুডেন্ট নেই</p>
          )}
        </Card>

        {/* ── Recent Visitors ── */}
        <Card className="col-span-12 lg:col-span-6" delay={400}>
          <h3 className="text-sm font-semibold mb-3">সাম্প্রতিক ভিজিটর</h3>
          <div className="space-y-2">
            {(data.recentVisitors || []).length > 0 ? data.recentVisitors.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: `${t.cyan}08` }}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: `${t.cyan}20`, color: t.cyan }}>
                    {(v.name || v.name_en || "?").charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{v.name_bn || v.name_en || v.name}</p>
                    <p className="text-[10px]" style={{ color: t.muted }}>{v.source} • {(v.interested_countries || ["Japan"]).join(", ")}</p>
                  </div>
                </div>
                <Badge color={v.status === "Interested" ? t.emerald : v.status === "Enrolled" ? t.cyan : v.status === "Thinking" ? t.amber : t.muted} size="xs">
                  {v.status}
                </Badge>
              </div>
            )) : (
              <p className="text-xs text-center py-6" style={{ color: t.muted }}>কোনো ভিজিটর নেই</p>
            )}
          </div>
        </Card>

        {/* ── Upcoming Tasks ── */}
        {data.upcomingTasks && data.upcomingTasks.length > 0 && (
          <Card className="col-span-12" delay={450}>
            <h3 className="text-sm font-semibold mb-3">আসন্ন টাস্ক (৭ দিন)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.upcomingTasks.map((task) => {
                const isOverdue = new Date(task.due_date) < new Date();
                const priColor = task.priority === "high" ? t.rose : task.priority === "medium" ? t.amber : t.emerald;
                return (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg"
                    style={{ background: `${isOverdue ? t.rose : t.cyan}08`, border: `1px solid ${isOverdue ? t.rose : t.border}30` }}>
                    {isOverdue ? <AlertTriangle size={14} style={{ color: t.rose }} /> : <Clock size={14} style={{ color: t.muted }} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{task.title}</p>
                      <p className="text-[10px]" style={{ color: t.muted }}>{task.due_date}</p>
                    </div>
                    <Badge color={priColor} size="xs">{task.priority}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Quick Stats Row ── */}
        <Card className="col-span-12 lg:col-span-4" delay={500}>
          <div className="text-center py-3">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>মোট ভিজিটর</p>
            <p className="text-2xl font-bold mt-1" style={{ color: t.cyan }}>{data.visitors.total}</p>
            <p className="text-[10px]" style={{ color: t.muted }}>এই মাসে: {data.visitors.thisMonth}</p>
          </div>
        </Card>
        <Card className="col-span-12 lg:col-span-4" delay={550}>
          <div className="text-center py-3">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>এই মাসের ব্যয়</p>
            <p className="text-2xl font-bold mt-1" style={{ color: t.rose }}>{fmtShort(data.expenses.thisMonth)}</p>
            <p className="text-[10px]" style={{ color: t.muted }}>নিট: {fmtShort(data.revenue.thisMonth - data.expenses.thisMonth)}</p>
          </div>
        </Card>
        <Card className="col-span-12 lg:col-span-4" delay={600}>
          <div className="text-center py-3">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>বকেয়া পেমেন্ট</p>
            <p className="text-2xl font-bold mt-1" style={{ color: t.amber }}>{fmtShort(data.dues)}</p>
            <p className="text-[10px]" style={{ color: t.muted }}>pending + partial</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
