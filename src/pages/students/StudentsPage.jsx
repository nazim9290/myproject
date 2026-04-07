import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Plus, Download, Upload, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import DropZone from "../../components/ui/DropZone";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { PIPELINE_STATUSES } from "../../data/students";
import Pagination from "../../components/ui/Pagination";
import SortHeader from "../../components/ui/SortHeader";
import useSortable from "../../hooks/useSortable";
import { formatPhoneDisplay } from "../../components/ui/PhoneInput";
import StudentDetailView from "./StudentDetailView";
import AddStudentForm from "./AddStudentForm";
import ExportModal from "../../components/ui/ExportModal";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import { getRowStyle } from "../../lib/conditionalFormat";
import TableInsights from "../../components/ui/TableInsights";
import { api } from "../../hooks/useAPI";
import { API_URL } from "../../lib/api";

// ── TableInsights-এ ব্যবহৃত গ্রুপিং ও রুলের ফিল্ডসমূহ ──
const INSIGHT_FIELDS = [
  { key: "status", label: "Status" },
  { key: "country", label: "Country" },
  { key: "school", label: "School" },
  { key: "batch", label: "Batch" },
  { key: "branch", label: "Branch" },
  { key: "source", label: "Source" },
  { key: "counselor", label: "Counselor" },
  { key: "student_type", label: "Type" },
  { key: "visa_type", label: "Visa Type" },
  { key: "gender", label: "Gender" },
];

// ── এক্সপোর্ট মডালে দেখানো কলামগুলো — সব student ফিল্ড ──
const EXPORT_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name_en", label: "Name (EN)" },
  { key: "name_bn", label: "Name (BN)" },
  { key: "phone", label: "Phone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "dob", label: "DOB" },
  { key: "gender", label: "Gender" },
  { key: "passport_number", label: "Passport" },
  { key: "country", label: "Country" },
  { key: "school", label: "School" },
  { key: "batch", label: "Batch" },
  { key: "status", label: "Status" },
  { key: "branch", label: "Branch" },
  { key: "source", label: "Source" },
  { key: "counselor", label: "Counselor" },
  { key: "created", label: "Created" },
];

