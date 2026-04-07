/**
 * DocumentsPage.jsx — ডকুমেন্ট ম্যানেজমেন্ট
 *
 * Student-wise document data input — প্রতিটি doc type-এর জন্য custom fields
 * Doc types: Birth Certificate, NID, SSC, HSC, Passport, Family Certificate
 * Data এখানে input করলে Doc Generator-এ auto-available হয়
 */

import { useState, useEffect, useRef } from "react";
import { Users, CheckCircle, Clock, FileText, ChevronRight, Search, ArrowLeft, Save, Plus, X, Camera } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import SortHeader from "../../components/ui/SortHeader";
import useSortable from "../../hooks/useSortable";
import { api } from "../../hooks/useAPI";
import { formatDateDisplay } from "../../components/ui/DateInput";

export default function DocumentsPage({ students }) {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  // States
  const [docTypes, setDocTypes] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchDoc, setSearchDoc] = useState("");
  const [filterBatch, setFilterBatch] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("name_en");

  // Student detail view
  const [studentDocData, setStudentDocData] = useState([]); // saved document_data for selected student
  const [activeDocType, setActiveDocType] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [saving, setSaving] = useState(false);

  // ── Cross-validation state ──
  const [showCrossValidate, setShowCrossValidate] = useState(false);
  const [crossValidateData, setCrossValidateData] = useState(null);
  const [crossValidateLoading, setCrossValidateLoading] = useState(false);

  // OCR Scan — ডকুমেন্ট ইমেজ থেকে auto-fill (credit system সহ)
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [ocrCredits, setOcrCredits] = useState(null);
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const scanInputRef = useRef(null);

  // OCR credit balance load
  useEffect(() => {
    api.get("/ocr/credits").then(d => setOcrCredits(d?.credits ?? 0)).catch(() => setOcrCredits(0));
  }, []);

  /**
   * handleScanUpload — credit check → OCR API call → auto-fill
   */
  const handleScanUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Credit check — প্রতি scan-এ 5 credit লাগে
    if (ocrCredits !== null && ocrCredits < 5) {
      setShowCreditPopup(true);
      e.target.value = ""; // file input reset
      return;
    }

    setScanning(true);
    setScanResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      // Active doc type-এর field info পাঠাও — Haiku এই fields খুঁজবে
      if (activeDocType) {
        formData.append("doc_type_name", activeDocType.name || "");
        formData.append("expected_fields", JSON.stringify(
          (activeDocType.fields || []).map(f => ({ key: f.key, label: f.label || f.key, type: f.type || "text" }))
        ));
      }

      // OCR API call — credit deduct হবে backend-এ
      const data = await api.upload("/ocr/scan", formData);

      setScanResult(data);
      // Credit balance আপডেট (response-এ remaining আসে)
      if (data.credits_remaining !== undefined) setOcrCredits(data.credits_remaining);

      // Auto-fill — extracted fields দিয়ে form পূরণ
      const extracted = data.extracted_fields || {};
      const newValues = { ...fieldValues };
      let filledCount = 0;

      Object.entries(extracted).forEach(([key, value]) => {
        if (key === "_confidence") return;
        const fieldExists = (activeDocType?.fields || []).some(f => f.key === key);
        if (fieldExists && !newValues[key]) {
          newValues[key] = value;
          filledCount++;
        }
      });

      setFieldValues(newValues);
      const engineLabel = data.engine === "haiku" ? "AI" : "OCR";
      toast.success(`${engineLabel} — ${filledCount} fields auto-filled (${data.credits_remaining ?? "?"} credits left)`);
    } catch (err) {
      // NO_CREDITS error handle — popup দেখাও
      if (err.message?.includes("credit")) {
        setOcrCredits(0);
        setShowCreditPopup(true);
      } else {
        toast.error(tr("documents.scanFailed") + ": " + err.message);
      }
    }

    setScanning(false);
  };

  // Load doc types from API
  useEffect(() => {
    api.get("/docdata/types").then(data => { if (Array.isArray(data)) setDocTypes(data); }).catch((err) => { console.error("[DocTypes Load]", err); toast.error("ডকুমেন্ট টাইপ লোড করতে সমস্যা হয়েছে"); });
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
    } catch {
      setStudentDocData([]);
      toast.error("ডকুমেন্ট ডাটা লোড করতে সমস্যা হয়েছে");
    }
  };

  // Get completion for a doc type — section_header বাদ দিয়ে গণনা
  const getDocCompletion = (docTypeId) => {
    const saved = studentDocData.find(d => d.doc_type_id === docTypeId);
    if (!saved) return { filled: 0, total: 0, pct: 0 };
    const dt = docTypes.find(d => d.id === docTypeId);
    const fields = (dt?.fields || []).filter(f => f.type !== "section_header" && f.type !== "repeatable");
    const total = fields.length;
    const filled = fields.filter(f => saved.field_data?.[f.key]).length;
    return { filled, total, pct: total > 0 ? Math.round((filled / total) * 100) : 0 };
  };

  // Save document data (optimistic lock সহ — concurrent edit protection)
  const saveDocData = async () => {
    if (!activeDocType || !selectedStudent) return;
    setSaving(true);
    try {
      // বর্তমান saved record-এর updated_at পাঠাও — conflict check-এর জন্য
      const saved = studentDocData.find(d => d.doc_type_id === activeDocType.id);
      await api.post("/docdata/save", {
        student_id: selectedStudent.id,
        doc_type_id: activeDocType.id,
        field_data: fieldValues,
        updated_at: saved?.updated_at || null,
      });
      toast.success(`${activeDocType.name_bn || activeDocType.name} — ডাটা সংরক্ষণ হয়েছে`);
      await loadStudentDocs(selectedStudent.id); // refresh — নতুন updated_at পাবে
      setActiveDocType(null); setScanResult(null);
    } catch (err) {
      const msg = err.message || "সেভ ব্যর্থ";
      if (msg.includes("পরিবর্তন করেছে") || msg.includes("CONFLICT")) {
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    }
    setSaving(false);
  };

  // ══════════ DOC TYPE FIELD FORM ══════════

  // কন্ডিশনাল ফিল্ড চেক — শর্ত পূরণ না হলে ফিল্ড দেখাবে না
  const isFieldVisible = (field) => {
    if (!field.condition) return true;
    const { when, equals, not_equals } = field.condition;
    const currentValue = fieldValues[when];
    if (equals) return currentValue === equals;
    if (not_equals) return currentValue !== not_equals;
    return true;
  };

  // কন্ডিশনাল ট্রিগার ফিল্ড পরিবর্তন হলে লুকানো ফিল্ডের মান মুছে দাও
  const handleFieldChange = (key, value) => {
    setFieldValues(prev => {
      const updated = { ...prev, [key]: value };

      // চেক করো — এই key কোনো ফিল্ডের condition.when কিনা
      const allFields = activeDocType?.fields || [];
      const dependentFields = allFields.filter(f => f.condition?.when === key);
      dependentFields.forEach(f => {
        const { equals, not_equals } = f.condition;
        const visible = equals ? value === equals : not_equals ? value !== not_equals : true;
        // যদি ফিল্ড invisible হয় তাহলে তার মান মুছে দাও
        if (!visible && updated[f.key] !== undefined) {
          delete updated[f.key];
        }
      });

      // গ্রুপ পরিবর্তন হলে বিষয়ের তালিকা auto-populate করো (SSC/HSC)
      if (key === "group" && value) {
        const subjectsField = allFields.find(f => f.key === "subjects" && f.type === "repeatable");
        if (subjectsField) {
          const subjectSubfield = (subjectsField.subfields || []).find(sf => sf.key === "Subject");
          if (subjectSubfield?.conditional_options?.values?.[value]) {
            const subjects = subjectSubfield.conditional_options.values[value];
            const newMembers = subjects.map(s => ({ Subject: s, Grade: "", Point: "" }));
            updated._members = newMembers;
          }
        }
      }

      return updated;
    });
  };

  // conditional_options বা সাধারণ options থেকে subfield-এর dropdown options বের করো
  const getSubfieldOptions = (sf) => {
    if (sf.conditional_options) {
      const triggerValue = fieldValues[sf.conditional_options.when];
      if (triggerValue && sf.conditional_options.values[triggerValue]) {
        return sf.conditional_options.values[triggerValue];
      }
      return sf.conditional_options.default || [];
    }
    return sf.options || [];
  };

  if (selectedStudent && activeDocType) {
    const fields = activeDocType.fields || [];
    const normalFields = fields.filter(f => f.type !== "repeatable" && f.type !== "section_header");
    const repeatableField = fields.find(f => f.type === "repeatable");

    // Repeatable members from fieldValues
    const members = fieldValues._members || [];
    const addMember = () => {
      const blank = {};
      (repeatableField?.subfields || []).forEach(sf => { blank[sf.key] = ""; });
      setFieldValues(prev => ({ ...prev, _members: [...(prev._members || []), blank] }));
    };
    const removeMember = (idx) => {
      setFieldValues(prev => ({ ...prev, _members: (prev._members || []).filter((_, i) => i !== idx) }));
    };
    const updateMember = (idx, key, val) => {
      setFieldValues(prev => {
        const updated = [...(prev._members || [])];
        updated[idx] = { ...updated[idx], [key]: val };
        return { ...prev, _members: updated };
      });
    };

    // Save: flatten members into MemberN_Key format for Doc Generator compatibility (optimistic lock সহ)
    const saveWithFlatten = async () => {
      const flat = { ...fieldValues };
      // Flatten _members array → Member1_Name, Member2_Name, etc.
      (fieldValues._members || []).forEach((m, i) => {
        Object.entries(m).forEach(([k, v]) => { flat[`Member${i + 1}_${k}`] = v; });
      });
      // বর্তমান saved record-এর updated_at পাঠাও — conflict check-এর জন্য
      const saved = studentDocData.find(d => d.doc_type_id === activeDocType.id);
      setSaving(true);
      try {
        await api.post("/docdata/save", { student_id: selectedStudent.id, doc_type_id: activeDocType.id, field_data: flat, updated_at: saved?.updated_at || null });
        toast.success(`${activeDocType.name_bn || activeDocType.name} — ডাটা সংরক্ষণ হয়েছে`);
        await loadStudentDocs(selectedStudent.id);
        setActiveDocType(null); setScanResult(null);
      } catch (err) {
        const msg = err.message || "সেভ ব্যর্থ";
        if (msg.includes("পরিবর্তন করেছে") || msg.includes("CONFLICT")) {
          toast.error(msg);
        } else {
          toast.error(msg);
        }
      }
      setSaving(false);
    };

    return (
      <div className="space-y-5 anim-fade">
        <div className="flex items-center gap-4">
          <button onClick={() => { setActiveDocType(null); setScanResult(null); }} className="p-2 rounded-xl" style={{ background: t.inputBg }}><ArrowLeft size={18} /></button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{activeDocType.name}</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>{selectedStudent.name_en} ({selectedStudent.id}) — {tr("documents.fillDocData")}</p>
          </div>
          <Button icon={Save} onClick={saveWithFlatten} disabled={saving}>{saving ? tr("common.saving") : tr("common.save")}</Button>
        </div>

        {/* OCR Scan — document image upload করলে auto-fill হবে */}
        <div className="mb-0 p-4 rounded-xl" style={{ background: `${t.purple}08`, border: `1px solid ${t.purple}20` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Camera size={16} style={{ color: t.purple }} />
              <span className="text-xs font-semibold" style={{ color: t.text }}>{tr("documents.scanAutoFill")}</span>
              {/* OCR Credit balance badge */}
              {ocrCredits !== null && ocrCredits >= 5 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: `${t.emerald}15`, color: t.emerald }}>
                  {ocrCredits} credits
                </span>
              )}
            </div>
            {scanning && <span className="text-[10px]" style={{ color: t.muted }}>{tr("documents.scanning")}</span>}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleScanUpload}
              className="text-xs"
              style={{ color: t.text }}
              ref={scanInputRef}
            />
            {scanResult && (
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background: scanResult.confidence === "high" ? `${t.emerald}15` : `${t.amber}15`,
                  color: scanResult.confidence === "high" ? t.emerald : t.amber
                }}>
                {scanResult.confidence === "high" ? "High confidence" : "Review needed"}
                {" — "}{Object.keys(scanResult.extracted_fields || {}).filter(k => k !== "_confidence").length} fields found
              </span>
            )}
          </div>

          <p className="text-[9px] mt-2" style={{ color: t.muted }}>
            {tr("documents.scanHelp")}
          </p>
        </div>

        {/* ── OCR Credit Popup — credit না থাকলে professional modal ── */}
        <Modal isOpen={showCreditPopup} onClose={() => setShowCreditPopup(false)} title="AI Document Scanner" size="sm">
          <div className="text-center space-y-4 py-2">
            <div className="text-4xl">🔍</div>
            <div>
              <h4 className="text-sm font-bold" style={{ color: t.text }}>Scan Credit Required</h4>
              <p className="text-xs mt-1" style={{ color: t.muted }}>
                AI-powered document scanning automatically extracts data from your documents and fills in all fields — saving hours of manual work.
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: t.inputBg }}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: t.muted }}>Your balance</span>
                <span className="font-bold" style={{ color: t.rose }}>{ocrCredits || 0} credits</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: t.muted }}>Per scan cost</span>
                <span className="font-medium" style={{ color: t.text }}>5 credits</span>
              </div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: `${t.cyan}08`, border: `1px solid ${t.cyan}20` }}>
              <p className="text-[10px] font-medium" style={{ color: t.cyan }}>How to get credits?</p>
              <p className="text-[10px] mt-1" style={{ color: t.muted }}>
                Contact your agency administrator or AgencyBook support to purchase scan credits. Credits never expire.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowCreditPopup(false)}>Got it</Button>
          </div>
        </Modal>

        {/* Normal fields + section headers — কন্ডিশনাল ফিল্ড সাপোর্ট সহ */}
        <Card delay={50}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields
              .filter(f => f.type !== "repeatable")
              .filter(f => isFieldVisible(f))
              .map(f => {
                // section_header টাইপ — বিভাগের শিরোনাম
                if (f.type === "section_header") {
                  return (
                    <div key={f.key} className="col-span-2 mt-4 mb-1">
                      <h4 className="text-sm font-semibold" style={{ color: t.cyan }}>
                        {f.label_en || f.label}
                      </h4>
                      {f.description && (
                        <p className="text-[10px]" style={{ color: t.muted }}>{f.description}</p>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={f.key}>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>
                      {f.label_en || f.label}
                      {f.required && <span style={{ color: t.rose }}> *</span>}
                    </label>
                    {f.type === "select" ? (
                      <select value={fieldValues[f.key] || ""} onChange={e => handleFieldChange(f.key, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                        <option value="">— Select —</option>
                        {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type === "date" ? "date" : "text"} value={fieldValues[f.key] || ""}
                        onChange={e => handleFieldChange(f.key, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder={f.label_en || f.label} />
                    )}
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Repeatable members section */}
        {repeatableField && (
          <Card delay={100}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">{repeatableField.label_en || repeatableField.label} ({members.length})</h3>
              <Button size="xs" icon={Plus} onClick={addMember}>Add</Button>
            </div>

            {members.length === 0 && (
              <div className="text-center py-6" style={{ color: t.muted }}>
                <p className="text-xs">No entries yet — click "Add" above</p>
              </div>
            )}

            <div className="space-y-3">
              {members.map((member, idx) => (
                <div key={idx} className="p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold" style={{ color: t.cyan }}>#{idx + 1}</p>
                    <button onClick={() => removeMember(idx)} className="text-[10px] px-2 py-1 rounded-lg transition"
                      style={{ color: t.muted }} onMouseEnter={e => e.currentTarget.style.color = t.rose} onMouseLeave={e => e.currentTarget.style.color = t.muted}>
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(repeatableField.subfields || []).map(sf => (
                      <div key={sf.key}>
                        <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{sf.label_en || sf.label}</label>
                        {/* Relation ফিল্ড — Birth Certificate-এর জন্য হার্ডকোডেড dropdown */}
                        {sf.key === "Relation" ? (
                          <select value={member[sf.key] || ""} onChange={e => updateMember(idx, sf.key, e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                            <option value="">— Select —</option>
                            {["SELF", "Father", "Mother", "Brother", "Sister", "Spouse", "Son", "Daughter", "Grandfather", "Grandmother", "Uncle", "Aunt", "Other"].map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        ) : sf.type === "select" ? (
                          /* select টাইপ — conditional_options বা সাধারণ options থেকে dropdown */
                          /* allow_custom থাকলে "Other" option + text input দেখাবে */
                          <>
                            <select
                              value={getSubfieldOptions(sf).includes(member[sf.key]) ? member[sf.key] : member[sf.key] ? "__custom__" : ""}
                              onChange={e => {
                                if (e.target.value === "__custom__") updateMember(idx, sf.key, "");
                                else updateMember(idx, sf.key, e.target.value);
                              }}
                              className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                              <option value="">— Select —</option>
                              {getSubfieldOptions(sf).map(o => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                              {(sf.allow_custom || sf.conditional_options?.allow_custom) && <option value="__custom__">✏️ Other (custom)</option>}
                            </select>
                            {(sf.allow_custom || sf.conditional_options?.allow_custom) && !getSubfieldOptions(sf).includes(member[sf.key]) && (
                              <input type="text" value={member[sf.key] || ""} onChange={e => updateMember(idx, sf.key, e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none mt-1" style={is} placeholder="Type subject name..." />
                            )}
                          </>
                        ) : (
                          <input type={sf.type === "date" ? "date" : "text"} value={member[sf.key] || ""}
                            onChange={e => updateMember(idx, sf.key, e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={is} placeholder={sf.label_en} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ══════════ STUDENT DETAIL — DOC TYPES LIST ══════════
  if (selectedStudent) {
    // শুধু active doc types দেখাবে — Admin Settings থেকে নিষ্ক্রিয় করা doc type বাদ
    const activeDocTypes = docTypes.filter(dt => dt.is_active !== false);
    const totalTypes = activeDocTypes.length;
    const completedTypes = activeDocTypes.filter(dt => getDocCompletion(dt.id).pct === 100).length;

    return (
      <div className="space-y-5 anim-fade">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedStudent(null); setStudentDocData([]); }} className="p-2 rounded-xl" style={{ background: t.inputBg }}><ArrowLeft size={18} /></button>
          <div>
            <h2 className="text-xl font-bold">{selectedStudent.name_en}</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>{selectedStudent.id} • {selectedStudent.batch || "—"} • {completedTypes}/{totalTypes} {tr("documents.documentsCompleted")}</p>
          </div>
        </div>

        {/* ── Cross-Validation Button ── */}
        <Card delay={0}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">🔍 Cross-Validation</h3>
              <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>বিভিন্ন ডকুমেন্টে একই ফিল্ডের মান মিলছে কিনা যাচাই করুন</p>
            </div>
            <Button size="xs" variant="ghost" onClick={async () => {
              setCrossValidateLoading(true);
              try {
                const result = await api.get(`/documents/cross-validate/${selectedStudent.id}`);
                setCrossValidateData(result);
                setShowCrossValidate(true);
              } catch (err) { toast.error("Cross-validation ব্যর্থ"); }
              setCrossValidateLoading(false);
            }}>{crossValidateLoading ? "চেক হচ্ছে..." : "Mismatch চেক করুন"}</Button>
          </div>
        </Card>

        {/* ── Cross-Validation Result Modal ── */}
        <Modal isOpen={showCrossValidate} onClose={() => setShowCrossValidate(false)} title="Document Cross-Validation" subtitle={`${selectedStudent.name_en} — Student Profile vs Documents`} size="lg">
          {crossValidateData && (
            <div className="space-y-4">
              {/* ── সারাংশ ── */}
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{
                background: crossValidateData.mismatches?.length > 0 ? `${t.rose}10` : `${t.emerald}10`,
                border: `1px solid ${crossValidateData.mismatches?.length > 0 ? `${t.rose}30` : `${t.emerald}30`}`,
              }}>
                <span className="text-2xl">{crossValidateData.mismatches?.length > 0 ? "⚠️" : "✅"}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: crossValidateData.mismatches?.length > 0 ? t.rose : t.emerald }}>
                    {crossValidateData.mismatches?.length > 0 ? `${crossValidateData.mismatches.length} Mismatch Found` : "All Fields Match!"}
                  </p>
                  <p className="text-[10px]" style={{ color: t.muted }}>
                    {crossValidateData.total_docs} documents checked • {crossValidateData.matches_count || 0} fields matched
                  </p>
                </div>
              </div>

              {/* ── Mismatch তালিকা — Profile vs Document ── */}
              {(crossValidateData.mismatches || []).map((m, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.border}` }}>
                  <p className="text-xs font-bold mb-2" style={{ color: t.rose }}>⚠️ {m.field}</p>
                  <div className="space-y-1.5">
                    {/* Student Profile — সঠিক মান */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${t.emerald}15`, color: t.emerald }}>✓ Profile</span>
                        <span style={{ color: t.muted }}>Student Profile (সঠিক)</span>
                      </span>
                      <span className="font-bold" style={{ color: t.emerald }}>{m.profile_value || "—"}</span>
                    </div>
                    {/* Document — ভিন্ন মান */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${t.rose}15`, color: t.rose }}>✗ Doc</span>
                        <span style={{ color: t.muted }}>{m.doc_type}</span>
                      </span>
                      <span className="font-bold" style={{ color: t.rose }}>{m.doc_value || "—"}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* ── কোনো mismatch না থাকলে info ── */}
              {crossValidateData.mismatches?.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: t.muted }}>
                  সব ডকুমেন্টের তথ্য Student Profile-এর সাথে মিলে গেছে
                </p>
              )}
            </div>
          )}
        </Modal>

        {/* Doc Type Cards — শুধু active doc types */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeDocTypes.map((dt, i) => {
            const comp = getDocCompletion(dt.id);
            const saved = studentDocData.find(d => d.doc_type_id === dt.id);
            const catColor = dt.category === "personal" ? t.cyan : dt.category === "academic" ? t.purple : t.amber;

            return (
              <Card key={dt.id} delay={i * 50} className="cursor-pointer group hover:-translate-y-1 transition-all duration-300">
                <div onClick={() => {
                  setActiveDocType(dt);

                  if (saved?.field_data && Object.keys(saved.field_data).length > 0) {
                    // আগে save করা data থাকলে সেটা দেখাও
                    setFieldValues(saved.field_data);
                  } else {
                    // প্রথমবার — student profile থেকে auto-fill
                    const s = selectedStudent;
                    const autoFill = {};

                    // Common field auto-mapping: doc field key → student profile key
                    const profileMap = {
                      Name: s.name_en, DOB: s.dob, Gender: s.gender,
                      FatherName: s.father_name || s.father, MotherName: s.mother_name || s.mother,
                      PermanentAddress: s.permanent_address, PresentAddress: s.current_address,
                      Nationality: s.nationality || "Bangladeshi", District: s.district || "",
                      // Passport
                      PassportNo: s.passport_number || s.passport, BirthPlace: s.birth_place || "",
                      IssueDate: s.passport_issue || "", ExpiryDate: s.passport_expiry || "",
                      // NID
                      NIDNo: s.nid, BloodGroup: s.blood_group,
                      Address: s.permanent_address,
                      // Birth cert
                      BirthRegNo: s.nid, // NID = birth reg no in many cases
                    };

                    (dt.fields || []).forEach(f => {
                      if (f.type === "repeatable") {
                        // Auto-fill first member = self, second = father, third = mother
                        autoFill._members = [
                          { Name: s.name_en || "", Relation: "SELF", DOB: s.dob || "", PresentAddr: s.current_address || "", PermanentAddr: s.permanent_address || "" },
                          { Name: s.father_name || s.father || "", Relation: "Father", DOB: "", PresentAddr: s.current_address || "", PermanentAddr: s.permanent_address || "" },
                          { Name: s.mother_name || s.mother || "", Relation: "Mother", DOB: "", PresentAddr: s.current_address || "", PermanentAddr: s.permanent_address || "" },
                        ];
                      } else if (profileMap[f.key]) {
                        autoFill[f.key] = profileMap[f.key];
                      }
                    });

                    setFieldValues(autoFill);
                  }
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${catColor}15` }}>
                        <FileText size={14} style={{ color: catColor }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{dt.name}</p>
                        <p className="text-[9px]" style={{ color: t.muted }}>{dt.category} • {(dt.fields || []).length} fields</p>
                      </div>
                    </div>
                    <Badge color={comp.pct === 100 ? "emerald" : comp.pct > 0 ? "amber" : "gray"} size="xs">
                      {comp.pct === 100 ? tr("documents.complete") : comp.pct > 0 ? `${comp.pct}%` : tr("documents.notStarted")}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: `${t.muted}15` }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${comp.pct}%`, background: comp.pct === 100 ? t.emerald : comp.pct > 0 ? t.amber : "transparent" }} />
                  </div>

                  <p className="text-[10px]" style={{ color: t.muted }}>
                    {comp.filled}/{comp.total} {tr("documents.fieldsFilled")}
                    {saved && <span> • {tr("documents.lastSaved")}: {formatDateDisplay(saved.updated_at)}</span>}
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
          <h2 className="text-xl font-bold">{tr("documents.title")}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{tr("documents.subtitle")}</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: tr("documents.totalStudents"), value: allStudents.length, color: t.cyan },
          { label: tr("documents.docTypes"), value: docTypes.length, color: t.purple },
          { label: tr("documents.batches"), value: allBatches.length - 1, color: t.amber },
          { label: tr("documents.totalFields"), value: docTypes.reduce((s, dt) => s + (dt.fields || []).length, 0), color: t.emerald },
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
          <h3 className="text-sm font-semibold">{tr("documents.studentDocuments")}</h3>
          <div className="flex items-center gap-2">
            <select value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-xs outline-none" style={is}>
              {allBatches.map(b => <option key={b} value={b}>{b === "All" ? tr("documents.allBatches") : b}</option>)}
            </select>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <Search size={12} style={{ color: t.muted }} />
              <input value={searchDoc} onChange={e => { setSearchDoc(e.target.value); setPage(1); }}
                className="bg-transparent text-xs outline-none w-32" style={{ color: t.text }}
                placeholder={tr("documents.searchStudent")} />
            </div>
          </div>
        </div>

        {/* সর্টেবল টেবিল */}
        {(() => {
          const sorted = sortFn(filteredStudents);
          const safePage = Math.min(page, Math.max(1, Math.ceil(sorted.length / pageSize)));
          const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

          return (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      <SortHeader label="Name" sortKey="name_en" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      <SortHeader label="ID" sortKey="id" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      <SortHeader label="Batch" sortKey="batch" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      <SortHeader label="Status" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(student => (
                      <tr key={student.id}
                        className="cursor-pointer group"
                        style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        onClick={async () => {
                          setSelectedStudent(student);
                          await loadStudentDocs(student.id);
                        }}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                              style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                              {(student.name_en || "").split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <span className="font-semibold truncate">{student.name_en}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4" style={{ color: t.textSecondary }}>{student.id}</td>
                        <td className="py-3 px-4" style={{ color: t.textSecondary }}>{student.batch || "—"}</td>
                        <td className="py-3 px-4"><StatusBadge status={student.status} /></td>
                        <td className="py-3 px-4">
                          <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" style={{ color: t.muted }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {paginated.length === 0 && <p className="text-xs text-center py-6" style={{ color: t.muted }}>কোনো স্টুডেন্ট পাওয়া যায়নি</p>}
              <Pagination total={sorted.length} page={safePage} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
            </>
          );
        })()}
      </Card>
    </div>
  );
}
