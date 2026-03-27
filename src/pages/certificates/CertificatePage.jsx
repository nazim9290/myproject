/**
 * CertificatePage.jsx → Document Generator (Translation Template)
 *
 * .docx template upload → {{placeholder}} detect → student select → .docx/.pdf download
 */

import { useState, useEffect, useRef } from "react";
import { Plus, FileText, Upload, Download, Trash2, Search, X, ArrowLeft, File } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { api } from "../../hooks/useAPI";

import { API_URL } from "../../lib/api";
const token = () => localStorage.getItem("agencyos_token");

const CATEGORIES = [
  { value: "translation", label: "ট্রান্সলেশন" },
  { value: "certificate", label: "সার্টিফিকেট" },
  { value: "letter", label: "চিঠি/পত্র" },
  { value: "other", label: "অন্যান্য" },
];

export default function CertificatePage({ students }) {
  const t = useTheme();
  const toast = useToast();
  const fileRef = useRef(null);
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  const [templates, setTemplates] = useState([]);
  const [view, setView] = useState("list");
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Upload
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("translation");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [linkedDocType, setLinkedDocType] = useState(""); // template-কে কোন doc type-এর সাথে link

  // Doc types from DB (Admin-defined document types with custom fields)
  const [docTypes, setDocTypes] = useState([]);
  useEffect(() => {
    api.get("/docdata/types").then(data => { if (Array.isArray(data)) setDocTypes(data); }).catch(() => {});
  }, []);

  // Mapping — upload-এর পর placeholder → system field map
  const [detectedPlaceholders, setDetectedPlaceholders] = useState([]);
  const [mappings, setMappings] = useState({}); // { "studentName": "name_en", "নাম": "name_bn" }

  // Generate
  const [selectedStudent, setSelectedStudent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [filterBatch, setFilterBatch] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Document-specific data input — প্রতিটি placeholder-র জন্য user data দেবে
  const [docData, setDocData] = useState({}); // { "RegistrationNo": "12345", "IssueDate": "2020-01-01" }
  const [generateStep, setGenerateStep] = useState("student"); // student | fill

  // System fields for mapping dropdown
  const SYSTEM_FIELDS = [
    { group: "ব্যক্তিগত", fields: [
      { key: "name_en", label: "নাম (English)" }, { key: "name_en:first", label: "নাম → First Name" }, { key: "name_en:last", label: "নাম → Last Name" },
      { key: "name_bn", label: "নাম (বাংলা)" }, { key: "name_katakana", label: "নাম (カタカナ)" },
      { key: "dob", label: "জন্ম তারিখ (Full)" }, { key: "dob:year", label: "জন্ম → Year" }, { key: "dob:month", label: "জন্ম → Month" }, { key: "dob:day", label: "জন্ম → Day" },
      { key: "age", label: "বয়স" }, { key: "gender", label: "লিঙ্গ" }, { key: "nationality", label: "জাতীয়তা" },
      { key: "marital_status", label: "বৈবাহিক অবস্থা" }, { key: "blood_group", label: "রক্তের গ্রুপ" },
      { key: "phone", label: "ফোন" }, { key: "email", label: "ইমেইল" },
    ]},
    { group: "পাসপোর্ট / NID", fields: [
      { key: "passport_number", label: "পাসপোর্ট নম্বর" }, { key: "nid", label: "NID" },
      { key: "passport_issue", label: "পাসপোর্ট ইস্যু" }, { key: "passport_expiry", label: "পাসপোর্ট মেয়াদ" },
    ]},
    { group: "ঠিকানা", fields: [
      { key: "permanent_address", label: "স্থায়ী ঠিকানা" }, { key: "current_address", label: "বর্তমান ঠিকানা" },
    ]},
    { group: "পরিবার", fields: [
      { key: "father_name", label: "পিতার নাম" }, { key: "father_name_en", label: "পিতার নাম (EN)" },
      { key: "mother_name", label: "মাতার নাম" }, { key: "mother_name_en", label: "মাতার নাম (EN)" },
      { key: "father_dob", label: "পিতার জন্ম তারিখ" }, { key: "mother_dob", label: "মাতার জন্ম তারিখ" },
      { key: "father_occupation", label: "পিতার পেশা" }, { key: "mother_occupation", label: "মাতার পেশা" },
    ]},
    { group: "স্পন্সর", fields: [
      { key: "sponsor_name", label: "স্পন্সরের নাম" }, { key: "sponsor_phone", label: "স্পন্সর ফোন" },
      { key: "sponsor_address", label: "স্পন্সর ঠিকানা" }, { key: "sponsor_relationship", label: "সম্পর্ক" },
    ]},
    { group: "অন্যান্য", fields: [
      { key: "country", label: "দেশ" }, { key: "today", label: "আজকের তারিখ" }, { key: "today_jp", label: "আজকের তারিখ (JP)" },
    ]},
  ];

  useEffect(() => {
    api.get("/docgen/templates").then(data => {
      if (Array.isArray(data)) setTemplates(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const eligibleStudents = (students || []).filter(s => !["VISITOR", "CANCELLED"].includes(s.status));
  const batchList = [...new Set(eligibleStudents.map(s => s.batch).filter(Boolean))];
  const batchFiltered = filterBatch === "all" ? eligibleStudents : eligibleStudents.filter(s => s.batch === filterBatch);
  const filteredStudents = studentSearch
    ? batchFiltered.filter(s => (s.name_en || "").toLowerCase().includes(studentSearch.toLowerCase()) || s.id.toLowerCase().includes(studentSearch.toLowerCase()))
    : batchFiltered;

  // ── Upload → detect placeholders → go to mapping ──
  const doUpload = async () => {
    if (!uploadName.trim()) { toast.error("Template নাম দিন"); return; }
    if (!uploadFile) { toast.error(".docx ফাইল সিলেক্ট করুন"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("template_name", uploadName);
      formData.append("category", uploadCategory);
      const res = await fetch(`${API_URL}/docgen/upload`, { method: "POST", headers: { Authorization: `Bearer ${token()}` }, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Detected placeholders → mapping step
      const phs = data.placeholders || [];
      setDetectedPlaceholders(phs);
      setActiveTemplate(data.template);

      // Auto-map: placeholder key === system field হলে auto-select
      const autoMap = {};
      const allKeys = SYSTEM_FIELDS.flatMap(g => g.fields.map(f => f.key));
      phs.forEach(p => { if (allKeys.includes(p.key)) autoMap[p.key] = p.key; });
      setMappings(autoMap);

      setView("mapping");
      toast.success(`"${uploadName}" — ${phs.length} টি placeholder পাওয়া গেছে`);
    } catch (err) { toast.error(err.message); }
    setUploading(false);
  };

  // ── Save mapping to DB ──
  const saveMapping = async () => {
    const mapped = detectedPlaceholders.map(p => ({
      ...p,
      field: mappings[p.key] || p.key,
    }));
    try {
      await fetch(`${API_URL}/docgen/templates/${activeTemplate.id}/mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ placeholders: mapped }),
      });
      const updated = { ...activeTemplate, placeholders: mapped, total_fields: mapped.length };
      setActiveTemplate(updated);
      setTemplates(prev => {
        const exists = prev.find(t => t.id === updated.id);
        return exists ? prev.map(t => t.id === updated.id ? updated : t) : [updated, ...prev];
      });
      toast.success(`${Object.values(mappings).filter(Boolean).length} fields mapping সংরক্ষণ হয়েছে`);
      setView("list");
    } catch { toast.error("Mapping save ব্যর্থ"); }
  };

  // ── Generate — student profile + document-specific data উভয়ই পাঠায় ──
  const doGenerate = async (format = "docx") => {
    if (!selectedStudent) { toast.error("একজন স্টুডেন্ট সিলেক্ট করুন"); return; }
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/docgen/generate`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          template_id: activeTemplate.id,
          student_id: selectedStudent,
          format,
          doc_data: docData, // document-specific data (Registration No, Issue Date ইত্যাদি)
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const blob = await res.blob();
      const studentName = eligibleStudents.find(s => s.id === selectedStudent)?.name_en || selectedStudent;
      Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${activeTemplate.name}_${studentName}.${format}` }).click();
      toast.exported(`${activeTemplate.name} — ${studentName}`);
    } catch (err) { toast.error(err.message); }
    setGenerating(false);
  };

  // ── Delete ──
  const deleteTemplate = async (tmpl) => {
    try {
      await fetch(`${API_URL}/docgen/templates/${tmpl.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
      setTemplates(prev => prev.filter(t => t.id !== tmpl.id));
      toast.success("Template মুছে ফেলা হয়েছে");
    } catch { toast.error("Delete ব্যর্থ"); }
    setDeleteConfirmId(null);
  };

  // ══════════ UPLOAD VIEW ══════════
  if (view === "upload") return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center gap-4">
        <button onClick={() => setView("list")} className="p-2 rounded-xl" style={{ background: t.inputBg }}><ArrowLeft size={18} /></button>
        <div>
          <h2 className="text-xl font-bold">Template আপলোড</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>.docx ফাইলে {"{{name_en}}"}, {"{{dob}}"} ইত্যাদি placeholder লিখুন</p>
        </div>
      </div>
      <Card delay={50}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Template নাম <span className="req-star">*</span></label>
              <input value={uploadName} onChange={e => setUploadName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={is} placeholder="Birth Certificate Translation" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ক্যাটাগরি</label>
              <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={is}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <input ref={fileRef} type="file" accept=".docx" onChange={e => setUploadFile(e.target.files[0])} className="hidden" />
            <div onClick={() => fileRef.current?.click()} className="flex flex-col items-center justify-center p-8 rounded-xl cursor-pointer border-2 border-dashed transition"
              style={{ borderColor: uploadFile ? t.cyan : t.inputBorder, background: uploadFile ? `${t.cyan}05` : t.inputBg }}>
              {uploadFile ? <><FileText size={32} style={{ color: t.cyan }} /><p className="text-sm font-medium mt-2">{uploadFile.name}</p></>
                : <><Upload size={32} style={{ color: t.muted }} /><p className="text-xs mt-2">.docx ফাইল আপলোড করুন</p></>}
            </div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: `${t.cyan}08`, border: `1px solid ${t.cyan}15` }}>
            <p className="text-[11px]" style={{ color: t.textSecondary }}>
              <strong>Placeholder তালিকা:</strong>{" "}
              <code style={{ color: t.cyan }}>{"{{name_en}}"}</code>, <code style={{ color: t.cyan }}>{"{{name_bn}}"}</code>, <code style={{ color: t.cyan }}>{"{{dob}}"}</code>, <code style={{ color: t.cyan }}>{"{{dob:year}}"}</code>, <code style={{ color: t.cyan }}>{"{{dob:month}}"}</code>, <code style={{ color: t.cyan }}>{"{{dob:day}}"}</code>,{" "}
              <code style={{ color: t.cyan }}>{"{{father_name}}"}</code>, <code style={{ color: t.cyan }}>{"{{mother_name}}"}</code>, <code style={{ color: t.cyan }}>{"{{passport_number}}"}</code>, <code style={{ color: t.cyan }}>{"{{nid}}"}</code>,{" "}
              <code style={{ color: t.cyan }}>{"{{permanent_address}}"}</code>, <code style={{ color: t.cyan }}>{"{{gender}}"}</code>, <code style={{ color: t.cyan }}>{"{{nationality}}"}</code>, <code style={{ color: t.cyan }}>{"{{today}}"}</code>
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setView("list")}>বাতিল</Button>
            <Button icon={Upload} onClick={doUpload} disabled={uploading}>{uploading ? "আপলোড হচ্ছে..." : "আপলোড"}</Button>
          </div>
        </div>
      </Card>
    </div>
  );

  // ══════════ MAPPING VIEW ══════════
  if (view === "mapping" && activeTemplate) return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center gap-4">
        <button onClick={() => setView("upload")} className="p-2 rounded-xl" style={{ background: t.inputBg }}><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Field Mapping — {activeTemplate.name}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>প্রতিটি placeholder-কে সিস্টেম field-এ ম্যাপ করুন • Mapped: {Object.values(mappings).filter(Boolean).length}/{detectedPlaceholders.length}</p>
        </div>
        <Button icon={Download} onClick={saveMapping}>সংরক্ষণ ({Object.values(mappings).filter(Boolean).length})</Button>
      </div>

      <Card delay={50}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                {["Placeholder", "System Field (কোন ডেটা বসবে)", ""].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detectedPlaceholders.map((p, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td className="py-2.5 px-3">
                    <span className="font-mono px-2 py-1 rounded text-[11px]" style={{ background: `${t.cyan}10`, color: t.cyan }}>
                      {p.placeholder || `{{${p.key}}}`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3" style={{ minWidth: 250 }}>
                    <select value={mappings[p.key] || ""} onChange={e => setMappings(prev => ({ ...prev, [p.key]: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                      style={{ ...is, borderColor: mappings[p.key] ? `${t.emerald}60` : t.inputBorder }}>
                      <option value="">— field সিলেক্ট করুন —</option>
                      {SYSTEM_FIELDS.map(g => (
                        <optgroup key={g.group} label={`── ${g.group} ──`}>
                          {g.fields.map(f => <option key={f.key} value={f.key}>{f.label} ({f.key})</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 px-3 text-center" style={{ width: 40 }}>
                    {mappings[p.key] && <span style={{ color: t.emerald }}>✓</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {detectedPlaceholders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs" style={{ color: t.muted }}>কোনো {"{{placeholder}}"} পাওয়া যায়নি — Word ফাইলে {"{{name_en}}"} ইত্যাদি লিখুন</p>
          </div>
        )}
      </Card>
    </div>
  );

  // ══════════ GENERATE VIEW — Step 1: Student Select, Step 2: Document Data Fill ══════════
  if (view === "generate" && activeTemplate) return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center gap-4">
        <button onClick={() => {
          if (generateStep === "fill") { setGenerateStep("student"); }
          else { setView("list"); setSelectedStudent(""); setDocData({}); setGenerateStep("student"); }
        }} className="p-2 rounded-xl" style={{ background: t.inputBg }}><ArrowLeft size={18} /></button>
        <div>
          <h2 className="text-xl font-bold">Generate — {activeTemplate.name}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>
            {generateStep === "student" ? "Step 1: স্টুডেন্ট সিলেক্ট করুন" : "Step 2: ডকুমেন্টের তথ্য পূরণ করুন"}
          </p>
        </div>
      </div>

      {/* Step 1: Student Select */}
      {generateStep === "student" && (
        <Card delay={50}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <Search size={14} style={{ color: t.muted }} />
              <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }} placeholder="স্টুডেন্ট খুঁজুন..." />
            </div>
            <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="px-3 py-2 rounded-xl text-xs outline-none" style={is}>
              <option value="all">সব ব্যাচ</option>
              {batchList.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1 max-h-[350px] overflow-y-auto">
            {filteredStudents.map(s => (
              <div key={s.id} onClick={() => setSelectedStudent(s.id)} className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition"
                style={{ background: selectedStudent === s.id ? `${t.cyan}10` : "transparent", border: `1px solid ${selectedStudent === s.id ? t.cyan : "transparent"}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedStudent === s.id ? t.cyan : t.muted }}>
                    {selectedStudent === s.id && <div className="w-2 h-2 rounded-full" style={{ background: t.cyan }} />}
                  </div>
                  <div><p className="text-xs font-medium">{s.name_en}</p><p className="text-[10px]" style={{ color: t.muted }}>{s.id} • {s.batch || "—"}</p></div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <Button onClick={async () => {
              if (!selectedStudent) { toast.error("স্টুডেন্ট সিলেক্ট করুন"); return; }

              // 1. Student profile data
              const stu = eligibleStudents.find(s => s.id === selectedStudent) || {};
              const prefill = {};
              (activeTemplate.placeholders || []).forEach(p => {
                const k = p.key;
                if (stu[k]) prefill[k] = stu[k];
                else if (stu[p.field]) prefill[k] = stu[p.field];
              });

              // 2. Saved document data from DB (Documents module-এ input করা data)
              // Template-র linked doc type থেকে, অথবা সব doc type check
              try {
                const allDocData = await api.get(`/docdata/student/${selectedStudent}`);
                if (Array.isArray(allDocData)) {
                  allDocData.forEach(dd => {
                    const saved = dd.field_data || {};
                    // Saved document fields → prefill (overrides student profile)
                    Object.entries(saved).forEach(([key, val]) => {
                      if (val) prefill[key] = val;
                    });
                  });
                }
              } catch { /* no saved data */ }

              setDocData(prefill);
              setGenerateStep("fill");
            }} disabled={!selectedStudent}>পরবর্তী →</Button>
          </div>
        </Card>
      )}

      {/* Step 2: Document Data Fill — প্রতিটি placeholder-র জন্য input */}
      {generateStep === "fill" && (
        <Card delay={50}>
          <div className="mb-4 p-3 rounded-lg" style={{ background: `${t.purple}08`, border: `1px solid ${t.purple}15` }}>
            <p className="text-xs">
              <strong>স্টুডেন্ট:</strong> {eligibleStudents.find(s => s.id === selectedStudent)?.name_en} ({selectedStudent})
            </p>
            <p className="text-[10px] mt-1" style={{ color: t.muted }}>
              ডকুমেন্টের তথ্য পূরণ করুন — student profile থেকে match থাকলে auto-fill হয়েছে, প্রয়োজনে পরিবর্তন করুন
            </p>
          </div>

          <div className="space-y-3">
            {(activeTemplate.placeholders || []).map((p, i) => (
              <div key={i}>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>
                  <span className="font-mono px-1.5 py-0.5 rounded mr-2" style={{ background: `${t.cyan}10`, color: t.cyan }}>
                    {p.placeholder || `{{${p.key}}}`}
                  </span>
                  {p.key}
                </label>
                <input
                  value={docData[p.key] || ""}
                  onChange={e => setDocData(prev => ({ ...prev, [p.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={is}
                  placeholder={`${p.key} এর মান লিখুন...`}
                />
              </div>
            ))}
          </div>

          {/* Save data to Documents module */}
          <div className="mt-3 p-3 rounded-lg" style={{ background: `${t.emerald}08`, border: `1px solid ${t.emerald}15` }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px]" style={{ color: t.textSecondary }}>
                এই data Documents মডিউলে save করুন — পরে আবার ব্যবহার করা যাবে
              </p>
              <button onClick={async () => {
                // Find matching doc type from template name
                const matchType = docTypes.find(dt =>
                  activeTemplate.name.toLowerCase().includes(dt.name.toLowerCase()) ||
                  (dt.name_bn && activeTemplate.name.includes(dt.name_bn))
                );
                if (!matchType) {
                  toast.error("এই template-র জন্য কোনো Document Type পাওয়া যায়নি — Administration-এ যোগ করুন");
                  return;
                }
                try {
                  await api.post("/docdata/save", {
                    student_id: selectedStudent,
                    doc_type_id: matchType.id,
                    field_data: docData,
                  });
                  toast.success(`${matchType.name_bn || matchType.name} — data সংরক্ষণ হয়েছে`);
                } catch (err) { toast.error(err.message); }
              }}
              className="px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{ background: t.emerald, color: "#fff" }}>
                Documents-এ Save
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <p className="text-[10px]" style={{ color: t.muted }}>
              পূরণ: {Object.values(docData).filter(Boolean).length}/{(activeTemplate.placeholders || []).length} fields
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" icon={Download} onClick={() => doGenerate("docx")} disabled={generating}>
                {generating ? "তৈরি হচ্ছে..." : ".docx ডাউনলোড"}
              </Button>
              <Button icon={Download} onClick={() => doGenerate("pdf")} disabled={generating}>
                .pdf ডাউনলোড
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // ══════════ LIST VIEW ══════════
  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Document Generator</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>ট্রান্সলেশন ও ডকুমেন্ট টেম্পলেট — Word/PDF ডাউনলোড</p>
        </div>
        <Button icon={Plus} onClick={() => setView("upload")}>Template আপলোড</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "মোট Template", value: templates.length, color: t.cyan },
          { label: "ট্রান্সলেশন", value: templates.filter(x => x.category === "translation").length, color: t.purple },
          { label: "সার্টিফিকেট", value: templates.filter(x => x.category === "certificate").length, color: t.emerald },
          { label: "মোট স্টুডেন্ট", value: eligibleStudents.length, color: t.amber },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 50}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      {templates.length === 0 && !loading && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-3">কিভাবে কাজ করে?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "১", title: "Template তৈরি", desc: "Word (.docx) ফাইলে {{name_en}}, {{dob}} ইত্যাদি placeholder লিখুন", color: t.cyan },
              { step: "২", title: "আপলোড", desc: "Template আপলোড করুন — সিস্টেম অটো {{}} detect করবে", color: t.purple },
              { step: "৩", title: "Generate", desc: "স্টুডেন্ট সিলেক্ট → .docx বা .pdf ডাউনলোড", color: t.emerald },
            ].map(s => (
              <div key={s.step} className="p-4 rounded-xl" style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2" style={{ background: `${s.color}20`, color: s.color }}>{s.step}</div>
                <p className="text-xs font-semibold">{s.title}</p>
                <p className="text-[10px] mt-1" style={{ color: t.muted }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {templates.map((tmpl, i) => (
        <Card key={tmpl.id} delay={100 + i * 50}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${t.cyan}15` }}>
                <File size={18} style={{ color: t.cyan }} />
              </div>
              <div>
                <p className="text-sm font-semibold">{tmpl.name}</p>
                <p className="text-[10px]" style={{ color: t.muted }}>
                  {tmpl.file_name} • {tmpl.total_fields} fields •{" "}
                  <Badge color={tmpl.category === "translation" ? "purple" : "emerald"} size="xs">{CATEGORIES.find(c => c.value === tmpl.category)?.label || tmpl.category}</Badge>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="xs" icon={Download} onClick={() => { setActiveTemplate(tmpl); setSelectedStudent(""); setStudentSearch(""); setFilterBatch("all"); setView("generate"); }}>Generate</Button>
              {deleteConfirmId === tmpl.id ? (
                <div className="flex gap-1">
                  <button onClick={() => deleteTemplate(tmpl)} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: t.rose, color: "#fff" }}>মুছুন</button>
                  <button onClick={() => setDeleteConfirmId(null)} className="text-[10px] px-2 py-1" style={{ color: t.muted }}>না</button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirmId(tmpl.id)} className="p-1.5 rounded-lg" style={{ color: t.muted }}
                  onMouseEnter={e => e.currentTarget.style.color = t.rose} onMouseLeave={e => e.currentTarget.style.color = t.muted}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