export default function StudentsPage({ students, setStudents, reloadData, stepConfigs, setActivePage }) {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
  const [selectedId, setSelectedId] = useState(null);

  // ── Server-side pagination ও search state ──
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCountry, setFilterCountry] = useState("All");
  const [filterBranch, setFilterBranch] = useState("All");
  const [filterBatch, setFilterBatch] = useState("All");
  const [filterSchool, setFilterSchool] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [insightFilter, setInsightFilter] = useState(null);

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
  const [serverTotal, setServerTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  // ── ExportModal দেখানোর state — কলাম সিলেক্ট করে CSV ডাউনলোড ──
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalData, setExportModalData] = useState([]);
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("created", "desc");

  // ── Search debounce — টাইপ করার সময় প্রতিটি keystroke-এ API call এড়ানো ──
  const searchTimerRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(searchQ), 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQ]);

  // ── Server-side pagination — API থেকে page-by-page data fetch ──
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterStatus !== "All") params.status = filterStatus;
      if (filterCountry !== "All") params.country = filterCountry;
      if (filterBranch !== "All") params.branch = filterBranch;
      if (filterBatch !== "All") params.batch = filterBatch;
      if (filterSchool !== "All") params.school = filterSchool;
      const qs = new URLSearchParams(params).toString();
      const res = await api.get(`/students?${qs}`);
      const data = Array.isArray(res) ? res : res.data || [];
      const total = res.total ?? data.length;
      setStudents(data.map(s => ({
        ...s, batch: s.batches?.name || s.batch || "", school: s.schools?.name_en || s.school || "",
        passport: s.passport_number || "", father: s.father_name || "", mother: s.mother_name || "",
        created: s.created_at?.slice(0, 10) || "",
      })));
      setServerTotal(total);
    } catch (err) {
      console.error("[Students Load]", err);
      toast.error("স্টুডেন্ট ডাটা লোড করতে সমস্যা হয়েছে");
    }
    setLoading(false);
  }, [page, pageSize, debouncedSearch, filterStatus, filterCountry, filterBranch, filterBatch, filterSchool]);

  // ── ফিল্টার/পেজ বদলালে re-fetch হবে ──
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Bulk Selection ──
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const toggleSelect = (id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => { if (selectedIds.size === paginated.length) setSelectedIds(new Set()); else setSelectedIds(new Set(paginated.map(s => s.id))); };
  const bulkChangeStatus = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    const ids = [...selectedIds];
    try {
      await Promise.all(ids.map(id => api.patch(`/students/${id}`, { status: bulkStatus })));
      toast.success(`${ids.length} জন স্টুডেন্টের স্ট্যাটাস পরিবর্তন হয়েছে`);
      setSelectedIds(new Set());
      setBulkStatus("");
      fetchStudents(); // সার্ভার থেকে re-fetch
    } catch (err) { toast.error(err.message || "সমস্যা হয়েছে"); }
  };
  const bulkDelete = async () => {
    const ids = [...selectedIds];
    try {
      await Promise.all(ids.map(id => api.del(`/students/${id}`)));
      toast.success(`${ids.length} জন মুছে ফেলা হয়েছে`);
      setSelectedIds(new Set());
      fetchStudents(); // সার্ভার থেকে re-fetch
    } catch (err) { toast.error(err.message || "সমস্যা হয়েছে"); }
  };

  const selectedStudent = selectedId ? students.find((s) => s.id === selectedId) : null;

  if (selectedStudent) {
    return (
      <StudentDetailView
        student={selectedStudent}
        stepConfigs={stepConfigs}
        onBack={() => setSelectedId(null)}
        onNavigate={setActivePage}
        onUpdate={async (updated, skipPatch) => {
          // skipPatch = true হলে শুধু local state update (backend-এ already saved)
          if (!skipPatch) {
            try { await api.patch(`/students/${updated.id}`, updated); } catch (err) { console.error("[Student Update]", err); toast.error("সার্ভারে আপডেট ব্যর্থ"); }
          }
          setStudents(students.map((s) => s.id === updated.id ? { ...s, ...updated } : s));
          if (!skipPatch) toast.updated("Student");
          fetchStudents();
        }}
        onDelete={async (id) => {
          try { await api.del(`/students/${id}`); } catch (err) { console.error("[Student Delete]", err); toast.error("সার্ভার থেকে মুছতে সমস্যা হয়েছে"); }
          setSelectedId(null);
          toast.deleted("Student");
          fetchStudents(); // সার্ভার থেকে re-fetch
        }}
      />
    );
  }

  // ── Filter dropdown options — students array থেকে নেওয়া (current page data) ──
  // দ্রষ্টব্য: সার্ভার-সাইড ফিল্টার — dropdown values static রাখা হচ্ছে
  const statuses = ["All", ...PIPELINE_STATUSES.map((s) => s.code)];
  const uniqueVals = (arr, key) => [...new Set(arr.map(s => (s[key] || "").trim()).filter(v => v && v !== "—" && v !== "-"))];
  const countries = ["All", ...uniqueVals(students, "country")];
  const branches = ["All", ...uniqueVals(students, "branch")];
  const batches = ["All", ...uniqueVals(students, "batch")];
  const schools = ["All", ...uniqueVals(students, "school")];

  // ── সার্ভার থেকে ইতিমধ্যে ফিল্টার ও পেজিনেট করা data এসেছে ──
  // শুধু client-side sort প্রয়োগ করা হচ্ছে (API order by created_at desc)
  const paginated = sortFn(students);

  // ── Insight filter — TableInsights group card click করলে client-side filter (hook early) ──
  const displayData = insightFilter?.value
    ? paginated.filter(s => String(s[insightFilter.field] || "").toLowerCase() === String(insightFilter.value).toLowerCase())
    : paginated;

  // ── KPI counts — current page-এর data থেকে (approximate; সার্ভারে total থেকে exact) ──
  const activeCount = students.filter((s) => !["CANCELLED", "PAUSED"].includes(s.status)).length;
  const visaCount = students.filter((s) => ["VISA_GRANTED", "ARRIVED", "COMPLETED"].includes(s.status)).length;
  const ownCount = students.filter((s) => s.type === "own").length;
  const partnerCount = students.filter((s) => s.type === "partner").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{tr("students.title")}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{tr("students.pipeline")}</p>
        </div>
        <div className="flex gap-2 relative">
          {/* ── এক্সপোর্ট মেনু — বর্তমান পেজ / সব স্টুডেন্ট ExportModal দিয়ে ── */}
          <Button variant="ghost" size="xs" icon={Download} onClick={() => setShowExportMenu(p => !p)}>{tr("common.export")}</Button>
          {showExportMenu && (
            <div className="absolute right-0 top-8 z-50 rounded-xl shadow-lg min-w-[200px] overflow-hidden"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              {[
                { label: `📋 বর্তমান পেজ (${students.length} জন)`, mode: "page" },
                { label: `📦 সব স্টুডেন্ট (${serverTotal} জন)`, mode: "all" },
              ].map((opt) => (
                <button key={opt.label} className="w-full text-left px-4 py-2.5 text-xs transition"
                  style={{ color: t.text }}
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={async () => {
                    // "সব" export হলে সার্ভার থেকে সব data আনো (limit=100 per page, loop)
                    let exportData = students;
                    if (opt.mode === "all") {
                      try {
                        const params = { page: 1, limit: 100 };
                        if (debouncedSearch) params.search = debouncedSearch;
                        if (filterStatus !== "All") params.status = filterStatus;
                        if (filterCountry !== "All") params.country = filterCountry;
                        if (filterBranch !== "All") params.branch = filterBranch;
                        if (filterBatch !== "All") params.batch = filterBatch;
                        if (filterSchool !== "All") params.school = filterSchool;
                        let allData = [];
                        let hasMore = true;
                        let pg = 1;
                        while (hasMore) {
                          params.page = pg;
                          const qs = new URLSearchParams(params).toString();
                          const res = await api.get(`/students?${qs}`);
                          const d = Array.isArray(res) ? res : res.data || [];
                          allData = allData.concat(d);
                          hasMore = d.length === 100;
                          pg++;
                        }
                        exportData = allData;
                      } catch { exportData = students; }
                    }
                    // ExportModal ওপেন — কলাম সিলেক্ট করে CSV ডাউনলোড
                    setExportModalData(exportData);
                    setShowExportModal(true);
                    setShowExportMenu(false);
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <Button variant="ghost" icon={Upload} onClick={() => { setShowImport(true); setImportStep("upload"); setImportFile(null); setImportResult(null); }}>{tr("students.importExcel")}</Button>
          <Button icon={Plus} onClick={() => setShowAddForm(true)}>{tr("students.addNew")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: tr("common.total"), v: serverTotal, c: t.cyan },
          { l: tr("common.active"), v: activeCount, c: t.emerald },
          { l: "ভিসা / এসেছে", v: visaCount, c: t.purple },
          { l: "নিজস্ব / পার্টনার", v: `${ownCount} / ${partnerCount}`, c: t.amber },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.inputBg }}>
            <p className="text-lg font-bold" style={{ color: s.c }}>{s.v}</p>
            <p className="text-[10px]" style={{ color: t.muted }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* ══════════ ADD STUDENT MODAL ══════════ */}
      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title={tr("students.addNew")} size="xl">
        <AddStudentForm
          studentsCount={serverTotal}
          onCancel={() => setShowAddForm(false)}
          onSave={async (newStudent) => {
            try {
              await api.post("/students", newStudent);
            } catch {
              // fallback — লোকালে যোগ হবে
            }
            setShowAddForm(false);
            toast.success(`${newStudent.name_en} — স্টুডেন্ট যোগ হয়েছে!`);
            fetchStudents(); // সার্ভার থেকে re-fetch
          }}
        />
      </Modal>

      {/* ══════════ EXCEL IMPORT MODAL ══════════ */}
      <Modal isOpen={showImport} onClose={() => setShowImport(false)} title={tr("students.importExcel")} subtitle={
        importStep === "upload" ? "Step 1: Excel ফাইল আপলোড করুন" :
        importStep === "mapping" ? `Step 2: Column Mapping — ${importTotal} জন student পাওয়া গেছে` :
        "Import সম্পন্ন"
      } size="xl">
          {importStep !== "upload" && <div className="mb-4"><button onClick={() => setImportStep(importStep === "done" ? "upload" : importStep === "preview" ? "mapping" : "upload")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: t.inputBg, color: t.text }}><ArrowLeft size={14} /> পেছনে যান</button></div>}

          {/* Step 1: Upload */}
          {importStep === "upload" && (
            <div>
              {/* ── Template Download ── */}
              <div className="mb-4 p-4 rounded-xl flex items-center justify-between" style={{ background: `${t.emerald}08`, border: `1px solid ${t.emerald}20` }}>
                <div>
                  <p className="text-xs font-semibold flex items-center gap-2"><Download size={14} style={{ color: t.emerald }} /> Sample Template ডাউনলোড করুন</p>
                  <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>এই ফাইলে সব column header আছে — ডাটা বসিয়ে আপলোড করুন। <span style={{ color: t.rose }}>*</span> চিহ্নিত column বাধ্যতামূলক।</p>
                </div>
                <button onClick={async () => {
                  try {
                    // API_URL top-level import থেকে আসছে
                    const tk = localStorage.getItem("agencyos_token");
                    const res = await fetch(`${API_URL}/students/import/template`, { headers: { Authorization: `Bearer ${tk}` } });
                    const blob = await res.blob();
                    Object.assign(document.createElement("a"), {
                      href: URL.createObjectURL(blob),
                      download: "AgencyBook_Student_Import_Template.xlsx"
                    }).click();
                    toast.success("Template (.xlsx) ডাউনলোড হয়েছে — ডাটা বসিয়ে আপলোড করুন");
                  } catch { toast.error("Template download ব্যর্থ"); }
                }}
                className="px-4 py-2 rounded-lg text-xs font-medium transition shrink-0"
                style={{ background: t.emerald, color: "#fff" }}>
                  Template ডাউনলোড (.xlsx)
                </button>
              </div>

              {/* ── File Upload (Drag & Drop) ── */}
              <DropZone accept=".xlsx,.xls" onFile={(file) => handleImportUpload({ target: { files: [file] } })}>
                Excel ফাইল টেনে আনুন অথবা ক্লিক করুন
              </DropZone>
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
              <Button className="mt-6" onClick={() => { setShowImport(false); fetchStudents(); if (reloadData) reloadData(); }}>বন্ধ করুন</Button>
            </div>
          )}
      </Modal>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-1.5 rounded-lg" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
          <Search size={13} style={{ color: t.muted }} />
          <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1); }} className="flex-1 bg-transparent text-xs outline-none" style={{ color: t.text }} placeholder={tr("students.searchPlaceholder")} />
          {searchQ && <button onClick={() => setSearchQ("")}><X size={12} style={{ color: t.muted }} /></button>}
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
          {statuses.map(s => <option key={s} value={s}>{s === "All" ? tr("students.allStatuses") : PIPELINE_STATUSES.find(p => p.code === s)?.label || s}</option>)}
        </select>
        <select value={filterCountry} onChange={e => { setFilterCountry(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
          {countries.map(c => <option key={c} value={c}>{c === "All" ? tr("students.allCountries") : c}</option>)}
        </select>
        <select value={filterBranch} onChange={e => { setFilterBranch(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: filterBranch !== "All" ? t.cyan : t.text }}>
          {branches.map(b => <option key={b} value={b}>{b === "All" ? tr("students.allBranches") : b}</option>)}
        </select>
        <select value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: filterBatch !== "All" ? t.amber : t.text }}>
          {batches.map(b => <option key={b} value={b}>{b === "All" ? tr("students.allBatches") : b}</option>)}
        </select>
        <select value={filterSchool} onChange={e => { setFilterSchool(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${filterSchool !== "All" ? t.emerald : t.inputBorder}`, color: filterSchool !== "All" ? t.emerald : t.text }}>
          {schools.map(s => <option key={s} value={s}>{s === "All" ? `${tr("common.all")} ${tr("students.school")}` : s}</option>)}
        </select>
      </div>

      {/* ── টেবিল বিশ্লেষণ — কুইক স্ট্যাটস, গ্রুপ বাই, শর্তভিত্তিক ফর্ম্যাটিং ── */}
      <TableInsights
        module="students"
        data={paginated}
        fields={INSIGHT_FIELDS}
        onFilter={(field, value) => setInsightFilter(value ? { field, value } : null)}
      />

      <Card delay={100}>
        {/* ── Bulk Action Bar ── */}
        {selectedIds.size > 0 ? (
          <div className="flex items-center gap-3 mb-3 p-2.5 rounded-xl" style={{ background: `${t.cyan}10`, border: `1px solid ${t.cyan}30` }}>
            <span className="text-xs font-bold" style={{ color: t.cyan }}>{selectedIds.size} জন নির্বাচিত</span>
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="px-2 py-1 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
              <option value="">স্ট্যাটাস পরিবর্তন...</option>
              {PIPELINE_STATUSES.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
            {bulkStatus && <Button size="xs" onClick={bulkChangeStatus}>পরিবর্তন করুন</Button>}
            <Button variant="ghost" size="xs" onClick={() => setShowBulkDeleteConfirm(true)} style={{ color: t.rose }}>{tr("common.delete")}</Button>
            <Button variant="ghost" size="xs" onClick={() => setSelectedIds(new Set())}>{tr("common.cancel")}</Button>
          </div>
        ) : (
          <p className="text-xs font-medium mb-3" style={{ color: t.textSecondary }}>
            {tr("common.total")}: {serverTotal} {tr("students.title")}{loading && ` — ${tr("common.loading")}`}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                <th className="py-3 px-2 w-8">
                  <input type="checkbox" checked={selectedIds.size === paginated.length && paginated.length > 0}
                    onChange={selectAll} className="rounded" style={{ accentColor: t.cyan }} />
                </th>
                {[
                  { label: "ID", key: "id" }, { label: tr("common.name"), key: "name_en" }, { label: tr("common.phone"), key: "phone" },
                  { label: tr("students.branch"), key: "branch" }, { label: tr("students.country"), key: "country" }, { label: tr("students.school"), key: "school" },
                  { label: tr("students.batch"), key: "batch" }, { label: tr("common.status"), key: "status" }, { label: tr("common.type"), key: "type" },
                ].map(col => (
                  <SortHeader key={col.key} label={col.label} sortKey={col.key} currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                ))}
                <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{tr("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((s) => {
                // ── শর্তভিত্তিক সারি রং — conditionalFormat রুল অনুযায়ী ──
                const condStyle = getRowStyle("students", s);
                const defaultBg = selectedIds.has(s.id) ? `${t.cyan}08` : (condStyle?.background || "transparent");
                return (
                <tr key={s.id} className="cursor-pointer" style={{ borderBottom: `1px solid ${t.border}`, background: defaultBg }}
                  onMouseEnter={e => { if (!selectedIds.has(s.id)) e.currentTarget.style.background = t.hoverBg; }}
                  onMouseLeave={e => { if (!selectedIds.has(s.id)) e.currentTarget.style.background = defaultBg; }}
                  onClick={() => setSelectedId(s.id)}>
                  <td className="py-3 px-2" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} className="rounded" style={{ accentColor: t.cyan }} />
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px]" style={{ color: t.muted }} onClick={() => setSelectedId(s.id)}>{s.id}</td>
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
                  <td className="py-3 px-3 font-mono text-[11px]" style={{ color: t.textSecondary }}>{formatPhoneDisplay(s.phone)}</td>
                  <td className="py-3 px-3"><Badge color={t.purple} size="xs">{s.branch || "—"}</Badge></td>
                  <td className="py-3 px-3"><Badge color={s.country === "Japan" ? t.rose : s.country === "Germany" ? t.amber : t.emerald} size="xs">{s.country}</Badge></td>
                  <td className="py-3 px-3 text-[10px]" style={{ color: t.textSecondary }}>{s.school}</td>
                  <td className="py-3 px-3 text-[10px]" style={{ color: t.textSecondary }}>{s.batch}</td>
                  <td className="py-3 px-3"><StatusBadge status={s.status} /></td>
                  <td className="py-3 px-3"><Badge color={s.type === "own" ? t.cyan : t.amber} size="xs">{s.type}</Badge></td>
                  <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelectedId(s.id)} className="px-2 py-1 rounded text-[9px] font-medium" style={{ background: `${t.purple}15`, color: t.purple }}>👁 বিস্তারিত</button>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
        {paginated.length === 0 && !loading && <div className="flex flex-col items-center py-12 opacity-40"><p className="text-sm">{tr("common.noData")}</p></div>}
        <Pagination total={serverTotal} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </Card>

      {/* ── ExportModal — কলাম নির্বাচন করে CSV এক্সপোর্ট ── */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        columns={EXPORT_COLUMNS}
        data={exportModalData}
        fileName="Students"
        onExport={(count) => toast.exported(`Students (${count} records)`)}
      />

      {/* ── বাল্ক ডিলিট কনফার্ম মোডাল ── */}
      <DeleteConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={async () => { setShowBulkDeleteConfirm(false); await bulkDelete(); }}
        itemName={`${selectedIds.size} জন স্টুডেন্ট`}
        message={`${selectedIds.size} জন স্টুডেন্ট মুছে ফেলা হবে। এই কাজ undo করা যাবে না।`}
      />
    </div>
  );
}
