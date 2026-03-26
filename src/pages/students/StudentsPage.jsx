import { useState, useEffect } from "react";
import { Search, X, Plus, Download, Upload, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { PIPELINE_STATUSES } from "../../data/students";
import Pagination from "../../components/ui/Pagination";
import StudentDetailView from "./StudentDetailView";
import AddStudentForm from "./AddStudentForm";
import { api } from "../../hooks/useAPI";

export default function StudentsPage({ students, setStudents, reloadData }) {
  const t = useTheme();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState(null);

  // ── Backend থেকে students load (prop empty হলে) ──
  useEffect(() => {
    if (students.length > 0) return;
    api.get("/students").then(res => {
      const data = Array.isArray(res) ? res : res.data || [];
      if (data.length > 0) setStudents(data.map(s => ({
        ...s, batch: s.batches?.name || s.batch || "", school: s.schools?.name_en || s.school || "",
        passport: s.passport_number || "", father: s.father_name || "", mother: s.mother_name || "",
        created: s.created_at?.slice(0, 10) || "",
      })));
    }).catch(() => {});
  }, []);
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCountry, setFilterCountry] = useState("All");
  const [filterBranch, setFilterBranch] = useState("All");
  const [filterBatch, setFilterBatch] = useState("All");
  const [filterSchool, setFilterSchool] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);

  // ── Excel Import state ──
  const [showImport, setShowImport] = useState(false);
  const [importStep, setImportStep] = useState("upload"); // upload | mapping | preview | done
  const [importFile, setImportFile] = useState(null);
  const [importHeaders, setImportHeaders] = useState([]);
  const [importPreview, setImportPreview] = useState([]);
  const [importTotal, setImportTotal] = useState(0);
  const [importMapping, setImportMapping] = useState({});
  const [importSuggestions, setImportSuggestions] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const importFileRef = useState(null)[1];

  const SYSTEM_FIELDS = [
    { key: "", label: "— Skip —" },
    { key: "name_en", label: "নাম (English)" }, { key: "name_bn", label: "নাম (বাংলা)" },
    { key: "phone", label: "ফোন" }, { key: "email", label: "ইমেইল" },
    { key: "dob", label: "জন্ম তারিখ" }, { key: "gender", label: "লিঙ্গ" },
    { key: "passport_number", label: "পাসপোর্ট" }, { key: "nid", label: "NID" },
    { key: "father_name", label: "পিতার নাম" }, { key: "mother_name", label: "মাতার নাম" },
    { key: "permanent_address", label: "স্থায়ী ঠিকানা" }, { key: "current_address", label: "বর্তমান ঠিকানা" },
    { key: "country", label: "দেশ" }, { key: "school", label: "স্কুল" },
    { key: "batch", label: "ব্যাচ" }, { key: "branch", label: "ব্রাঞ্চ" },
    { key: "status", label: "স্ট্যাটাস" }, { key: "source", label: "সোর্স" },
    { key: "student_type", label: "টাইপ" }, { key: "intake", label: "Intake" },
    { key: "nationality", label: "জাতীয়তা" }, { key: "blood_group", label: "রক্তের গ্রুপ" },
    { key: "whatsapp", label: "WhatsApp" }, { key: "visa_type", label: "ভিসার ধরন" },
  ];

  // Excel file upload → parse headers
  const handleImportUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.upload("/students/import/parse", formData);
      setImportHeaders(res.headers || []);
      setImportPreview(res.preview || []);
      setImportTotal(res.totalRows || 0);
      setImportSuggestions(res.suggestions || {});
      // Auto-mapping from suggestions
      const autoMap = {};
      (res.headers || []).forEach(h => { if (res.suggestions[h]) autoMap[h] = res.suggestions[h]; });
      setImportMapping(autoMap);
      setImportStep("mapping");
    } catch (err) {
      toast.error("Parse ব্যর্থ: " + err.message);
    }
  };

  // Confirm import → send mapped data
  const doImport = async () => {
    const mapped = Object.entries(importMapping).filter(([_, v]) => v);
    if (mapped.length === 0) { toast.error("কমপক্ষে ১টি column ম্যাপ করুন"); return; }

    setImporting(true);
    try {
      // Build student records from preview + all rows (backend parsed)
      // Re-parse full file and map
      const formData = new FormData();
      formData.append("file", importFile);
      const parsed = await api.upload("/students/import/parse", formData);

      // Full data: parse all rows using mapping
      const allRows = [];
      // parsed.preview has only 5 rows, but totalRows has full count
      // For now use preview data to build mapped students
      // Better: backend should return all rows — let's send mapping to backend

      // Actually, let's build student objects from preview (all data)
      // Frontend has importFile — re-upload with mapping for full import
      const formData2 = new FormData();
      formData2.append("file", importFile);
      formData2.append("mapping", JSON.stringify(importMapping));

      // Use a different approach: parse on backend, map, and insert
      const res = await api.upload("/students/import/mapped", formData2);
      setImportResult(res);
      setImportStep("done");
      toast.success(res.message || `${res.success} জন import সফল`);
      if (reloadData) reloadData();
    } catch (err) {
      toast.error("Import ব্যর্থ: " + err.message);
    }
    setImporting(false);
  };
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const selectedStudent = selectedId ? students.find((s) => s.id === selectedId) : null;

  if (selectedStudent) {
    return (
      <StudentDetailView
        student={selectedStudent}
        onBack={() => setSelectedId(null)}
        onUpdate={async (updated) => {
          try { await api.patch(`/students/${updated.id}`, updated); } catch {}
          setStudents(students.map((s) => s.id === updated.id ? updated : s));
          toast.updated("Student");
        }}
        onDelete={async (id) => {
          try { await api.del(`/students/${id}`); } catch {}
          setStudents(students.filter((s) => s.id !== id));
          setSelectedId(null);
          toast.deleted("Student");
        }}
      />
    );
  }

  const countries = ["All", ...new Set(students.map((s) => s.country).filter(Boolean))];
  const statuses = ["All", ...PIPELINE_STATUSES.map((s) => s.code)];
  const branches = ["All", ...new Set(students.map((s) => s.branch).filter(Boolean))];
  const batches = ["All", ...new Set(students.map((s) => s.batch).filter(Boolean))];
  const schools = ["All", ...new Set(students.map((s) => s.school).filter(Boolean))];

  const filtered = students.filter((s) => {
    const q = searchQ.toLowerCase();
    const matchSearch = !searchQ || s.name_en.toLowerCase().includes(q) || (s.name_bn || "").includes(searchQ) || (s.phone || "").includes(searchQ) || s.id.toLowerCase().includes(q) || (s.passport_number || s.passport || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || s.status === filterStatus;
    const matchCountry = filterCountry === "All" || s.country === filterCountry;
    const matchBranch = filterBranch === "All" || (s.branch || "") === filterBranch;
    const matchBatch = filterBatch === "All" || (s.batch || "") === filterBatch;
    const matchSchool = filterSchool === "All" || (s.school || "") === filterSchool;
    return matchSearch && matchStatus && matchCountry && matchBranch && matchBatch && matchSchool;
  });
  const totalPages = Math.ceil(filtered.length / pageSize);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeCount = students.filter((s) => !["CANCELLED", "PAUSED"].includes(s.status)).length;
  const visaCount = students.filter((s) => ["VISA_GRANTED", "ARRIVED", "COMPLETED"].includes(s.status)).length;
  const ownCount = students.filter((s) => s.type === "own").length;
  const partnerCount = students.filter((s) => s.type === "partner").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Students</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>Student Pipeline Management</p>
        </div>
        <div className="flex gap-2 relative">
          <Button variant="ghost" size="xs" icon={Download} onClick={() => setShowExportMenu(p => !p)}>Export</Button>
          {showExportMenu && (
            <div className="absolute right-0 top-8 z-50 rounded-xl shadow-lg min-w-[200px] overflow-hidden"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              {[
                { label: `📋 Current View (${filtered.length} জন)`, data: filtered },
                { label: `📦 All Students (${students.length} জন)`, data: students },
              ].map((opt) => (
                <button key={opt.label} className="w-full text-left px-4 py-2.5 text-xs transition"
                  style={{ color: t.text }}
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => {
                    const cols = [
                      { h: "ID", k: "id" }, { h: "Name (EN)", k: "name_en" }, { h: "Name (BN)", k: "name_bn" },
                      { h: "Name (Katakana)", k: "name_katakana" }, { h: "Phone", k: "phone" }, { h: "WhatsApp", k: "whatsapp" },
                      { h: "Email", k: "email" }, { h: "DOB", k: "dob" }, { h: "Gender", k: "gender" },
                      { h: "Marital Status", k: "marital_status" }, { h: "Nationality", k: "nationality" },
                      { h: "NID", k: "nid" }, { h: "Passport No", k: "passport_number" },
                      { h: "Passport Issue", k: "passport_issue" }, { h: "Passport Expiry", k: "passport_expiry" },
                      { h: "Permanent Address", k: "permanent_address" }, { h: "Current Address", k: "current_address" },
                      { h: "Visa Type", k: "visa_type" }, { h: "Country", k: "country" }, { h: "School", k: "school" },
                      { h: "Batch", k: "batch" }, { h: "Intake", k: "intake" }, { h: "Agent", k: "agent" },
                      { h: "Source", k: "source" }, { h: "Counselor", k: "counselor" }, { h: "Type", k: "type" },
                      { h: "Branch", k: "branch" }, { h: "Google Drive", k: "gdrive_folder_url" },
                      { h: "Status", k: "status" }, { h: "Created", k: "created" }, { h: "Notes", k: "internal_notes" },
                    ];
                    const csv = cols.map(c => c.h).join(",") + "\n" +
                      opt.data.map(s => cols.map(c => `"${String(s[c.k] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
                    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
                    Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `Students_${new Date().toISOString().slice(0,10)}.csv` }).click();
                    toast.exported(`Students (${opt.data.length} records)`);
                    setShowExportMenu(false);
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <Button variant="ghost" icon={Upload} onClick={() => { setShowImport(true); setImportStep("upload"); setImportFile(null); setImportResult(null); }}>Excel Import</Button>
          <Button icon={Plus} onClick={() => setShowAddForm(true)}>Add Student</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Total", v: students.length, c: t.cyan },
          { l: "Active", v: activeCount, c: t.emerald },
          { l: "Visa / Arrived", v: visaCount, c: t.purple },
          { l: "Own / Partner", v: `${ownCount} / ${partnerCount}`, c: t.amber },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.inputBg }}>
            <p className="text-lg font-bold" style={{ color: s.c }}>{s.v}</p>
            <p className="text-[10px]" style={{ color: t.muted }}>{s.l}</p>
          </div>
        ))}
      </div>

      {showAddForm && (
        <AddStudentForm
          studentsCount={students.length}
          onCancel={() => setShowAddForm(false)}
          onSave={async (newStudent) => {
            try {
              const saved = await api.post("/students", newStudent);
              setStudents(prev => [saved, ...prev]);
            } catch {
              setStudents(prev => [newStudent, ...prev]);
            }
            setShowAddForm(false);
            toast.success(`${newStudent.name_en} — Student added!`);
          }}
        />
      )}

      {/* ══════════ EXCEL IMPORT MODAL ══════════ */}
      {showImport && (
        <Card delay={0}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {importStep !== "upload" && <button onClick={() => setImportStep(importStep === "done" ? "upload" : importStep === "preview" ? "mapping" : "upload")} className="p-1.5 rounded-lg" style={{ background: t.inputBg }}><ArrowLeft size={14} /></button>}
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2"><Upload size={14} /> Excel থেকে Student Import</h3>
                <p className="text-[10px]" style={{ color: t.muted }}>
                  {importStep === "upload" && "Step 1: Excel ফাইল আপলোড করুন"}
                  {importStep === "mapping" && `Step 2: Column Mapping — ${importTotal} জন student পাওয়া গেছে`}
                  {importStep === "done" && "Import সম্পন্ন"}
                </p>
              </div>
            </div>
            <button onClick={() => setShowImport(false)} className="p-1.5 rounded-lg" style={{ color: t.muted }}><X size={16} /></button>
          </div>

          {/* Step 1: Upload */}
          {importStep === "upload" && (
            <div>
              {/* ── Template Download ── */}
              <div className="mb-4 p-4 rounded-xl flex items-center justify-between" style={{ background: `${t.emerald}08`, border: `1px solid ${t.emerald}20` }}>
                <div>
                  <p className="text-xs font-semibold flex items-center gap-2"><Download size={14} style={{ color: t.emerald }} /> Sample Template ডাউনলোড করুন</p>
                  <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>এই ফাইলে সব column header আছে — ডাটা বসিয়ে আপলোড করুন। <span style={{ color: t.rose }}>*</span> চিহ্নিত column বাধ্যতামূলক।</p>
                </div>
                <button onClick={() => {
                  // Template Excel generate with headers + instructions
                  const cols = [
                    { h: "Name *", w: 25, note: "বাধ্যতামূলক — English-এ পুরো নাম" },
                    { h: "Name (বাংলা)", w: 25, note: "ঐচ্ছিক — বাংলায় নাম" },
                    { h: "Phone *", w: 15, note: "বাধ্যতামূলক — 01XXXXXXXXX" },
                    { h: "Email", w: 22, note: "ঐচ্ছিক" },
                    { h: "Date of Birth", w: 15, note: "YYYY-MM-DD format" },
                    { h: "Gender", w: 10, note: "Male / Female / Other" },
                    { h: "Passport No", w: 15, note: "পাসপোর্ট নম্বর" },
                    { h: "NID", w: 18, note: "জাতীয় পরিচয়পত্র নম্বর" },
                    { h: "Father Name", w: 20, note: "পিতার নাম" },
                    { h: "Mother Name", w: 20, note: "মাতার নাম" },
                    { h: "Address", w: 30, note: "স্থায়ী ঠিকানা" },
                    { h: "Country", w: 12, note: "Japan / Germany / Korea" },
                    { h: "Branch", w: 12, note: "Main / Chattogram / Sylhet" },
                    { h: "Source", w: 12, note: "Facebook / Walk-in / Agent / Referral" },
                    { h: "Blood Group", w: 10, note: "A+ / B+ / O+ / AB+ ইত্যাদি" },
                    { h: "WhatsApp", w: 15, note: "WhatsApp নম্বর (আলাদা হলে)" },
                    { h: "Nationality", w: 12, note: "Bangladeshi" },
                    { h: "Visa Type", w: 15, note: "Language Student / SSW / TITP" },
                  ];
                  // CSV fallback (সহজ — কোনো library দরকার নেই)
                  const bom = "\uFEFF";
                  const header = cols.map(c => c.h).join(",");
                  const notes = cols.map(c => `"${c.note}"`).join(",");
                  const sample = '"Mohammad Rahim","মোহাম্মদ রহিম","01811111111","rahim@gmail.com","1998-03-12","Male","BK1234567","1998123456789","Abdul Karim","Fatema Begum","Comilla, Bangladesh","Japan","Main","Facebook","B+","01811111111","Bangladeshi","Language Student"';
                  const csv = bom + header + "\n" + notes + "\n" + sample;
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                  Object.assign(document.createElement("a"), {
                    href: URL.createObjectURL(blob),
                    download: "AgencyBook_Student_Import_Template.csv"
                  }).click();
                  toast.success("Template ডাউনলোড হয়েছে — Excel-এ খুলুন, ডাটা বসান, .xlsx হিসেবে save করুন");
                }}
                className="px-4 py-2 rounded-lg text-xs font-medium transition shrink-0"
                style={{ background: t.emerald, color: "#fff" }}>
                  Template ডাউনলোড
                </button>
              </div>

              {/* ── File Upload ── */}
              <input type="file" accept=".xlsx" onChange={handleImportUpload} className="hidden" id="import-file" />
              <label htmlFor="import-file"
                className="flex flex-col items-center justify-center p-10 rounded-xl cursor-pointer border-2 border-dashed transition"
                style={{ borderColor: t.inputBorder, background: t.inputBg }}>
                <Upload size={36} style={{ color: t.muted }} />
                <p className="text-sm font-medium mt-3">Excel ফাইল আপলোড করুন</p>
                <p className="text-[10px] mt-1" style={{ color: t.muted }}>.xlsx ফরম্যাট — প্রথম row header হতে হবে</p>
              </label>
              <div className="mt-3 p-3 rounded-lg" style={{ background: `${t.cyan}08` }}>
                <p className="text-[11px]" style={{ color: t.textSecondary }}>
                  <strong>নিয়ম:</strong> প্রথম row = column header, দ্বিতীয় row থেকে student data।
                  <span style={{ color: t.rose }}> * </span>চিহ্নিত column (Name, Phone) অবশ্যই থাকতে হবে।
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {importStep === "mapping" && (
            <div>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      <th className="text-left py-2 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>Excel Column</th>
                      <th className="text-left py-2 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>→ System Field</th>
                      <th className="text-left py-2 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>Sample Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importHeaders.map(h => (
                      <tr key={h} style={{ borderBottom: `1px solid ${t.border}` }}>
                        <td className="py-2 px-3 font-medium">{h}</td>
                        <td className="py-2 px-3">
                          <select value={importMapping[h] || ""} onChange={e => setImportMapping(prev => ({ ...prev, [h]: e.target.value }))}
                            className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                            style={{ background: t.inputBg, border: `1px solid ${importMapping[h] ? `${t.emerald}60` : t.inputBorder}`, color: t.text }}>
                            {SYSTEM_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}{f.key ? ` (${f.key})` : ""}</option>)}
                          </select>
                        </td>
                        <td className="py-2 px-3" style={{ color: t.muted }}>{importPreview[0]?.[h] || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Preview */}
              <div className="mb-3 p-3 rounded-lg" style={{ background: t.inputBg }}>
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.muted }}>Data Preview (প্রথম {importPreview.length} জন)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr>{Object.entries(importMapping).filter(([_, v]) => v).map(([_, v]) => (
                        <th key={v} className="text-left py-1 px-2 font-medium" style={{ color: t.cyan }}>{v}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}>
                          {Object.entries(importMapping).filter(([_, v]) => v).map(([excelCol, _]) => (
                            <td key={excelCol} className="py-1 px-2">{row[excelCol] || "—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-xs" style={{ color: t.muted }}>
                  মোট: <strong style={{ color: t.text }}>{importTotal}</strong> জন •
                  ম্যাপ: <strong style={{ color: t.emerald }}>{Object.values(importMapping).filter(Boolean).length}</strong> columns
                </p>
                <Button icon={Check} onClick={doImport} disabled={importing}>
                  {importing ? "Import হচ্ছে..." : `${importTotal} জন Import করুন`}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {importStep === "done" && importResult && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: `${t.emerald}15` }}>
                <Check size={32} style={{ color: t.emerald }} />
              </div>
              <h3 className="text-lg font-bold mb-2">Import সম্পন্ন!</h3>
              <p className="text-sm" style={{ color: t.textSecondary }}>{importResult.message}</p>
              <div className="flex justify-center gap-6 mt-4">
                <div><p className="text-2xl font-bold" style={{ color: t.emerald }}>{importResult.success}</p><p className="text-[10px]" style={{ color: t.muted }}>সফল</p></div>
                {importResult.failed > 0 && <div><p className="text-2xl font-bold" style={{ color: t.rose }}>{importResult.failed}</p><p className="text-[10px]" style={{ color: t.muted }}>ব্যর্থ</p></div>}
              </div>
              {importResult.errors?.length > 0 && (
                <div className="mt-4 text-left">
                  {importResult.errors.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg mb-1" style={{ background: `${t.rose}08` }}>
                      <AlertTriangle size={12} style={{ color: t.rose }} />
                      <span>Row {e.row}: {e.name} — {e.error}</span>
                    </div>
                  ))}
                </div>
              )}
              <Button className="mt-6" onClick={() => { setShowImport(false); if (reloadData) reloadData(); }}>বন্ধ করুন</Button>
            </div>
          )}
        </Card>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-1.5 rounded-lg" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
          <Search size={13} style={{ color: t.muted }} />
          <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1); }} className="flex-1 bg-transparent text-xs outline-none" style={{ color: t.text }} placeholder="Search name, phone, ID..." />
          {searchQ && <button onClick={() => setSearchQ("")}><X size={12} style={{ color: t.muted }} /></button>}
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
          {statuses.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : PIPELINE_STATUSES.find(p => p.code === s)?.label || s}</option>)}
        </select>
        <select value={filterCountry} onChange={e => { setFilterCountry(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
          {countries.map(c => <option key={c} value={c}>{c === "All" ? "All Countries" : c}</option>)}
        </select>
        <select value={filterBranch} onChange={e => { setFilterBranch(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${filterBranch !== "All" ? t.cyan : t.inputBorder}`, color: filterBranch !== "All" ? t.cyan : t.text }}>
          {branches.map(b => <option key={b} value={b}>{b === "All" ? "সব Branch" : b}</option>)}
        </select>
        <select value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${filterBatch !== "All" ? t.amber : t.inputBorder}`, color: filterBatch !== "All" ? t.amber : t.text }}>
          {batches.map(b => <option key={b} value={b}>{b === "All" ? "সব Batch" : b}</option>)}
        </select>
        <select value={filterSchool} onChange={e => { setFilterSchool(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${filterSchool !== "All" ? t.emerald : t.inputBorder}`, color: filterSchool !== "All" ? t.emerald : t.text }}>
          {schools.map(s => <option key={s} value={s}>{s === "All" ? "সব School" : s}</option>)}
        </select>
      </div>

      <Card delay={100}>
        <p className="text-xs font-medium mb-3" style={{ color: t.textSecondary }}>মোট: {filtered.length} জন স্টুডেন্ট</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                {["ID", "Name", "Phone", "Branch", "Country", "School", "Batch", "Status", "Type"].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((s) => (
                <tr key={s.id} className="cursor-pointer" style={{ borderBottom: `1px solid ${t.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => setSelectedId(s.id)}>
                  <td className="py-3 px-3 font-mono text-[10px]" style={{ color: t.muted }}>{s.id}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: `${t.cyan}15`, color: t.cyan }}>
                        {s.name_en.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium block">{s.name_en}</span>
                        <span className="text-[9px] block" style={{ color: t.muted }}>{s.name_bn}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px]" style={{ color: t.textSecondary }}>{s.phone}</td>
                  <td className="py-3 px-3"><Badge color={t.purple} size="xs">{s.branch || "—"}</Badge></td>
                  <td className="py-3 px-3"><Badge color={s.country === "Japan" ? t.rose : s.country === "Germany" ? t.amber : t.emerald} size="xs">{s.country}</Badge></td>
                  <td className="py-3 px-3 text-[10px]" style={{ color: t.textSecondary }}>{s.school}</td>
                  <td className="py-3 px-3 text-[10px]" style={{ color: t.textSecondary }}>{s.batch}</td>
                  <td className="py-3 px-3"><StatusBadge status={s.status} /></td>
                  <td className="py-3 px-3"><Badge color={s.type === "own" ? t.cyan : t.amber} size="xs">{s.type}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="flex flex-col items-center py-12 opacity-40"><p className="text-sm">No students found</p></div>}
        <Pagination total={filtered.length} page={safePage} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </Card>
    </div>
  );
}
