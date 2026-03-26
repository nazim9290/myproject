import { useState } from "react";
import { ArrowLeft, FileText, Plus, Save, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { SUBMISSIONS_DATA, SUB_STATUS } from "../../data/mockData";

export default function SchoolDetailView({ school, students, onBack }) {
  const t = useTheme();
  const toast = useToast();
  const [subs, setSubs] = useState(SUBMISSIONS_DATA.filter((s) => s.schoolId === school.id));
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ studentId: "", status: "submitted", submissionNo: "" });
  const schoolStudents = students.filter((s) => s.school === school.name_en || subs.some((sub) => sub.studentId === s.id));
  const countryColor = school.country === "Japan" ? t.rose : school.country === "Germany" ? t.amber : t.cyan;
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  const cycleStatus = (subId) => {
    const order = Object.keys(SUB_STATUS);
    setSubs(prev => prev.map(s => {
      if (s.id !== subId) return s;
      const idx = order.indexOf(s.status);
      const next = order[(idx + 1) % order.length];
      toast.success(`${s.studentName} → ${SUB_STATUS[next].label}`);
      return { ...s, status: next };
    }));
  };

  const addSubmission = () => {
    if (!addForm.studentId) { toast.error("স্টুডেন্ট সিলেক্ট করুন"); return; }
    const student = students.find(s => s.id === addForm.studentId);
    const newSub = {
      id: `SUB-${Date.now()}`,
      studentId: addForm.studentId,
      studentName: student?.name_en || "—",
      schoolId: school.id,
      schoolName: school.name_en,
      submissionDate: new Date().toISOString().slice(0, 10),
      submissionNo: parseInt(addForm.submissionNo) || (subs.filter(s => s.studentId === addForm.studentId).length + 1),
      status: addForm.status,
      feedback: [],
    };
    setSubs(prev => [newSub, ...prev]);
    setShowAddForm(false);
    setAddForm({ studentId: "", status: "submitted", submissionNo: "" });
    toast.success(`${student?.name_en} — Submission যোগ হয়েছে`);
  };

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
              { label: "সাবমিশন", value: subs.length, color: t.purple },
              { label: "Accepted", value: subs.filter((s) => ["accepted", "forwarded_immigration", "coe_received"].includes(s.status)).length, color: t.emerald },
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Submission History</h3>
          <Button icon={Plus} size="xs" onClick={() => setShowAddForm(true)}>নতুন Submission</Button>
        </div>

        {showAddForm && (
          <div className="mb-4 p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>স্টুডেন্ট <span className="req-star">*</span></label>
                <select value={addForm.studentId} onChange={e => setAddForm(p => ({ ...p, studentId: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                  <option value="">— বাছুন —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name_en} ({s.id})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>স্ট্যাটাস</label>
                <select value={addForm.status} onChange={e => setAddForm(p => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                  {Object.entries(SUB_STATUS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Submission #</label>
                <input type="number" value={addForm.submissionNo} onChange={e => setAddForm(p => ({ ...p, submissionNo: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="1" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="xs" icon={X} onClick={() => setShowAddForm(false)}>বাতিল</Button>
              <Button icon={Save} size="xs" onClick={addSubmission}>যোগ করুন</Button>
            </div>
          </div>
        )}

        {subs.length === 0 ? <EmptyState icon={FileText} title="কোনো সাবমিশন নেই" /> : (
          <div className="space-y-3">
            {subs.sort((a, b) => b.submissionDate.localeCompare(a.submissionDate)).map((sub) => {
              const st = SUB_STATUS[sub.status] || SUB_STATUS.submitted;
              return (
                <div key={sub.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ border: `1px solid ${t.border}` }}>
                  <button onClick={() => cycleStatus(sub.id)} title="ক্লিক করে status পরিবর্তন করুন"
                    className="text-lg transition-transform hover:scale-110 shrink-0" style={{ cursor: "pointer" }}>
                    {st.icon}
                  </button>
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
