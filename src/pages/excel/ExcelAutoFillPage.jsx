import { useState, useRef, useEffect } from "react";
import { Plus, FileText, CheckCircle, AlertTriangle, ArrowLeft, Download, Check, Upload, X, Save, Search, Settings, Trash2, Eye } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import DropZone from "../../components/ui/DropZone";
// FieldMapper থেকে shared SYSTEM_FIELDS + FieldPicker import
import { SYSTEM_FIELDS, FieldPicker } from "../../components/ui/FieldMapper";
// Templates loaded from backend API only

import { API_URL as API } from "../../lib/api";
import { formatDateDisplay } from "../../components/ui/DateInput";
const token = () => localStorage.getItem("agencyos_token");
// Auth headers — token + Super Admin agency switch
const authHeaders = () => {
  const h = { Authorization: `Bearer ${token()}` };
  const sw = localStorage.getItem("agencyos_switch_agency_id");
  if (sw) h["X-Switch-Agency"] = sw;
  return h;
};

// সব group-এর সব fields flatten করে একটি flat list — manual mapping dropdown-এ ব্যবহার হয়
const ALL_FIELDS = SYSTEM_FIELDS.flatMap(g => g.fields);

export default function ExcelAutoFillPage({ students }) {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
  const fileRef = useRef(null);

  // States
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load templates from backend API only
  useEffect(() => {
    const load = async () => {
      try {
        const tk = token();
        if (!tk) { setLoading(false); return; }
        const res = await fetch(`${API}/excel/templates`, {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setTemplates(data);
        }
      } catch { /* API unavailable */ }
      setLoading(false);
    };
    load();
  }, []);
  const [view, setView] = useState("list"); // list | upload | mapping | generate
  const [activeTemplate, setActiveTemplate] = useState(null);

  // Schools list for dropdown
  const [schoolsList, setSchoolsList] = useState([]);
  useEffect(() => {
    fetch(`${API}/schools?limit=500`, { headers: authHeaders() })
      .then(r => r.json()).then(res => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setSchoolsList(list);
      }).catch((err) => { console.error("[Excel Schools Load]", err); });
  }, []);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadSchool, setUploadSchool] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [parsedCells, setParsedCells] = useState([]);

  // Mapping state
  const [mappings, setMappings] = useState([]);
  const [manualCell, setManualCell] = useState({ cell: "", label: "", field: "" });

  // Generate state
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [filterBatch, setFilterBatch] = useState("all");

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
  const eligibleStudents = (students || []).filter(s => !["VISITOR", "FOLLOW_UP", "CANCELLED"].includes(s.status));
  const batchList = [...new Set(eligibleStudents.map(s => s.batch).filter(Boolean))];
  const batchFiltered = filterBatch === "all" ? eligibleStudents : eligibleStudents.filter(s => s.batch === filterBatch);
  const filteredStudents = studentSearch
    ? batchFiltered.filter(s => (s.name_en || "").toLowerCase().includes(studentSearch.toLowerCase()) || s.id.toLowerCase().includes(studentSearch.toLowerCase()))
    : batchFiltered;

  // ================================================================
  // STEP 1: UPLOAD
  // ================================================================
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.match(/\.xlsx?$/i)) { toast.error(tr("excel.onlyXlsx")); return; }
    if (file.name.endsWith(".xls") && !file.name.endsWith(".xlsx")) {
      toast.error(tr("excel.xlsNotSupported"));
      return;
    }
    setUploadFile(file);
  };

  const doUpload = async () => {
    if (!uploadSchool) { toast.error(tr("excel.selectSchoolErr")); return; }

    // Try API upload first
    if (uploadFile && token()) {
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", uploadFile);
        form.append("school_name", uploadSchool);
        const res = await fetch(`${API}/excel/upload-template`, {
          method: "POST",
          headers: authHeaders(),
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // {{placeholder}} cells from backend
        setActiveTemplate(data.template);
        const phs = data.placeholders || data.template?.mappings || [];
        setMappings(phs);
        setParsedCells(phs);

        setView("mapping");
        toast.success(`"${uploadSchool}" — ${phs.length} ${tr("excel.placeholdersFound")}`);
      } catch (err) {
        toast.error(err.message || tr("excel.uploadFailed"));
      } finally {
        setUploading(false);
      }
      return;
    }

    // Fallback: manual template (no file upload)
    const newTmpl = {
      id: `tmpl-${Date.now()}`,
      schoolName: uploadSchool,
      school_name: uploadSchool,
      fileName: uploadFile?.name || `${uploadSchool.replace(/\s+/g, "_")}.xlsx`,
      file_name: uploadFile?.name || `${uploadSchool.replace(/\s+/g, "_")}.xlsx`,
      version: "1.0",
      uploadDate: new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
      totalFields: 0,
      total_fields: 0,
      mappedFields: 0,
      mapped_fields: 0,
      mappings: [],
    };
    setActiveTemplate(newTmpl);
    setMappings([]);
    setView("mapping");
    toast.success(tr("excel.manualMappingStart"));
  };

  // Auto-detect field from Japanese/Bengali/English label
  const autoDetectField = (label) => {
    if (!label) return "";
    const l = label.toLowerCase();
    const map = {
      "氏名": "name_en", "name": "name_en", "নাম": "name_en", "ふりがな": "name_katakana",
      "カタカナ": "name_katakana", "生年月日": "dob", "date of birth": "dob", "জন্ম": "dob",
      "性別": "gender", "gender": "gender", "লিঙ্গ": "gender",
      "国籍": "nationality", "nationality": "nationality", "電話": "phone", "phone": "phone", "ফোন": "phone",
      "メール": "email", "email": "email", "ইমেইল": "email",
      "旅券番号": "passport_number", "passport": "passport_number", "পাসপোর্ট": "passport_number",
      "住所": "current_address", "address": "current_address", "ঠিকানা": "current_address",
      "父": "father_name_en", "father": "father_name_en", "পিতা": "father_name",
      "母": "mother_name_en", "mother": "mother_name_en", "মাতা": "mother_name",
      "最終学歴": "edu_hsc_school", "学校": "edu_ssc_school", "school": "edu_ssc_school",
      "日本語能力": "jp_level", "jlpt": "jp_level",
      "経費支弁者": "sponsor_name", "sponsor": "sponsor_name", "স্পন্সর": "sponsor_name",
    };
    for (const [k, v] of Object.entries(map)) {
      if (l.includes(k)) return v;
    }
    return "";
  };

  // ================================================================
  // STEP 2: MAPPING
  // ================================================================
  const updateMapping = (idx, field) => {
    const m = [...mappings];
    m[idx] = { ...m[idx], field };
    setMappings(m);
  };

  const addManualMapping = () => {
    if (!manualCell.cell || !manualCell.label) { toast.error(tr("excel.cellLabelRequired")); return; }
    setMappings([...mappings, { ...manualCell }]);
    setManualCell({ cell: "", label: "", field: "" });
  };

  const removeMapping = (idx) => setMappings(mappings.filter((_, i) => i !== idx));

  const saveMapping = async () => {
    const mapped = mappings.filter(m => m.field);
    if (mapped.length === 0) { toast.error(tr("excel.mapAtLeastOne")); return; }

    // Modifier যুক্ত করে save — field + modifier merge
    const mappingsWithMod = mappings.map(m => ({
      ...m,
      field: m.field ? (m.modifier ? m.field + m.modifier : m.field) : m.field,
    }));

    // Try API save
    if (activeTemplate?.id && token() && !activeTemplate.id.startsWith("tmpl-")) {
      try {
        const res = await fetch(`${API}/excel/templates/${activeTemplate.id}/mapping`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ mappings: mappingsWithMod }),
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setActiveTemplate(data);
      } catch { /* fallback below */ }
    }

    // Update local state
    const updated = {
      ...activeTemplate,
      mappings: mapped,
      totalFields: mappings.length,
      total_fields: mappings.length,
      mappedFields: mapped.length,
      mapped_fields: mapped.length,
    };
    setActiveTemplate(updated);
    setTemplates(prev => {
      const exists = prev.find(t => t.id === updated.id);
      if (exists) return prev.map(t => t.id === updated.id ? { ...t, ...updated } : t);
      return [...prev, updated];
    });

    toast.success(`${mapped.length} ${tr("excel.mappingSaved")}`);
    setView("list");
  };

  // ================================================================
  // STEP 3: GENERATE
  // ================================================================
  const doGenerate = async () => {
    if (selectedStudents.length === 0) { toast.error(tr("excel.selectAtLeastOne")); return; }

    const tmpl = activeTemplate;
    const name = tmpl.school_name || tmpl.schoolName;

    // Try API generate — one file per student (preserves all sheets)
    if (tmpl?.id && token() && !tmpl.id.startsWith("tmpl-")) {
      setGenerating(true);
      try {
        let downloaded = 0;
        for (const sid of selectedStudents) {
          const res = await fetch(`${API}/excel/generate-single`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ template_id: tmpl.id, student_id: sid }),
          });
          if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const studentName = (students || []).find(s => s.id === sid)?.name_en || sid;
          const ext = res.headers.get("content-type")?.includes("spreadsheet") ? "xlsx" : "csv";
          Object.assign(document.createElement("a"), { href: url, download: `${name}_${studentName}.${ext}` }).click();
          URL.revokeObjectURL(url);
          downloaded++;
          // Small delay between downloads so browser doesn't block
          if (selectedStudents.length > 1) await new Promise(r => setTimeout(r, 500));
        }
        toast.exported(`${name} — ${downloaded} ${tr("excel.resumeDownloaded")}`);
        setGenerating(false);
        return;
      } catch (err) {
        toast.error("API: " + err.message + " — " + tr("excel.csvFallback"));
        setGenerating(false);
      }
    }

    // Fallback: local CSV generation
    const mapped = (tmpl.mappings || []).filter(m => m.field);
    const sel = (students || []).filter(s => selectedStudents.includes(s.id));
    const headers = mapped.map(m => m.label || m.field).join(",");
    const rows = sel.map(s => mapped.map(m => {
      const val = String(s[m.field] ?? "").replace(/"/g, '""');
      return val.includes(",") || val.includes("\n") ? `"${val}"` : val;
    }).join(","));
    const csv = headers + "\n" + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${tmpl.schoolName || tmpl.school_name}_${sel.length}students.csv` }).click();
    toast.exported(`${tmpl.schoolName || tmpl.school_name} — ${sel.length} জনের ডেটা`);
  };

  // Template delete — DB + Storage থেকে remove
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const deleteTemplate = async (tmpl) => {
    try {
      if (tmpl.id && token() && !tmpl.id.startsWith("tmpl-")) {
        const res = await fetch(`${API}/excel/templates/${tmpl.id}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      }
      setTemplates(prev => prev.filter(t => t.id !== tmpl.id));
      toast.success(`"${tmpl.school_name || tmpl.schoolName}" — ${tr("excel.templateDeleted")}`);
    } catch (err) {
      toast.error(tr("excel.deleteFailed") + ": " + err.message);
    }
    setDeleteConfirmId(null);
  };

  // ================================================================
  // RENDER: UPLOAD VIEW
  // ================================================================
  if (view === "upload") {
    return (
      <div className="space-y-5 anim-fade">
        <div className="flex items-center gap-4">
          <button onClick={() => setView("list")} className="p-2 rounded-xl transition" style={{ background: "transparent" }}
            onMouseEnter={e => e.currentTarget.style.background = t.hoverBg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold">{tr("excel.uploadTitle")}</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>{tr("excel.uploadSubtitle")}</p>
          </div>
        </div>

        <Card delay={50}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("excel.selectSchool")} <span className="req-star">*</span></label>
              <select value={uploadSchool} onChange={e => setUploadSchool(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ ...is, borderColor: !uploadSchool ? t.rose + "40" : t.inputBorder }}>
                <option value="">— {tr("excel.selectSchool")} —</option>
                {schoolsList.map(s => <option key={s.id} value={s.name_en}>{s.name_en}{s.name_jp ? ` (${s.name_jp})` : ""}</option>)}
              </select>
              {!uploadSchool && <p className="text-[10px] mt-1" style={{ color: t.rose }}>{tr("excel.schoolRequired")}</p>}
            </div>

            {/* File Upload Area */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("excel.excelFile")}</label>
              {uploadFile ? (
                <div onClick={() => fileRef.current?.click()} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: `${t.cyan}08`, border: `1px solid ${t.cyan}30` }}>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
                  <FileText size={24} style={{ color: t.cyan }} />
                  <div>
                    <p className="text-xs font-semibold">{uploadFile.name}</p>
                    <p className="text-[10px]" style={{ color: t.muted }}>{(uploadFile.size / 1024).toFixed(1)} KB — {tr("excel.clickToChange")}</p>
                  </div>
                </div>
              ) : (
                <DropZone accept=".xlsx,.xls" onFile={(file) => handleFileSelect({ target: { files: [file] } })}>
                  {tr("excel.dropzone")}
                </DropZone>
              )}
            </div>

            <div className="p-3 rounded-xl" style={{ background: `${t.cyan}08`, border: `1px solid ${t.cyan}15` }}>
              <p className="text-[11px]" style={{ color: t.textSecondary }}>
                <strong>{tr("excel.howItWorks")}:</strong> {tr("excel.howItWorksDesc")}
              </p>
              <p className="text-[10px] mt-2" style={{ color: t.muted }}>
                {tr("excel.example")}: <code>{"{{name_en}}"}</code> → Mohammad Rahim, <code>{"{{dob}}"}</code> → 1998-03-12, <code>{"{{father_name}}"}</code> → Abdul Karim
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
              <Button variant="ghost" onClick={() => { setView("list"); setUploadFile(null); setUploadSchool(""); }}>{tr("common.cancel")}</Button>
              <Button icon={Upload} onClick={doUpload} disabled={uploading}>
                {uploading ? tr("excel.uploading") : tr("excel.uploadAndDetect")}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ================================================================
  // RENDER: MAPPING VIEW
  // ================================================================
  if (view === "mapping" && activeTemplate) {
    const mappedCount = mappings.filter(m => m.field).length;
    return (
      <div className="space-y-5 anim-fade">
        <div className="flex items-center gap-4">
          <button onClick={() => setView("list")} className="p-2 rounded-xl transition" style={{ background: "transparent" }}
            onMouseEnter={e => e.currentTarget.style.background = t.hoverBg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{tr("excel.fieldMapping")} — {activeTemplate.school_name || activeTemplate.schoolName}</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>
              {tr("excel.mappingSubtitle")} • Mapped: {mappedCount}/{mappings.length}
            </p>
          </div>
          <Button icon={Save} onClick={saveMapping}>{tr("excel.saveMapping")} ({mappedCount})</Button>
        </div>

        {/* Mapping Table */}
        <Card delay={50}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["Sheet", "Cell", "Placeholder ({{...}})", "System Field + Modifier", ""].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mappings.map((m, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td className="py-2 px-2 text-[10px]" style={{ color: t.purple, minWidth: 140 }}>
                      {m.sheet ? <span className="px-1.5 py-0.5 rounded" style={{ background: `${t.purple}10` }}>{m.sheet}</span> : <span style={{ color: t.muted }}>—</span>}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold" style={{ color: t.cyan, width: 60 }}>{m.cell}</td>
                    <td className="py-2 px-3" style={{ maxWidth: 200 }}>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${t.cyan}10`, color: t.cyan }}>
                        {m.placeholder || `{{${m.key || m.label}}}`}
                      </span>
                    </td>
                    <td className="py-2 px-3" style={{ minWidth: 280 }}>
                      <FieldPicker
                        placeholderKey={String(i)}
                        selectedField={m.field || ""}
                        selectedModifier={m.modifier || ""}
                        onFieldChange={(_, val) => updateMapping(i, val)}
                        onModifierChange={(_, val) => {
                          const updated = [...mappings];
                          updated[i] = { ...updated[i], modifier: val };
                          setMappings(updated);
                        }}
                      />
                    </td>
                    {/* Modifier FieldPicker-এ built-in */}
                    <td className="py-2 px-3 text-center" style={{ width: 30 }}>
                      <button onClick={() => removeMapping(i)} className="p-1 rounded opacity-50 hover:opacity-100 transition"
                        style={{ color: t.rose }}><X size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Manual Mapping */}
          <div className="mt-3 pt-3 flex gap-2 items-end flex-wrap" style={{ borderTop: `1px solid ${t.border}` }}>
            <div>
              <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Sheet</label>
              <input value={manualCell.sheet || ""} onChange={e => setManualCell({ ...manualCell, sheet: e.target.value })}
                className="w-28 px-2 py-1.5 rounded text-xs outline-none" style={is} placeholder="Sheet1" />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Cell</label>
              <input value={manualCell.cell} onChange={e => setManualCell({ ...manualCell, cell: e.target.value })}
                className="w-16 px-2 py-1.5 rounded text-xs outline-none" style={is} placeholder="B5" />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Label</label>
              <input value={manualCell.label} onChange={e => setManualCell({ ...manualCell, label: e.target.value })}
                className="w-full px-2 py-1.5 rounded text-xs outline-none" style={is} placeholder={tr("excel.labelPlaceholder")} />
            </div>
            <div className="flex-1">
              <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Field</label>
              <select value={manualCell.field} onChange={e => setManualCell({ ...manualCell, field: e.target.value })}
                className="w-full px-2 py-1.5 rounded text-xs outline-none" style={is}>
                <option value="">—</option>
                {ALL_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
            <button onClick={addManualMapping} className="px-3 py-1.5 rounded text-xs font-medium shrink-0"
              style={{ background: `${t.cyan}15`, color: t.cyan }}>
              <Plus size={14} />
            </button>
          </div>
        </Card>

        {/* Auto-detect hint */}
        {parsedCells.length > 0 && (
          <Card delay={100}>
            <h3 className="text-xs font-semibold mb-2">Detected Labels ({parsedCells.length})</h3>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {parsedCells.map((c, i) => (
                <span key={i} className="px-2 py-1 rounded text-[10px]" style={{ background: t.inputBg, color: t.textSecondary }}>
                  <span className="font-mono" style={{ color: t.cyan }}>{c.cell}</span> {c.label}
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ================================================================
  // RENDER: GENERATE VIEW
  // ================================================================
  if (view === "generate" && activeTemplate) {
    return (
      <div className="space-y-5 anim-fade">
        <div className="flex items-center gap-4">
          <button onClick={() => { setView("list"); setSelectedStudents([]); setStudentSearch(""); }} className="p-2 rounded-xl transition" style={{ background: "transparent" }}
            onMouseEnter={e => e.currentTarget.style.background = t.hoverBg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{tr("excel.resumeGenerate")} — {activeTemplate.school_name || activeTemplate.schoolName}</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>
              {(activeTemplate.mappings || []).filter(m => m.field).length} fields mapped • {tr("excel.selectAndDownload")}
            </p>
          </div>
        </div>

        <Card delay={50}>
          {/* Search + Batch Filter */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <Search size={14} style={{ color: t.muted }} />
              <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
                placeholder={tr("excel.searchStudents")} />
            </div>
            <select value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setSelectedStudents([]); }}
              className="px-3 py-2 rounded-xl text-xs outline-none"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
              <option value="all">{tr("excel.allBatches")}</option>
              {batchList.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <Button variant="ghost" size="xs" onClick={() => setSelectedStudents(
              selectedStudents.length === filteredStudents.length ? [] : filteredStudents.map(s => s.id)
            )}>
              {selectedStudents.length === filteredStudents.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          {/* Student List */}
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {filteredStudents.map(st => {
              const isSel = selectedStudents.includes(st.id);
              return (
                <div key={st.id} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition"
                  style={{ background: isSel ? `${t.cyan}10` : "transparent", border: `1px solid ${isSel ? `${t.cyan}30` : "transparent"}` }}
                  onClick={() => setSelectedStudents(isSel ? selectedStudents.filter(id => id !== st.id) : [...selectedStudents, st.id])}>
                  <div className="h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition"
                    style={{ borderColor: isSel ? t.cyan : `${t.muted}40`, background: isSel ? t.cyan : "transparent" }}>
                    {isSel && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{st.name_en}</p>
                    <p className="text-[10px]" style={{ color: t.muted }}>{st.id} • {st.batch || "No batch"}</p>
                  </div>
                  <StatusBadge status={st.status} />
                </div>
              );
            })}
            {filteredStudents.length === 0 && (
              <p className="text-center py-6 text-xs" style={{ color: t.muted }}>{tr("excel.noStudentsFound")}</p>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <p className="text-xs" style={{ color: t.muted }}>
              {tr("excel.selected")}: <span className="font-bold" style={{ color: t.cyan }}>{selectedStudents.length}</span> {tr("excel.person")}
            </p>
            <Button icon={Download} onClick={doGenerate} disabled={generating}>
              {generating ? "Generating..." : `Generate ${selectedStudents.length > 0 ? `(${selectedStudents.length})` : ""}`}
            </Button>
          </div>
        </Card>

        {/* Mapping Preview */}
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-3">Field Mapping Preview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(activeTemplate.mappings || []).filter(m => m.field).map((m, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px]" style={{ background: t.inputBg }}>
                <span className="font-mono font-bold" style={{ color: t.cyan }}>{m.cell}</span>
                <span style={{ color: t.muted }}>{m.label}</span>
                <span className="ml-auto font-mono" style={{ color: t.purple }}>{m.field}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ================================================================
  // RENDER: LIST VIEW (default)
  // ================================================================
  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">{tr("excel.title")}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{tr("excel.subtitle")}</p>
        </div>
        <Button icon={Upload} onClick={() => { setView("upload"); setUploadSchool(""); setUploadFile(null); }}>
          {tr("excel.templateUpload")}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: tr("excel.totalTemplates"), value: templates.length, color: t.cyan, icon: FileText },
          { label: tr("excel.fullyMapped"), value: templates.filter(e => (e.mappedFields || e.mapped_fields || 0) >= (e.totalFields || e.total_fields || 1)).length, color: t.emerald, icon: CheckCircle },
          { label: tr("excel.needsMapping"), value: templates.filter(e => (e.mappedFields || e.mapped_fields || 0) < (e.totalFields || e.total_fields || 1)).length, color: t.amber, icon: AlertTriangle },
          { label: tr("excel.totalStudents"), value: eligibleStudents.length, color: t.purple, icon: FileText },
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

      {/* How it works */}
      {templates.length === 0 && (
        <Card delay={200}>
          <h3 className="text-sm font-bold mb-3">{tr("excel.howItWorksTitle")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "১", title: tr("excel.step1Title"), desc: tr("excel.step1Desc"), color: t.cyan },
              { step: "২", title: tr("excel.step2Title"), desc: tr("excel.step2Desc"), color: t.amber },
              { step: "৩", title: tr("excel.step3Title"), desc: tr("excel.step3Desc"), color: t.emerald },
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-black mb-2" style={{ background: `${s.color}20`, color: s.color }}>{s.step}</div>
                <p className="text-xs font-bold mb-1">{s.title}</p>
                <p className="text-[10px]" style={{ color: t.muted }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Template List */}
      <div className="space-y-3">
        {templates.map((tmpl, i) => {
          const total = tmpl.totalFields || tmpl.total_fields || 0;
          const mapped = tmpl.mappedFields || tmpl.mapped_fields || 0;
          const pct = total > 0 ? Math.round((mapped / total) * 100) : 0;
          const isComplete = pct >= 100;
          const name = tmpl.schoolName || tmpl.school_name;
          const file = tmpl.fileName || tmpl.file_name;
          const date = formatDateDisplay(tmpl.uploadDate || tmpl.created_at);

          return (
            <Card key={tmpl.id} delay={150 + i * 60} className="!p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: isComplete ? `${t.emerald}10` : `${t.amber}10` }}>
                  {isComplete ? "✅" : "📊"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold">{name}</p>
                    <Badge color={isComplete ? t.emerald : t.amber} size="xs">
                      {total === 0 ? "No mapping" : isComplete ? "Ready" : `${pct}% mapped`}
                    </Badge>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>
                    {file} • {date} • {mapped}/{total} fields
                  </p>
                  {total > 0 && (
                    <div className="h-1.5 rounded-full overflow-hidden mt-2 w-48" style={{ background: `${t.muted}20` }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: isComplete ? t.emerald : t.amber }} />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="xs" icon={Settings} onClick={() => {
                    setActiveTemplate(tmpl);
                    setMappings(tmpl.mappings || []);
                    setParsedCells([]);
                    setView("mapping");
                  }}>Mapping</Button>
                  <Button size="xs" icon={Download} onClick={() => {
                    if ((tmpl.mappings || []).filter(m => m.field).length === 0) {
                      toast.error(tr("excel.doMappingFirst"));
                      return;
                    }
                    setActiveTemplate(tmpl);
                    setSelectedStudents([]);
                    setStudentSearch("");
                    setView("generate");
                  }}>Generate</Button>
                  {deleteConfirmId === tmpl.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteTemplate(tmpl)} className="text-[10px] px-2 py-1 rounded-lg font-medium" style={{ background: t.rose, color: "#fff" }}>{tr("common.delete")}</button>
                      <button onClick={() => setDeleteConfirmId(null)} className="text-[10px] px-2 py-1 rounded-lg" style={{ color: t.muted }}>{tr("common.no")}</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(tmpl.id)} className="p-1.5 rounded-lg transition"
                      style={{ color: t.muted }}
                      onMouseEnter={e => { e.currentTarget.style.color = t.rose; e.currentTarget.style.background = `${t.rose}10`; }}
                      onMouseLeave={e => { e.currentTarget.style.color = t.muted; e.currentTarget.style.background = "transparent"; }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
