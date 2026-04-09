/**
 * CertificatePage.jsx → Document Generator (Translation Template)
 *
 * .docx template upload → {{placeholder}} detect → student select → .docx/.pdf download
 */

import { useState, useEffect, useRef } from "react";
import { Plus, FileText, Upload, Download, Trash2, Search, X, ArrowLeft, File, AlertTriangle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import DropZone from "../../components/ui/DropZone";
import Button from "../../components/ui/Button";
import { api } from "../../hooks/useAPI";
import FieldMapperTable, { SYSTEM_FIELDS } from "../../components/ui/FieldMapper";

import { API_URL } from "../../lib/api";
const token = () => localStorage.getItem("agencyos_token");

// CATEGORIES — component-এর ভিতরে tr() দিয়ে label সেট হবে
const CATEGORY_KEYS = [
  { value: "translation", labelKey: "certificates.catTranslation" },
  { value: "certificate", labelKey: "certificates.catCertificate" },
  { value: "letter", labelKey: "certificates.catLetter" },
  { value: "other", labelKey: "certificates.catOther" },
];

export default function CertificatePage({ students }) {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
  const fileRef = useRef(null);
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
  const CATEGORIES = CATEGORY_KEYS.map(c => ({ value: c.value, label: tr(c.labelKey) }));

  const [templates, setTemplates] = useState([]);
  const [defaultTemplates, setDefaultTemplates] = useState([]); // সুপার অ্যাডমিনের ডিফল্ট টেমপ্লেট (read-only)
  const [view, setView] = useState("list");
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Upload
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("translation");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [linkedDocType, setLinkedDocType] = useState("");
  const [templateSource, setTemplateSource] = useState("default"); // "default" | "custom"
  const [selectedDefaultId, setSelectedDefaultId] = useState(""); // template-কে কোন doc type-এর সাথে link

  // Doc types from DB (Admin-defined document types with custom fields)
  const [docTypes, setDocTypes] = useState([]);
  useEffect(() => {
    api.get("/docdata/types").then(data => { if (Array.isArray(data)) setDocTypes(data); }).catch((err) => { console.error("[CertDocTypes Load]", err); });
  }, []);

  // Mapping — upload-এর পর placeholder → system field map
  const [detectedPlaceholders, setDetectedPlaceholders] = useState([]);
  const [mappings, setMappings] = useState({}); // { "studentName": "name_en" }
  const [modifiers, setModifiers] = useState({}); // { "Sex": ":jp", "Date of Birth": ":jp" }

  // Generate
  const [selectedStudent, setSelectedStudent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [filterBatch, setFilterBatch] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Document-specific data input — প্রতিটি placeholder-র জন্য user data দেবে
  const [docData, setDocData] = useState({}); // { "RegistrationNo": "12345", "IssueDate": "2020-01-01" }
  const [generateStep, setGenerateStep] = useState("student"); // student | fill


  // Doc type fields — Birth Certificate etc. fields mapping-এ আসবে (extraGroups হিসেবে)
  const allSystemFields = [];
  docTypes.forEach(dt => {
    const docFields = (dt.fields || [])
      .filter(f => f.type !== "section_header" && f.type !== "repeatable")
      .map(f => ({ key: f.key, label: `${f.label_en || f.label} (${dt.name})` }));
    if (docFields.length > 0) {
      allSystemFields.push({ group: `📄 ${dt.name}`, fields: docFields });
    }
  });

  useEffect(() => {
    // এজেন্সির নিজস্ব টেমপ্লেট লোড
    api.get("/docgen/templates").then(data => {
      if (Array.isArray(data)) setTemplates(data);
    }).catch((err) => { console.error("[Templates Load]", err); toast.error(tr("certificates.loadError")); }).finally(() => setLoading(false));

    // ডিফল্ট টেমপ্লেট লোড — সুপার অ্যাডমিনের আপলোড করা (read-only)
    api.get("/default-templates").then(data => {
      if (Array.isArray(data)) setDefaultTemplates(data.filter(dt => dt.category === "docgen"));
    }).catch(() => { /* ডিফল্ট টেমপ্লেট না পেলে চুপ থাকো */ });
  }, []);

  // Frontend modifier apply — backend resolveValue()-এর mirror
  const applyModifier = (value, modifier) => {
    if (!value || !modifier) return value;
    const val = String(value);

    // Custom map: :map(Male=男,Female=女)
    const mapMatch = modifier.match(/^:map\((.+)\)$/);
    if (mapMatch) {
      const maps = {};
      mapMatch[1].split(",").forEach(pair => { const [f, t] = pair.split("="); if (f && t) maps[f.trim()] = t.trim(); });
      return maps[val] || val;
    }

    // Date modifiers
    if (val.match(/^\d{4}-\d{2}-\d{2}/)) {
      const [y, m, d] = val.split("-");
      const dd = (d || "").slice(0, 2);
      if (modifier === ":jp") return `${y}年${parseInt(m)}月${parseInt(dd)}日`;
      if (modifier === ":slash") return `${y}/${m}/${dd}`;
      if (modifier === ":dot") return `${dd}.${m}.${y}`;
      if (modifier === ":dmy") return `${dd}/${m}/${y}`;
      if (modifier === ":mdy") return `${m}/${dd}/${y}`;
      if (modifier === ":year") return y;
      if (modifier === ":month") return m;
      if (modifier === ":day") return dd;
    }

    // Japanese auto-translate
    if (modifier === ":jp") {
      const JP = { "Male": "男", "Female": "女", "Other": "その他", "Bangladeshi": "バングラデシュ",
        "Single": "未婚", "Married": "既婚", "Divorced": "離婚",
        "A+": "A型(Rh+)", "A-": "A型(Rh-)", "B+": "B型(Rh+)", "B-": "B型(Rh-)",
        "AB+": "AB型(Rh+)", "AB-": "AB型(Rh-)", "O+": "O型(Rh+)", "O-": "O型(Rh-)",
        "Individual": "個人", "Science": "理系", "Commerce": "商業" };
      return JP[val] || val;
    }

    // Name parts
    if (modifier === ":first") return val.trim().split(/\s+/)[0] || "";
    if (modifier === ":last") return val.trim().split(/\s+/).slice(1).join(" ") || "";

    return val;
  };

  const eligibleStudents = (students || []).filter(s => !["VISITOR", "CANCELLED"].includes(s.status));
  const batchList = [...new Set(eligibleStudents.map(s => s.batch).filter(Boolean))];
  const batchFiltered = filterBatch === "all" ? eligibleStudents : eligibleStudents.filter(s => s.batch === filterBatch);
  const filteredStudents = studentSearch
    ? batchFiltered.filter(s => (s.name_en || "").toLowerCase().includes(studentSearch.toLowerCase()) || s.id.toLowerCase().includes(studentSearch.toLowerCase()))
    : batchFiltered;

  // ── Upload → detect placeholders → go to mapping ──
  const doUpload = async () => {
    if (!uploadName.trim()) { toast.error(tr("certificates.enterName")); return; }

    // ডিফল্ট টেমপ্লেট সিলেক্ট করলে — default template-এর file ব্যবহার
    if (templateSource === "default") {
      if (!selectedDefaultId) { toast.error(tr("certificates.selectDefault")); return; }
      const dt = defaultTemplates.find(t => t.id === selectedDefaultId);
      if (!dt || !dt.file_url) { toast.error(tr("certificates.noFileInTemplate")); return; }

      setUploading(true);
      try {
        // Backend-এ default template ID পাঠাই — backend নিজেই file copy করবে
        const res = await fetch(`${API_URL}/docgen/create-from-default`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
          body: JSON.stringify({
            default_template_id: dt.id,
            template_name: uploadName,
            category: uploadCategory,
            description: uploadDesc.trim() || dt.description || "",
            linked_doc_type: linkedDocType || "",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const phs = data.placeholders || [];
        setDetectedPlaceholders(phs);
        setActiveTemplate(data.template);
        const autoMap = {};
        const allKeys = [...SYSTEM_FIELDS, ...allSystemFields].flatMap(g => g.fields.map(f => f.key));
        phs.forEach(p => { if (allKeys.includes(p.key)) autoMap[p.key] = p.key; });
        setMappings(autoMap);
        setModifiers({});
        setView("mapping");
        toast.success(`"${uploadName}" — ${tr("certificates.createdFromDefault", { count: phs.length })}`);
      } catch (err) { toast.error(err.message); }
      setUploading(false);
      return;
    }

    // কাস্টম আপলোড
    if (!uploadFile) { toast.error(tr("certificates.selectDocx")); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("template_name", uploadName);
      formData.append("category", uploadCategory);
      if (uploadDesc.trim()) formData.append("description", uploadDesc.trim());
      if (linkedDocType) formData.append("linked_doc_type", linkedDocType);
      const res = await fetch(`${API_URL}/docgen/upload`, { method: "POST", headers: { Authorization: `Bearer ${token()}` }, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Detected placeholders → mapping step
      const phs = data.placeholders || [];
      setDetectedPlaceholders(phs);
      setActiveTemplate(data.template);

      // Auto-map: placeholder key === system/doc-type field হলে auto-select
      const autoMap = {};
      const allKeys = [...SYSTEM_FIELDS, ...allSystemFields].flatMap(g => g.fields.map(f => f.key));
      phs.forEach(p => { if (allKeys.includes(p.key)) autoMap[p.key] = p.key; });
      setMappings(autoMap);

      setView("mapping");
      toast.success(`"${uploadName}" — ${tr("certificates.placeholdersFound", { count: phs.length })}`);
    } catch (err) { toast.error(err.message); }
    setUploading(false);
  };

  // ── Save mapping to DB ──
  const saveMapping = async () => {
    const mapped = detectedPlaceholders.map(p => {
      let field = mappings[p.key] || p.key;
      // Modifier যোগ — :jp, :slash, :map(...) etc.
      const mod = modifiers[p.key];
      if (mod && mod !== "__custom__") field = field + mod;
      else if (mod === "__custom__" && modifiers[`${p.key}_custom`]) field = field + modifiers[`${p.key}_custom`];
      return { ...p, field };
    });
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
      toast.success(tr("certificates.mappingSaved", { count: Object.values(mappings).filter(Boolean).length }));
      setView("list");
    } catch { toast.error(tr("certificates.mappingSaveFailed")); }
  };

  // জন্ম নিবন্ধনের template_type থেকে matching .docx template suggest করো
  const suggestBirthCertTemplate = (studentId) => {
    // student-র saved birth cert data থেকে template_type বের করো
    // এবং templates list-এ match করো
    const birthCertType = docTypes.find(dt =>
      dt.name?.toLowerCase().includes("birth") || dt.name_bn === "জন্ম নিবন্ধন"
    );
    if (!birthCertType) return null;

    // student-র saved data async load হয় — তাই এটা prefill step-এ চলবে
    return birthCertType;
  };

  // Birth cert template_type → matching template auto-select
  const autoSelectTemplateByType = (templateType) => {
    if (!templateType) return null;

    // template_type থেকে keyword বের করো
    const typeKeywords = {
      "পৌরসভা (Paurashava)": ["paurashava", "পৌরসভা"],
      "সিটি কর্পোরেশন (City Corporation)": ["city corporation", "সিটি কর্পোরেশন", "city_corp"],
      "ইউনিয়ন পরিষদ (Union Parishad)": ["union parishad", "ইউনিয়ন পরিষদ", "union"],
    };

    const keywords = typeKeywords[templateType] || [];
    if (keywords.length === 0) return null;

    // templates list-এ search করো
    return templates.find(tmpl => {
      const name = (tmpl.name || "").toLowerCase();
      return keywords.some(kw => name.includes(kw.toLowerCase()));
    });
  };

  // ── Generate — student profile + document-specific data উভয়ই পাঠায় ──
  const doGenerate = async (format = "docx") => {
    if (!selectedStudent) { toast.error(tr("certificates.selectStudent")); return; }
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
      toast.success(tr("certificates.deleted"));
    } catch { toast.error(tr("certificates.deleteFailed")); }
    setDeleteConfirmId(null);
  };

  // Upload Modal — list view-এর মধ্যে render হবে (নিচে)

  // ══════════ MAPPING VIEW ══════════
  if (view === "mapping" && activeTemplate) return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center gap-4">
        <button onClick={() => setView("upload")} className="p-2 rounded-xl" style={{ background: t.inputBg }}><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{tr("certificates.fieldMapping")} — {activeTemplate.name}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{tr("certificates.mapEachPlaceholder")} • Mapped: {Object.values(mappings).filter(Boolean).length}/{detectedPlaceholders.length}</p>
        </div>
        <Button icon={Download} onClick={saveMapping}>{tr("common.save")} ({Object.values(mappings).filter(Boolean).length})</Button>
      </div>

      <Card delay={50}>
        {detectedPlaceholders.length > 0 ? (
          <FieldMapperTable
            placeholders={detectedPlaceholders}
            mappings={mappings}
            modifiers={modifiers}
            onMappingChange={(key, val) => setMappings(prev => ({ ...prev, [key]: val }))}
            onModifierChange={(key, val) => setModifiers(prev => ({ ...prev, [key]: val }))}
            extraGroups={allSystemFields.filter(g => g.group.startsWith("\u{1F4C4}"))}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-xs" style={{ color: t.muted }}>{tr("certificates.noPlaceholders")}</p>
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
          <h2 className="text-xl font-bold">{tr("certificates.generate")} — {activeTemplate.name}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>
            {generateStep === "student" ? tr("certificates.step1SelectStudent") : tr("certificates.step2FillData")}
          </p>
        </div>
      </div>

      {/* Step 1: Student Select */}
      {generateStep === "student" && (
        <Card delay={50}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <Search size={14} style={{ color: t.muted }} />
              <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }} placeholder={tr("certificates.searchStudent")} />
            </div>
            <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="px-3 py-2 rounded-xl text-xs outline-none" style={is}>
              <option value="all">{tr("certificates.allBatches")}</option>
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
              if (!selectedStudent) { toast.error(tr("certificates.selectStudent")); return; }

              // 1. Student profile data
              const stu = eligibleStudents.find(s => s.id === selectedStudent) || {};
              const prefill = {};

              // 2. Saved document data from DB — সব doc type-এর data একসাথে merge
              let allSavedFields = {};
              try {
                const allDocData = await api.get(`/docdata/student/${selectedStudent}`);
                if (Array.isArray(allDocData)) {
                  allDocData.forEach(dd => {
                    Object.entries(dd.field_data || {}).forEach(([key, val]) => {
                      if (val && key !== "_members" && !key.startsWith("_")) allSavedFields[key] = val;
                    });
                  });
                }
              } catch { /* no saved data */ }

              // 3. Template placeholder → mapped field → value from profile or doc data
              (activeTemplate.placeholders || []).forEach(p => {
                const placeholderKey = p.key;           // e.g. "Register No"
                const rawField = p.field || p.key;      // e.g. "sex:jp" or "register_no"
                // Modifier strip — "sex:jp" → base="sex", mod=":jp"
                const colonIdx = rawField.indexOf(":");
                const mappedField = colonIdx > 0 ? rawField.substring(0, colonIdx) : rawField;
                const mod = colonIdx > 0 ? rawField.substring(colonIdx) : null;

                // Priority: doc data > student profile > placeholder key match
                let rawValue = null;
                if (allSavedFields[mappedField]) rawValue = allSavedFields[mappedField];
                else if (allSavedFields[placeholderKey]) rawValue = allSavedFields[placeholderKey];
                else if (stu[mappedField]) rawValue = stu[mappedField];
                else if (stu[placeholderKey]) rawValue = stu[placeholderKey];

                // Modifier apply — preview-তেও transformed value দেখাবে
                if (rawValue) prefill[placeholderKey] = mod ? applyModifier(rawValue, mod) : rawValue;
              });

              setDocData(prefill);
              setGenerateStep("fill");
            }} disabled={!selectedStudent}>{tr("certificates.next")}</Button>
          </div>
        </Card>
      )}

      {/* Step 2: Document Data Fill — প্রতিটি placeholder-র জন্য input */}
      {generateStep === "fill" && (
        <Card delay={50}>
          <div className="mb-4 p-3 rounded-lg" style={{ background: `${t.purple}08`, border: `1px solid ${t.purple}15` }}>
            <p className="text-xs">
              <strong>{tr("certificates.studentLabel")}:</strong> {eligibleStudents.find(s => s.id === selectedStudent)?.name_en} ({selectedStudent})
            </p>
            <p className="text-[10px] mt-1" style={{ color: t.muted }}>
              {tr("certificates.fillDataHint")}
            </p>
          </div>

          {/* জন্ম নিবন্ধনের template_type অনুযায়ী matching template সাজেশন */}
          {(() => {
            const birthType = docData.template_type;
            if (!birthType) return null;
            const suggested = autoSelectTemplateByType(birthType);
            if (!suggested || suggested.id === activeTemplate.id) return null;
            return (
              <div className="mb-4 p-3 rounded-lg flex items-center justify-between"
                style={{ background: `${t.amber}08`, border: `1px solid ${t.amber}20` }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: t.amber }}>
                    {tr("certificates.suggestion", { type: birthType, name: suggested.name })}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>
                    {tr("certificates.switchHint")}
                  </p>
                </div>
                <button onClick={() => {
                  setActiveTemplate(suggested);
                  toast.success(tr("certificates.switchedTo", { name: suggested.name }));
                }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-medium shrink-0 ml-3"
                style={{ background: t.amber, color: "#fff" }}>
                  {tr("certificates.switchBtn")}
                </button>
              </div>
            );
          })()}

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
                  placeholder={tr("certificates.enterValue", { field: p.key })}
                />
              </div>
            ))}
          </div>

          {/* Save data to Documents module */}
          <div className="mt-3 p-3 rounded-lg" style={{ background: `${t.emerald}08`, border: `1px solid ${t.emerald}15` }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px]" style={{ color: t.textSecondary }}>
                {tr("certificates.saveToDocsHint")}
              </p>
              <button onClick={async () => {
                // Find matching doc type from template name
                const matchType = docTypes.find(dt =>
                  activeTemplate.name.toLowerCase().includes(dt.name.toLowerCase()) ||
                  (dt.name_bn && activeTemplate.name.includes(dt.name_bn))
                );
                if (!matchType) {
                  toast.error(tr("certificates.noDocType"));
                  return;
                }
                try {
                  await api.post("/docdata/save", {
                    student_id: selectedStudent,
                    doc_type_id: matchType.id,
                    field_data: docData,
                  });
                  toast.success(tr("certificates.dataSaved", { name: matchType.name_bn || matchType.name }));
                } catch (err) { toast.error(err.message); }
              }}
              className="px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{ background: t.emerald, color: "#fff" }}>
                {tr("certificates.saveToDocs")}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <p className="text-[10px]" style={{ color: t.muted }}>
              পূরণ: {Object.values(docData).filter(Boolean).length}/{(activeTemplate.placeholders || []).length} fields
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" icon={Download} onClick={() => doGenerate("docx")} disabled={generating}>
                {generating ? tr("certificates.generating") : tr("certificates.downloadWord")}
              </Button>
              <Button icon={Download} onClick={() => doGenerate("pdf")} disabled={generating}>
                {tr("certificates.downloadPdf")}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // ══════════ LIST VIEW ══════════
  return (<>
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">{tr("certificates.title")}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{tr("certificates.subtitle")}</p>
        </div>
        <Button icon={Plus} onClick={() => setView("upload")}>{tr("certificates.uploadTemplate")}</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: tr("certificates.totalTemplates"), value: templates.length, color: t.cyan },
          { label: tr("certificates.catTranslation"), value: templates.filter(x => x.category === "translation").length, color: t.amber },
          { label: tr("certificates.catCertificate"), value: templates.filter(x => x.category === "certificate").length, color: t.emerald },
          { label: tr("certificates.totalStudents"), value: eligibleStudents.length, color: t.rose },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 50}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      {templates.length === 0 && !loading && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-3">{tr("certificates.howItWorks")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "১", title: tr("certificates.howStep1Title"), desc: tr("certificates.howStep1Desc"), color: t.cyan },
              { step: "২", title: tr("certificates.howStep2Title"), desc: tr("certificates.howStep2Desc"), color: t.purple },
              { step: "৩", title: tr("certificates.howStep3Title"), desc: tr("certificates.howStep3Desc"), color: t.emerald },
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

      {/* ═══ আমার টেমপ্লেট — এজেন্সির নিজস্ব (full CRUD) ═══ */}
      {templates.map((tmpl, i) => (
        <Card key={tmpl.id} delay={100 + i * 50}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${t.cyan}15` }}>
                <File size={18} style={{ color: t.cyan }} />
              </div>
              <div>
                <p className="text-sm font-semibold">{tmpl.name}</p>
                {tmpl.description && <p className="text-[10px]" style={{ color: t.textSecondary }}>{tmpl.description}</p>}
                <p className="text-[10px]" style={{ color: t.muted }}>
                  {tmpl.file_name} • {tmpl.total_fields} fields •{" "}
                  <Badge color={tmpl.category === "translation" ? "purple" : "emerald"} size="xs">{CATEGORIES.find(c => c.value === tmpl.category)?.label || tmpl.category}</Badge>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                  setActiveTemplate(tmpl);
                  setDetectedPlaceholders(tmpl.placeholders || []);
                  // Restore saved mappings + modifiers
                  const restored = {};
                  const restoredMods = {};
                  (tmpl.placeholders || []).forEach(p => {
                    if (p.field) {
                      // Split field:modifier — e.g. "sex:jp" → field="sex", mod=":jp"
                      const colonIdx = p.field.indexOf(":");
                      if (colonIdx > 0) {
                        restored[p.key] = p.field.substring(0, colonIdx);
                        restoredMods[p.key] = p.field.substring(colonIdx);
                      } else {
                        restored[p.key] = p.field;
                      }
                    }
                  });
                  setMappings(restored);
                  setModifiers(restoredMods);
                  setView("mapping");
                }} className="text-[10px] px-2 py-1 rounded-lg" style={{ color: t.purple }}
                onMouseEnter={e => e.currentTarget.style.background = `${t.purple}15`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {tr("certificates.mapping")}
              </button>
              <Button size="xs" icon={Download} onClick={() => { setActiveTemplate(tmpl); setSelectedStudent(""); setStudentSearch(""); setFilterBatch("all"); setView("generate"); }}>{tr("certificates.generate")}</Button>
              <button onClick={() => setDeleteConfirmId(tmpl.id)} className="p-1.5 rounded-lg" style={{ color: t.muted }}
                onMouseEnter={e => e.currentTarget.style.color = t.rose} onMouseLeave={e => e.currentTarget.style.color = t.muted}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>

    {/* Upload Template Modal */}
    <Modal isOpen={view === "upload"} onClose={() => setView("list")} title={tr("certificates.createTemplate")} subtitle={tr("certificates.subtitle")} size="lg">
      <div className="space-y-4">
        {/* নাম + ক্যাটাগরি */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("certificates.templateName")} *</label>
            <input value={uploadName} onChange={e => setUploadName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={is} placeholder="Birth Certificate Translation" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("certificates.category")}</label>
            <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={is}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("certificates.description")}</label>
          <input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={is} placeholder="e.g. Paurashava format birth certificate for Japan visa" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("certificates.linkedDocType")}</label>
            <select value={linkedDocType} onChange={e => setLinkedDocType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={is}>
              <option value="">— None —</option>
              {docTypes.map(dt => <option key={dt.id} value={dt.name}>{dt.name_bn || dt.name}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[10px] mt-6" style={{ color: t.muted }}>{tr("certificates.linkedDocHint")}</p>
          </div>
        </div>

        {/* Template Source — ডিফল্ট or কাস্টম */}
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-2" style={{ color: t.muted }}>{tr("certificates.templateSource")}</label>
          <div className="flex gap-2 mb-3">
            <button onClick={() => { setTemplateSource("default"); setUploadFile(null); }}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: templateSource === "default" ? `${t.purple}15` : t.inputBg, color: templateSource === "default" ? t.purple : t.muted, border: `1px solid ${templateSource === "default" ? t.purple + "40" : t.inputBorder}` }}>
              📌 {tr("certificates.defaultTemplate")}
            </button>
            <button onClick={() => { setTemplateSource("custom"); setSelectedDefaultId(""); }}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: templateSource === "custom" ? `${t.cyan}15` : t.inputBg, color: templateSource === "custom" ? t.cyan : t.muted, border: `1px solid ${templateSource === "custom" ? t.cyan + "40" : t.inputBorder}` }}>
              📁 {tr("certificates.customUpload")}
            </button>
          </div>

          {/* ডিফল্ট টেমপ্লেট সিলেক্ট */}
          {templateSource === "default" && (
            <div className="space-y-2">
              {defaultTemplates.length === 0 && (
                <p className="text-[10px] text-center py-4" style={{ color: t.muted }}>{tr("certificates.noDefaultTemplates")}</p>
              )}
              {defaultTemplates.map(dt => (
                <button key={dt.id} onClick={() => {
                  setSelectedDefaultId(dt.id);
                  if (!uploadName) setUploadName(dt.name);
                  if (!uploadDesc) setUploadDesc(dt.description || "");
                }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                  style={{
                    background: selectedDefaultId === dt.id ? `${t.purple}12` : t.inputBg,
                    border: `1px solid ${selectedDefaultId === dt.id ? t.purple + "40" : t.inputBorder}`,
                  }}>
                  <div className="w-3 h-3 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedDefaultId === dt.id ? t.purple : t.muted }}>
                    {selectedDefaultId === dt.id && <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.purple }} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{dt.name}</p>
                    {dt.description && <p className="text-[10px]" style={{ color: t.muted }}>{dt.description}</p>}
                  </div>
                  {dt.file_url ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${t.emerald}15`, color: t.emerald }}>✓ ready</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${t.amber}15`, color: t.amber }}>no file</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* কাস্টম আপলোড */}
          {templateSource === "custom" && (
            <div>
              {uploadFile ? (
                <div onClick={() => fileRef.current?.click()} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: `${t.cyan}08`, border: `1px solid ${t.cyan}30` }}>
                  <input ref={fileRef} type="file" accept=".docx" onChange={e => setUploadFile(e.target.files[0])} className="hidden" />
                  <FileText size={24} style={{ color: t.cyan }} />
                  <div><p className="text-xs font-semibold">{uploadFile.name}</p><p className="text-[10px]" style={{ color: t.muted }}>{tr("certificates.clickToChange")}</p></div>
                </div>
              ) : (
                <DropZone accept=".docx" onFile={(file) => setUploadFile(file)}>
                  {tr("certificates.dropzoneText")}
                </DropZone>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setView("list")}>{tr("common.cancel")}</Button>
          <Button icon={Upload} onClick={doUpload} disabled={uploading || (templateSource === "default" && !selectedDefaultId) || (templateSource === "custom" && !uploadFile)}>
            {uploading ? tr("certificates.creating") : tr("certificates.create")}
          </Button>
        </div>
      </div>
    </Modal>

    {/* Delete Confirmation Modal */}
    <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title={tr("certificates.deleteTemplate")} size="sm">
      <div className="text-center py-4">
        <AlertTriangle size={40} className="mx-auto mb-3" style={{ color: t.rose }} />
        <p className="text-sm font-semibold mb-1">{tr("certificates.deleteConfirm")}</p>
        <p className="text-[10px] mb-4" style={{ color: t.muted }}>{tr("certificates.deleteWarning")}</p>
        <div className="flex justify-center gap-2">
          <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-lg text-xs" style={{ color: t.muted }}>{tr("common.cancel")}</button>
          <button onClick={() => { const tmpl = templates.find(t => t.id === deleteConfirmId); if (tmpl) deleteTemplate(tmpl); }}
            className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: t.rose, color: "#fff" }}>{tr("certificates.yesDelete")}</button>
        </div>
      </div>
    </Modal>
  </>);
}
