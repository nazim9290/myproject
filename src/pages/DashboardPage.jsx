import { Users, DollarSign, FileText, Plane, TrendingUp } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../context/ThemeContext";
import Card from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { revenueData, pipelineChartData, alerts } from "../data/mockData";

export default function DashboardPage({ students, visitors }) {
  const t = useTheme();
  const activeStudents = students.filter((s) => !["CANCELLED", "PAUSED"].includes(s.status)).length;
  const visaGranted = students.filter((s) => ["VISA_GRANTED", "ARRIVED", "COMPLETED"].includes(s.status)).length;
  const docInProgress = students.filter((s) => ["DOC_COLLECTION", "DOC_SUBMITTED", "SCHOOL_INTERVIEW"].includes(s.status)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">ড্যাশবোর্ড</h2>
          <p className="text-xs opacity-40 mt-0.5">আজ ২২ মার্চ, ২০২৬</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "মোট স্টুডেন্ট", value: students.length, sub: `সক্রিয়: ${activeStudents}`, color: t.cyan, trend: "+১২%" },
          { icon: DollarSign, label: "এই মাসের আয়", value: "৳১২.৫L", sub: "বকেয়া: ৳৩.২L", color: t.emerald, trend: "+২৭%" },
          { icon: FileText, label: "ডক প্রসেসিং", value: docInProgress, sub: "ডকুমেন্ট পর্যায়ে", color: t.amber, trend: null },
          { icon: Plane, label: "ভিসা/পৌঁছেছে", value: visaGranted, sub: "ভিসা প্রাপ্ত বা এসেছে", color: t.purple, trend: null },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 60}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-40">{kpi.label}</p>
                <p className="mt-1.5 text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-[10px] opacity-40 mt-0.5">{kpi.sub}</p>
              </div>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
            </div>
            {kpi.trend && (
              <div className="mt-2 flex items-center gap-1">
                <TrendingUp size={12} style={{ color: t.emerald }} />
                <span className="text-[10px] font-semibold" style={{ color: t.emerald }}>{kpi.trend}</span>
                <span className="text-[10px] opacity-30">গত মাসের তুলনায়</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Revenue */}
        <Card className="col-span-12 lg:col-span-8" delay={250}>
          <h3 className="text-sm font-semibold mb-4">মাসিক আয়</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.cyan} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={t.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
              <XAxis dataKey="month" tick={{ fill: t.chartAxisTick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: t.chartAxisTick, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: t.text }} formatter={(v) => [`৳${(v / 100000).toFixed(1)}L`]} />
              <Area type="monotone" dataKey="amount" stroke={t.cyan} strokeWidth={2} fill="url(#rg)" dot={{ fill: t.cyan, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Alerts */}
        <Card className="col-span-12 lg:col-span-4" delay={300}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">সতর্কতা</h3>
            <Badge color={t.rose} size="xs">{alerts.filter((a) => a.type === "critical").length} জরুরি</Badge>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.map((a, i) => {
              const alertColor = a.type === "critical" ? t.rose : a.type === "warning" ? t.amber : t.cyan;
              return (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border"
                  style={{ borderColor: `${alertColor}20`, background: `${alertColor}08` }}>
                  <span className="text-sm">{a.icon}</span>
                  <div>
                    <p className="text-[11px] leading-snug">{a.text}</p>
                    <p className="text-[9px] opacity-30 mt-0.5">{a.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Pipeline */}
        <Card className="col-span-12 lg:col-span-6" delay={350}>
          <h3 className="text-sm font-semibold mb-3">পাইপলাইন ফানেল</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipelineChartData} layout="vertical">
              <XAxis type="number" tick={{ fill: t.chartAxisTick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" tick={{ fill: t.chartAxisTick, fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: t.text }} />
              <Bar dataKey="count" fill={t.cyan} radius={[0, 6, 6, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* সাম্প্রতিক ভিজিটর */}
        <Card className="col-span-12 lg:col-span-6" delay={400}>
          <h3 className="text-sm font-semibold mb-3">সাম্প্রতিক ভিজিটর</h3>
          <div className="space-y-2">
            {visitors.slice(0, 4).map((v) => (
              <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: t.inputBg }}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: `${t.cyan}20`, color: t.cyan }}>
                    {v.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{v.name}</p>
                    <p className="text-[10px] opacity-40">{v.source} • {v.country}</p>
                  </div>
                </div>
                <Badge color={v.status === "Interested" ? t.emerald : v.status === "Enrolled" ? t.cyan : v.status === "Thinking" ? t.amber : t.muted} size="xs">
                  {v.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
