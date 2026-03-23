import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { ATT_STATUS, ATTENDANCE_DAY } from "../../data/mockData";

export default function AttendancePage() {
  const t = useTheme();
  const [attData, setAttData] = useState(ATTENDANCE_DAY);
  const [selectedDate] = useState("2026-03-22");

  const present = attData.filter((a) => a.status === "present").length;
  const absent = attData.filter((a) => a.status === "absent").length;
  const late = attData.filter((a) => a.status === "late").length;

  const cycleStatus = (idx) => {
    const order = ["present", "absent", "late"];
    const n = [...attData];
    const cur = order.indexOf(n[idx].status);
    n[idx] = { ...n[idx], status: order[(cur + 1) % 3] };
    setAttData(n);
  };

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Attendance</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>দৈনিক উপস্থিতি — {selectedDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "উপস্থিত", value: present, color: t.emerald, icon: "✅" },
          { label: "অনুপস্থিত", value: absent, color: t.rose, icon: "❌" },
          { label: "দেরিতে", value: late, color: t.amber, icon: "⏰" },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 50}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
              <span className="text-2xl">{kpi.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card delay={150}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Batch April 2026 — {selectedDate}</h3>
          <p className="text-xs" style={{ color: t.muted }}>ক্লিক করে status পরিবর্তন করুন</p>
        </div>
        <div className="space-y-1.5">
          {attData.map((att, idx) => {
            const st = ATT_STATUS[att.status];
            return (
              <button key={idx} onClick={() => cycleStatus(idx)}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition text-left"
                style={{ background: `${st.color}06`, border: `1px solid ${st.color}15` }}>
                <span className="text-base">{st.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium">{att.name}</p>
                  <p className="text-[10px]" style={{ color: t.muted }}>{att.id}</p>
                </div>
                <Badge color={st.color} size="xs">{st.label}</Badge>
              </button>
            );
          })}
        </div>
      </Card>

      <Card delay={200}>
        <h3 className="text-sm font-semibold mb-3">সাপ্তাহিক সারাংশ</h3>
        <div className="flex gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu"].map((day, i) => {
            const pct = [88, 92, 75, 85, 83][i];
            return (
              <div key={day} className="flex-1 text-center p-2 rounded-lg" style={{ background: t.inputBg }}>
                <p className="text-[9px] font-medium" style={{ color: t.muted }}>{day}</p>
                <p className="text-sm font-bold mt-1" style={{ color: pct >= 85 ? t.emerald : pct >= 70 ? t.amber : t.rose }}>{pct}%</p>
                <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: `${t.muted}20` }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 85 ? t.emerald : pct >= 70 ? t.amber : t.rose }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
