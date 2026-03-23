import { ArrowLeft, FileText } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { SUBMISSIONS_DATA, SUB_STATUS } from "../../data/mockData";

export default function SchoolDetailView({ school, students, onBack }) {
  const t = useTheme();
  const schoolSubs = SUBMISSIONS_DATA.filter((s) => s.schoolId === school.id);
  const schoolStudents = students.filter((s) => s.school === school.name_en || s.school === school.name_en.split(" ")[0] + " " + school.name_en.split(" ")[1] || schoolSubs.some((sub) => sub.studentId === s.id));
  const countryColor = school.country === "Japan" ? t.rose : school.country === "Germany" ? t.amber : t.cyan;

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl transition" style={{ background: "transparent" }}
          onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{school.name_en}</h2>
            <Badge color={countryColor}>{school.country}</Badge>
          </div>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{school.name_jp} • {school.city}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card delay={50}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.muted }}>স্কুল তথ্য</h4>
          <div className="space-y-2.5">
            {[
              { label: "ঠিকানা", value: school.address },
              { label: "যোগাযোগ", value: school.contact },
              { label: "ওয়েবসাইট", value: school.website },
              { label: "শোকাই ফি/জন", value: school.shoukaiPerStudent > 0 ? `${school.currency} ${school.shoukaiPerStudent.toLocaleString()}` : "N/A" },
              { label: "Health Tests", value: school.healthRequired.length > 0 ? school.healthRequired.join(", ") : "কোনো requirement নেই" },
            ].map((f) => (
              <div key={f.label} className="flex justify-between text-xs">
                <span style={{ color: t.muted }}>{f.label}</span>
                <span className="font-medium text-right max-w-[60%]">{f.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card delay={100}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.muted }}>পরিসংখ্যান</h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "মোট রেফার", value: school.studentsReferred, color: t.cyan },
              { label: "পৌঁছেছে", value: school.studentsArrived, color: t.emerald },
              { label: "সাবমিশন", value: schoolSubs.length, color: t.purple },
              { label: "Accepted", value: schoolSubs.filter((s) => ["accepted", "forwarded_immigration", "coe_received"].includes(s.status)).length, color: t.emerald },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: `${s.color}08` }}>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px]" style={{ color: t.muted }}>{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card delay={150}>
        <h3 className="text-sm font-semibold mb-3">Submission History</h3>
        {schoolSubs.length === 0 ? <EmptyState icon={FileText} title="কোনো সাবমিশন নেই" /> : (
          <div className="space-y-3">
            {schoolSubs.sort((a, b) => b.submissionDate.localeCompare(a.submissionDate)).map((sub) => {
              const st = SUB_STATUS[sub.status];
              return (
                <div key={sub.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ border: `1px solid ${t.border}` }}>
                  <div className="text-lg">{st.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold">{sub.studentName}</p>
                      <span className="text-[10px] font-mono" style={{ color: t.cyan }}>#{sub.submissionNo}</span>
                    </div>
                    <p className="text-[10px]" style={{ color: t.muted }}>{sub.submissionDate}</p>
                  </div>
                  <Badge color={st.color} size="xs">{st.label}</Badge>
                  {sub.feedback.length > 0 && <Badge color={t.rose} size="xs">{sub.feedback.length} issues</Badge>}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
