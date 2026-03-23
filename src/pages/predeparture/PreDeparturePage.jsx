import { useState } from "react";
import { FileText, CheckCircle, Clock, Calendar } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { ChevronRight, Check } from "lucide-react";
import { DEPARTURE_STUDENTS } from "../../data/mockData";
import DepartureDetailView from "./DepartureDetailView";

export default function PreDeparturePage({ students = [] }) {
  const t = useTheme();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [departureList, setDepartureList] = useState(DEPARTURE_STUDENTS);

  if (selectedStudent) {
    return (
      <DepartureDetailView
        student={selectedStudent}
        onBack={() => setSelectedStudent(null)}
        onUpdate={(updated) => {
          setDepartureList(prev => prev.map(s => s.id === updated.id ? updated : s));
          setSelectedStudent(updated);
        }}
      />
    );
  }

  // Also show pipeline students at COE stage
  const pipelineAtCOE = students.filter(s => ["COE_RECEIVED","VISA_GRANTED","ARRIVED","COMPLETED"].includes(s.status));

  const coeStudents = departureList.length + pipelineAtCOE.length;
  const visaGranted = departureList.filter((s) => s.visa.status === "granted").length + pipelineAtCOE.filter(s => s.status === "VISA_GRANTED" || s.status === "ARRIVED" || s.status === "COMPLETED").length;
  const healthPending = departureList.filter((s) => s.healthTests.some((h) => h.status !== "done")).length;
  const vfsPending = departureList.filter((s) => !s.vfs.appointmentDate).length;

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Pre-Departure & VFS</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>COE → Health → Tuition → VFS → Visa → Flight → Arrival</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "COE প্রাপ্ত", value: coeStudents, color: t.cyan, icon: FileText },
          { label: "ভিসা পেয়েছে", value: visaGranted, color: t.emerald, icon: CheckCircle },
          { label: "Health বাকি", value: healthPending, color: t.amber, icon: Clock },
          { label: "VFS বাকি", value: vfsPending, color: t.rose, icon: Calendar },
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

      <div className="space-y-3">
        {departureList.map((st, i) => {
          const steps = [
            { label: "COE", done: !!st.coe.number, icon: "📋" },
            { label: "Health", done: st.healthTests.every((h) => h.status === "done"), icon: "🏥" },
            { label: "Tuition", done: st.tuition.receivedBySchool, icon: "💰" },
            { label: "VFS", done: st.vfs.docsSubmitted, icon: "🛂" },
            { label: "Visa", done: st.visa.status === "granted", icon: "✅" },
            { label: "Flight", done: !!st.flight, icon: "✈️" },
          ];
          const completedSteps = steps.filter((s) => s.done).length;
          const pct = Math.round((completedSteps / steps.length) * 100);

          return (
            <Card key={st.id} delay={150 + i * 60} className="cursor-pointer group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 !p-4"
              onClick={() => setSelectedStudent(st)}>
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                  {st.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold group-hover:text-cyan-400 transition">{st.name}</p>
                    <Badge color={st.visa.status === "granted" ? t.emerald : t.amber} size="xs">
                      {st.visa.status === "granted" ? "ভিসা পেয়েছে ✓" : st.visa.status === "pending" ? "Visa Processing" : "COE পেয়েছে"}
                    </Badge>
                  </div>
                  <p className="text-[10px]" style={{ color: t.muted }}>{st.school} • {st.batch} • COE: {st.coe.number}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {steps.map((step, j) => (
                      <div key={j} className="flex items-center gap-1 text-[9px]" style={{ color: step.done ? t.emerald : t.muted }}>
                        <span>{step.icon}</span>
                        <span className="hidden sm:inline">{step.label}</span>
                        {step.done ? <Check size={9} /> : <Clock size={9} />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold" style={{ color: pct === 100 ? t.emerald : pct >= 50 ? t.amber : t.muted }}>{pct}%</p>
                  <p className="text-[9px]" style={{ color: t.muted }}>{completedSteps}/{steps.length}</p>
                </div>
                <ChevronRight size={16} className="shrink-0 transition-transform group-hover:translate-x-1" style={{ color: t.muted }} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
