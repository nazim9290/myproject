import { useState } from "react";
import { ArrowLeft, Eye, CheckCircle, AlertCircle, Check, Save, Edit3, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { DOC_TYPES, DOC_STATUS_CONFIG } from "../../data/mockData";

const STATUS_CYCLE = ["not_submitted", "submitted", "verified", "issue"];
const CROSS_FIELDS = ["name_en", "father_en", "mother_en", "dob", "permanent_address"];

const computeMismatches = (docsArr) => {
  const result = [];
  for (const field of CROSS_FIELDS) {
    const docsWithField = docsArr.filter(d => d.data && d.data[field] && String(d.data[field]).trim());
    if (docsWithField.length < 2) continue;
    const values = docsWithField.map(d => String(d.data[field]).trim());
    if (new Set(values).size > 1) {
      result.push({ field, severity: "error", docs: docsWithField.map(d => d.docId), values });
    }
  }
  return result;
};

export default function StudentDocumentDetail({ student, studentDocs, onBack, onUpdate }) {
  const t = useTheme();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("checklist");
  const [docs, setDocs] = useState(studentDocs.docs);
  const [mismatches, setMismatches] = useState(() => computeMismatches(studentDocs.docs));
  const [expandedDoc, setExpandedDoc] = useState(null); // docId being edited
  const [dataForms, setDataForms] = useState({});

  if (!student) return null;

  const total = docs.length;
  const verified = docs.filter(d => d.status === "verified").length;
  const pct = total > 0 ? Math.round((verified / total) * 100) : 0;

  const cycleStatus = (docId) => {
    setDocs(prev => prev.map(d => {
      if (d.docId !== docId) return d;
      const cur = STATUS_CYCLE.indexOf(d.status);
      const next = STATUS_CYCLE[(cur + 1) % STATUS_CYCLE.length];
      const conf = DOC_STATUS_CONFIG[next];
      toast.success(`${DOC_TYPES.find(dt => dt.id === docId)?.name || docId} → ${conf?.label || next}`);
      return { ...d, status: next, uploadDate: next !== "not_submitted" ? (d.uploadDate || new Date().toISOString().slice(0, 10)) : null };
    }));
  };

  const saveDocData = (docId) => {
    const form = dataForms[docId] || {};
    const newDocs = docs.map(d => d.docId === docId ? { ...d, data: { ...d.data, ...form } } : d);
    setDocs(newDocs);
    const newMismatches = computeMismatches(newDocs);
    setMismatches(newMismatches);
    setExpandedDoc(null);
    const mismatchMsg = newMismatches.length > 0 ? ` • ${newMismatches.length}টি অমিল পাওয়া গেছে` : " • সব তথ্য মিলে গেছে ✓";
    toast.success("ডকুমেন্ট তথ্য সংরক্ষণ হয়েছে" + mismatchMsg);
  };

  const sf = (docId, key, val) => setDataForms(p => ({ ...p, [docId]: { ...(p[docId] || {}), [key]: val } }));

  return (
    <div className="space-y-5 anim-fade">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl transition flex items-center gap-1 text-xs font-medium"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
          onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = t.inputBg}>
          <ArrowLeft size={16} /> <span className="hidden sm:inline">ফিরুন</span>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{student.name_en}</h2>
            <StatusBadge status={student.status} />
          </div>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{student.id} • {student.school} • ডকুমেন্টস ({verified}/{total} যাচাই — {pct}%)</p>
        </div>
      </div>

      {/* Progress Bar */}
      <Card delay={50}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">সামগ্রিক অগ্রগতি</h3>
          <span className="text-sm font-bold" style={{ color: pct === 100 ? t.emerald : t.cyan }}>{pct}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: `${t.muted}15` }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${t.cyan}, ${pct === 100 ? t.emerald : t.purple})` }} />
        </div>
        <div className="flex gap-4 mt-3">
          {[
            { label: "যাচাইকৃত", count: docs.filter(d => d.status === "verified").length, color: t.emerald },
            { label: "জমাকৃত", count: docs.filter(d => d.status === "submitted").length, color: t.amber },
            { label: "সমস্যা", count: docs.filter(d => d.status === "issue").length, color: t.rose },
            { label: "অনুপস্থিত", count: docs.filter(d => d.status === "not_submitted").length, color: t.muted },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              <span style={{ color: t.textSecondary }}>{s.label}: <span className="font-semibold" style={{ color: t.text }}>{s.count}</span></span>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {[
          { key: "checklist", label: "📄 ডকুমেন্ট চেকলিস্ট", count: total },
          { key: "validation", label: "🔍 ক্রস-ভ্যালিডেশন", count: mismatches.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: activeTab === tab.key ? (t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#ffffff") : "transparent",
              color: activeTab === tab.key ? t.text : t.muted,
              boxShadow: activeTab === tab.key && t.mode === "light" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "checklist" && (
        <div className="space-y-2">
          {docs.map((doc, i) => {
            const docType = DOC_TYPES.find(dt => dt.id === doc.docId);
            const statusConf = DOC_STATUS_CONFIG[doc.status];
            const hasMismatch = mismatches.some(m => m.docs.includes(doc.docId));
            const isExpanded = expandedDoc === doc.docId;
            const form = dataForms[doc.docId] || {};
            return (
              <Card key={doc.docId} delay={i * 40} className="!p-4">
                <div className="flex items-center gap-4">
                  {/* Clickable status icon */}
                  <button onClick={() => cycleStatus(doc.docId)} title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                    className="text-xl shrink-0 transition-transform hover:scale-110" style={{ cursor: "pointer" }}>
                    {statusConf.icon}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{docType?.name || doc.docId}</p>
                      {hasMismatch && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${t.rose}15`, color: t.rose }}>⚠ অমিল</span>}
                      {!docType?.base && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${t.purple}15`, color: t.purple }}>শর্তসাপেক্ষ</span>}
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>
                      {docType?.name_en}{doc.uploadDate && ` • আপলোড: ${doc.uploadDate}`}
                    </p>
                    {doc.data && Object.keys(doc.data).length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        {Object.entries(doc.data).map(([key, val]) => {
                          const mm = mismatches.some(m => m.field === key && m.docs.includes(doc.docId));
                          const labels = { name_en: "নাম", father_en: "পিতা", mother_en: "মাতা", dob: "জন্ম", permanent_address: "ঠিকানা" };
                          return (
                            <span key={key} className="text-[10px]" style={{ color: mm ? t.rose : t.textSecondary }}>
                              {mm && "⚠ "}
                              <span style={{ color: t.muted }}>{labels[key] || key}:</span>{" "}
                              <span className="font-medium font-mono text-[9px]" style={{ color: mm ? t.rose : t.text }}>{val}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Badge color={statusConf.color} size="xs">{statusConf.label}</Badge>
                  <Button variant="ghost" icon={isExpanded ? X : Edit3} size="xs"
                    onClick={() => setExpandedDoc(isExpanded ? null : doc.docId)}>
                    {isExpanded ? "" : "ডাটা"}
                  </Button>
                </div>

                {/* Data entry form */}
                {isExpanded && (
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                    <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: t.muted }}>ডকুমেন্ট তথ্য এন্ট্রি</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      {[
                        { label: "নাম (EN)", key: "name_en" },
                        { label: "পিতার নাম (EN)", key: "father_en" },
                        { label: "মাতার নাম (EN)", key: "mother_en" },
                        { label: "জন্ম তারিখ", key: "dob", type: "date" },
                        { label: "স্থায়ী ঠিকানা", key: "permanent_address" },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label}</label>
                          <input type={f.type || "text"}
                            value={form[f.key] ?? (doc.data?.[f.key] || "")}
                            onChange={e => sf(doc.docId, f.key, e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="xs" onClick={() => setExpandedDoc(null)}>বাতিল</Button>
                      <Button icon={Save} size="xs" onClick={() => saveDocData(doc.docId)}>সংরক্ষণ</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === "validation" && (
        <div className="space-y-3">
          {mismatches.length === 0 ? (
            <Card delay={0}>
              <div className="flex flex-col items-center py-10">
                <CheckCircle size={40} style={{ color: t.emerald }} strokeWidth={1.2} />
                <p className="text-sm font-semibold mt-3" style={{ color: t.emerald }}>সব ডকুমেন্টে তথ্য মিলে গেছে!</p>
                <p className="text-xs mt-1" style={{ color: t.muted }}>কোনো অমিল পাওয়া যায়নি</p>
              </div>
            </Card>
          ) : (
            mismatches.map((m, i) => (
              <Card key={i} delay={i * 60}>
                <div className="flex items-start gap-3">
                  <div className="text-lg mt-0.5">{m.severity === "error" ? "🔴" : "🟡"}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold">
                        {m.field === "name_en" ? "নাম (English)" : m.field === "father_en" ? "পিতার নাম" : m.field === "mother_en" ? "মাতার নাম" : m.field === "permanent_address" ? "স্থায়ী ঠিকানা" : m.field}
                      </p>
                      <Badge color={m.severity === "error" ? t.rose : t.amber} size="xs">
                        {m.severity === "error" ? "সমস্যা" : "সতর্কতা"}
                      </Badge>
                    </div>

                    {/* Comparison Table */}
                    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
                      {m.docs.map((docId, j) => {
                        const docType = DOC_TYPES.find((dt) => dt.id === docId);
                        return (
                          <div key={docId} className="flex items-center" style={{ borderBottom: j < m.docs.length - 1 ? `1px solid ${t.border}` : "none" }}>
                            <div className="px-3 py-2 text-[10px] font-medium w-36 shrink-0" style={{ background: t.inputBg, color: t.textSecondary }}>
                              {docType?.name || docId}
                            </div>
                            <div className="px-3 py-2 text-[11px] font-mono flex-1" style={{ color: t.text }}>
                              {m.values[j]}
                            </div>
                            <div className="px-2">
                              {j === 0 ? <Check size={12} style={{ color: t.emerald }} /> : <AlertCircle size={12} style={{ color: t.rose }} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-[10px] mt-2" style={{ color: t.muted }}>
                      💡 {m.field === "name_en" ? "\"Md.\" এবং \"Mohammad\" একই হতে পারে — ম্যানুয়ালি যাচাই করুন" : m.field === "permanent_address" ? "বানান ভুল থাকতে পারে — \"Kamal\" vs \"Kamol\" চেক করুন" : "দুটি ডকুমেন্ট মিলিয়ে দেখুন"}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
