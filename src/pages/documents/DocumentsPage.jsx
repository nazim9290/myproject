/**
 * DocumentsPage.jsx — ডকুমেন্ট ম্যানেজমেন্ট
 *
 * Student-wise document data input — প্রতিটি doc type-এর জন্য custom fields
 * Doc types: Birth Certificate, NID, SSC, HSC, Passport, Family Certificate
 * Data এখানে input করলে Doc Generator-এ auto-available হয়
 */

import { useState, useEffect } from "react";
import { Users, CheckCircle, Clock, FileText, ChevronRight, Search, ArrowLeft, Save, Plus, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { api } from "../../hooks/useAPI";

export default function DocumentsPage({ students }) {
  const t = useTheme();
  const toast = useToast();
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  // States
  const [docTypes, setDocTypes] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchDoc, setSearchDoc] = useState("");
  const [filterBatch, setFilterBatch] = useState("All");

  // Student detail view
  const [studentDocData, setStudentDocData] = useState([]); // saved document_data for selected student
  const [activeDocType, setActiveDocType] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [saving, setSaving] = useState(false);

  // Load doc types from API
  useEffect(() => {
    api.get("/docdata/types").then(data => { if (Array.isArray(data)) setDocTypes(data); }).catch(() => {});
  }, []);

  // Student list
  const allStudents = (students || []).filter(s => !["VISITOR", "FOLLOW_UP", "CANCELLED"].includes(s.status));
  const allBatches = ["All", ...new Set(allStudents.map(s => s.batch).filter(Boolean))];
  const filteredStudents = allStudents
    .filter(s => filterBatch === "All" || s.batch === filterBatch)
    .filter(s => !searchDoc || (s.name_en || "").toLowerCase().includes(searchDoc.toLowerCase()) || s.id.toLowerCase().includes(searchDoc.toLowerCase()));

  // Load student's saved document data
  const loadStudentDocs = async (studentId) => {
    try {
      const data = await api.get(`/docdata/student/${studentId}`);
      setStudentDocData(Array.isArray(data) ? data : []);
    } catch { setStudentDocData([]); }
  };

  // Get completion for a doc type
  const getDocCompletion = (docTypeId) => {
    const saved = studentDocData.find(d => d.doc_type_id === docTypeId);
    if (!saved) return { filled: 0, total: 0, pct: 0 };
    const dt = docTypes.find(d => d.id === docTypeId);
    const fields = dt?.fields || [];
    const total = fields.length;
    const filled = fields.filter(f => saved.field_data?.[f.key]).length;
    return { filled, total, pct: total > 0 ? Math.round((filled / total) * 100) : 0 };
  };

  // Save document data
  const saveDocData = async () => {
    if (!activeDocType || !selectedStudent) return;
    setSaving(true);
    try {
      await api.post("/docdata/save", {
        student_id: selectedStudent.id,
        doc_type_id: activeDocType.id,
        field_data: fieldValues,
      });
      toast.success(`${activeDocType.name_bn || activeDocType.name} — ডাটা সংরক্ষণ হয়েছে`);
      await loadStudentDocs(selectedStudent.id); // refresh
      setActiveDocType(null);
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  };

  // ══════════ DOC TYPE FIELD FORM ══════════
  if (selectedStudent && activeDocType) {
    const fields = activeDocType.fields || [];
    return (
      <div className="space-y-5 anim-fade">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveDocType(null)} className="p-2 rounded-xl" style={{ background: t.inputBg }}><ArrowLeft size={18} /></button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{activeDocType.name_bn || activeDocType.name}</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>{selectedStudent.name_en} ({selectedStudent.id}) — ডকুমেন্টের তথ্য পূরণ করুন</p>
          </div>
          <Button icon={Save} onClick={saveDocData} disabled={saving}>{saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ"}</Button>
        </div>

        <Card delay={50}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((f, i) => (
              <div key={f.key}>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>
                  {f.label} <span className="text-[9px] font-normal" style={{ color: t.textSecondary }}>({f.label_en})</span>
                </label>
                {f.type === "select" ? (
                  <select value={fieldValues[f.key] || ""} onChange={e => setFieldValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option value="">— সিলেক্ট করুন —</option>
                    {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type === "date" ? "date" : "text"}
                    value={fieldValues[f.key] || ""}
                    onChange={e => setFieldValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}
                    placeholder={f.label_en} />
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ══════════ STUDENT DETAIL — DOC TYPES LIST ══════════
  if (selectedStudent) {
    const totalTypes = docTypes.length;
    const completedTypes = docTypes.filter(dt => getDocCompletion(dt.id).pct === 100).length;

    return (
      <div className="space-y-5 anim-fade">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedStudent(null); setStudentDocData([]); }} className="p-2 rounded-xl" style={{ background: t.inputBg }}><ArrowLeft size={18} /></button>
          <div>
            <h2 className="text-xl font-bold">{selectedStudent.name_en}</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>{selectedStudent.id} • {selectedStudent.batch || "—"} • {completedTypes}/{totalTypes} ডকুমেন্ট সম্পন্ন</p>
          </div>
        </div>

        {/* Doc Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {docTypes.map((dt, i) => {
            const comp = getDocCompletion(dt.id);
            const saved = studentDocData.find(d => d.doc_type_id === dt.id);
            const catColor = dt.category === "personal" ? t.cyan : dt.category === "academic" ? t.purple : t.amber;

            return (
              <Card key={dt.id} delay={i * 50} className="cursor-pointer group hover:-translate-y-1 transition-all duration-300">
                <div onClick={() => {
                  setActiveDocType(dt);
                  // Pre-fill from saved data
                  setFieldValues(saved?.field_data || {});
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${catColor}15` }}>
                        <FileText size={14} style={{ color: catColor }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{dt.name_bn || dt.name}</p>
                        <p className="text-[9px]" style={{ color: t.muted }}>{dt.name} • {(dt.fields || []).length} fields</p>
                      </div>
                    </div>
                    <Badge color={comp.pct === 100 ? "emerald" : comp.pct > 0 ? "amber" : "gray"} size="xs">
                      {comp.pct === 100 ? "সম্পন্ন" : comp.pct > 0 ? `${comp.pct}%` : "শুরু হয়নি"}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: `${t.muted}15` }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${comp.pct}%`, background: comp.pct === 100 ? t.emerald : comp.pct > 0 ? t.amber : "transparent" }} />
                  </div>

                  <p className="text-[10px]" style={{ color: t.muted }}>
                    {comp.filled}/{comp.total} fields পূরণ
                    {saved && <span> • সর্বশেষ: {saved.updated_at?.slice(0, 10)}</span>}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ══════════ MAIN LIST — STUDENT DOCUMENTS OVERVIEW ══════════
  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Documents</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>ডকুমেন্ট ডাটা ইনপুট — ট্রান্সলেশন ও Doc Generator-এ ব্যবহার হবে</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "মোট স্টুডেন্ট", value: allStudents.length, color: t.cyan },
          { label: "Document Types", value: docTypes.length, color: t.purple },
          { label: "ব্যাচ", value: allBatches.length - 1, color: t.amber },
          { label: "মোট Fields", value: docTypes.reduce((s, dt) => s + (dt.fields || []).length, 0), color: t.emerald },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 50}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Filter + Search */}
      <Card delay={200}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Student Documents</h3>
          <div className="flex items-center gap-2">
            <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs outline-none" style={is}>
              {allBatches.map(b => <option key={b} value={b}>{b === "All" ? "সব ব্যাচ" : b}</option>)}
            </select>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <Search size={12} style={{ color: t.muted }} />
              <input value={searchDoc} onChange={e => setSearchDoc(e.target.value)}
                className="bg-transparent text-xs outline-none w-32" style={{ color: t.text }}
                placeholder="স্টুডেন্ট খুঁজুন..." />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {filteredStudents.map(student => (
            <div key={student.id}
              className="flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all group"
              style={{ background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = t.hoverBg; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              onClick={async () => {
                setSelectedStudent(student);
                await loadStudentDocs(student.id);
              }}>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                {(student.name_en || "").split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{student.name_en}</p>
                  <StatusBadge status={student.status} />
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{student.id} • {student.batch || "—"}</p>
              </div>
              <ChevronRight size={16} className="shrink-0 transition-transform group-hover:translate-x-1" style={{ color: t.muted }} />
            </div>
          ))}
          {filteredStudents.length === 0 && <p className="text-xs text-center py-6" style={{ color: t.muted }}>কোনো স্টুডেন্ট পাওয়া যায়নি</p>}
        </div>
      </Card>
    </div>
  );
}
