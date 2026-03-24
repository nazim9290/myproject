import { useState } from "react";
import { Users, CheckCircle, Clock, AlertTriangle, FileText, ChevronRight, Search } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { DOC_TYPES, INITIAL_STUDENT_DOCS, DOC_STATUS_CONFIG } from "../../data/mockData";
import StudentDocumentDetail from "./StudentDocumentDetail";

export default function DocumentsPage({ students }) {
  const t = useTheme();
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchDoc, setSearchDoc] = useState("");
  const [filterBatch, setFilterBatch] = useState("All");

  // Students who are in doc-relevant pipeline stages
  const allDocStudents = students.filter((s) => !["VISITOR", "FOLLOW_UP", "CANCELLED"].includes(s.status));
  const allBatches = ["All", ...new Set(allDocStudents.map(s => s.batch).filter(Boolean))];
  const docStudents = allDocStudents
    .filter(s => filterBatch === "All" || s.batch === filterBatch)
    .filter(s => !searchDoc || (s.name_en || "").toLowerCase().includes(searchDoc.toLowerCase()) || (s.id || "").toLowerCase().includes(searchDoc.toLowerCase()));

  const getStudentDocs = (studentId) => INITIAL_STUDENT_DOCS[studentId] || { docs: DOC_TYPES.filter((d) => d.base).map((d) => ({ docId: d.id, status: "not_submitted", data: {} })), mismatches: [] };

  const getCompletionPercent = (studentId) => {
    const sd = getStudentDocs(studentId);
    const total = sd.docs.length;
    if (total === 0) return 0;
    const done = sd.docs.filter((d) => d.status === "verified").length;
    return Math.round((done / total) * 100);
  };

  const getStatusCounts = (studentId) => {
    const sd = getStudentDocs(studentId);
    return {
      total: sd.docs.length,
      verified: sd.docs.filter((d) => d.status === "verified").length,
      submitted: sd.docs.filter((d) => d.status === "submitted").length,
      issue: sd.docs.filter((d) => d.status === "issue").length,
      notSubmitted: sd.docs.filter((d) => d.status === "not_submitted").length,
      mismatches: sd.mismatches.length,
    };
  };

  // All mismatches across all students
  const allMismatches = Object.entries(INITIAL_STUDENT_DOCS).flatMap(([sid, data]) =>
    data.mismatches.map((m) => ({ ...m, studentId: sid, studentName: students.find((s) => s.id === sid)?.name_en || sid }))
  );

  if (selectedStudentId) {
    return (
      <StudentDocumentDetail
        student={students.find((s) => s.id === selectedStudentId)}
        studentDocs={getStudentDocs(selectedStudentId)}
        onBack={() => setSelectedStudentId(null)}
      />
    );
  }

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Documents</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>ডকুমেন্ট কালেকশন ও ভ্যালিডেশন</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "মোট স্টুডেন্ট", value: docStudents.length, color: t.cyan, icon: Users },
          { label: "ডক কমপ্লিট", value: Object.keys(INITIAL_STUDENT_DOCS).filter((id) => getCompletionPercent(id) === 100).length, color: t.emerald, icon: CheckCircle },
          { label: "চলমান", value: Object.keys(INITIAL_STUDENT_DOCS).filter((id) => { const p = getCompletionPercent(id); return p > 0 && p < 100; }).length, color: t.amber, icon: Clock },
          { label: "সমস্যা আছে", value: allMismatches.length, color: t.rose, icon: AlertTriangle },
          { label: "গড় কমপ্লিশন", value: `${Math.round(Object.keys(INITIAL_STUDENT_DOCS).reduce((sum, id) => sum + getCompletionPercent(id), 0) / Math.max(Object.keys(INITIAL_STUDENT_DOCS).length, 1))}%`, color: t.purple, icon: FileText },
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

      {/* Mismatch Alerts */}
      {allMismatches.length > 0 && (
        <Card delay={250}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: t.rose }} />
              <h3 className="text-sm font-semibold">Mismatch Alerts</h3>
            </div>
            <Badge color={t.rose}>{allMismatches.length} issues</Badge>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allMismatches.map((m, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200"
                style={{ background: `${m.severity === "error" ? t.rose : t.amber}08`, border: `1px solid ${m.severity === "error" ? t.rose : t.amber}20` }}
                onClick={() => setSelectedStudentId(m.studentId)}
              >
                <span className="text-sm mt-0.5">{m.severity === "error" ? "🔴" : "🟡"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: t.cyan }}>{m.studentName}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: t.textSecondary }}>
                    <span className="font-medium">{m.field === "name_en" ? "নাম" : m.field === "father_en" ? "পিতার নাম" : m.field === "permanent_address" ? "ঠিকানা" : m.field}</span>
                    {" মিল নেই — "}
                    {m.docs.map((d) => DOC_TYPES.find((dt) => dt.id === d)?.name || d).join(" ↔ ")}
                  </p>
                  <p className="text-[10px] mt-1 font-mono" style={{ color: t.muted }}>
                    "{m.values[0]}" ≠ "{m.values[1]}"
                  </p>
                </div>
                <ChevronRight size={14} style={{ color: t.muted }} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Student Document List */}
      <Card delay={350}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Student-wise Documents</h3>
          <div className="flex items-center gap-2">
            <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
              {allBatches.map(b => <option key={b} value={b}>{b === "All" ? "সব ব্যাচ" : b}</option>)}
            </select>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <Search size={12} style={{ color: t.muted }} />
              <input value={searchDoc} onChange={e => setSearchDoc(e.target.value)} className="bg-transparent text-xs outline-none w-32" style={{ color: t.text }} placeholder="স্টুডেন্ট খুঁজুন..." />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {docStudents.map((student, i) => {
            const counts = getStatusCounts(student.id);
            const pct = getCompletionPercent(student.id);
            const hasMismatch = counts.mismatches > 0;
            return (
              <div
                key={student.id}
                className="flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all duration-200 group"
                style={{ background: "transparent", border: `1px solid transparent` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = t.hoverBg; e.currentTarget.style.borderColor = t.border; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                onClick={() => setSelectedStudentId(student.id)}
              >
                {/* Avatar */}
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                  {student.name_en.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{student.name_en}</p>
                    {hasMismatch && <span className="text-xs">⚠️</span>}
                    <StatusBadge status={student.status} />
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{student.id} • {student.school} • {student.batch}</p>
                </div>

                {/* Doc Status Indicators */}
                <div className="hidden lg:flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: t.muted }}>Verified</p>
                    <p className="text-sm font-bold" style={{ color: t.emerald }}>{counts.verified}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: t.muted }}>Pending</p>
                    <p className="text-sm font-bold" style={{ color: t.amber }}>{counts.submitted}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: t.muted }}>Missing</p>
                    <p className="text-sm font-bold" style={{ color: t.muted }}>{counts.notSubmitted}</p>
                  </div>
                  {counts.issue > 0 && (
                    <div className="text-center">
                      <p className="text-[9px] uppercase tracking-wider" style={{ color: t.rose }}>Issue</p>
                      <p className="text-sm font-bold" style={{ color: t.rose }}>{counts.issue}</p>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-28 shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold" style={{ color: pct === 100 ? t.emerald : pct > 50 ? t.amber : t.muted }}>{pct}%</span>
                    <span className="text-[9px]" style={{ color: t.muted }}>{counts.verified}/{counts.total}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${t.muted}20` }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct === 100 ? t.emerald : pct > 50 ? t.amber : t.muted }} />
                  </div>
                </div>

                <ChevronRight size={16} className="shrink-0 transition-transform group-hover:translate-x-1" style={{ color: t.muted }} />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
