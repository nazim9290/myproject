import { useState, useRef, useEffect } from "react";
import { Plus, FileText, CheckCircle, AlertTriangle, ArrowLeft, Download, Check, Upload, X, Save, Search, Settings, Trash2, Eye } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
// Templates loaded from backend API only

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "https://newbook-e2v3.onrender.com/api";
const token = () => localStorage.getItem("agencyos_token");

// All system fields grouped for mapping UI
// key-তে :year, :month, :day, :first, :last suffix দিলে sub-part বসবে
const SYSTEM_FIELDS = [
  { group: "ব্যক্তিগত", fields: [
    { key: "name_en", label: "নাম (Full English)" },
    { key: "name_en:first", label: "নাম → First Name" },
    { key: "name_en:last", label: "নাম → Last Name" },
    { key: "name_bn", label: "নাম (বাংলা)" },
    { key: "name_katakana", label: "নাম (カタカナ)" },
    { key: "name_katakana:first", label: "カタカナ → First" },
    { key: "name_katakana:last", label: "カタカナ → Last" },
    { key: "dob", label: "জন্ম তারিখ (Full)" },
    { key: "dob:year", label: "জন্ম → শুধু Year" },
    { key: "dob:month", label: "জন্ম → শুধু Month" },
    { key: "dob:day", label: "জন্ম → শুধু Day" },
    { key: "age", label: "বয়স" }, { key: "gender", label: "লিঙ্গ" },
    { key: "marital_status", label: "বৈবাহিক অবস্থা" }, { key: "nationality", label: "জাতীয়তা" },
    { key: "blood_group", label: "রক্তের গ্রুপ" }, { key: "phone", label: "ফোন" },
    { key: "whatsapp", label: "WhatsApp" }, { key: "email", label: "ইমেইল" },
  ]},
  { group: "পাসপোর্ট / NID", fields: [
    { key: "nid", label: "NID নম্বর" }, { key: "passport_number", label: "পাসপোর্ট নম্বর" },
    { key: "passport_issue", label: "পাসপোর্ট ইস্যু (Full)" },
    { key: "passport_issue:year", label: "পাসপোর্ট ইস্যু → Year" },
    { key: "passport_issue:month", label: "পাসপোর্ট ইস্যু → Month" },
    { key: "passport_issue:day", label: "পাসপোর্ট ইস্যু → Day" },
    { key: "passport_expiry", label: "পাসপোর্ট মেয়াদ (Full)" },
    { key: "passport_expiry:year", label: "পাসপোর্ট মেয়াদ → Year" },
    { key: "passport_expiry:month", label: "পাসপোর্ট মেয়াদ → Month" },
    { key: "passport_expiry:day", label: "পাসপোর্ট মেয়াদ → Day" },
  ]},
  { group: "ঠিকানা", fields: [
    { key: "permanent_address", label: "স্থায়ী ঠিকানা" }, { key: "current_address", label: "বর্তমান ঠিকানা" },
  ]},
  { group: "পরিবার", fields: [
    { key: "father_name", label: "পিতার নাম (বাংলা)" }, { key: "father_name_en", label: "পিতার নাম (EN)" },
    { key: "mother_name", label: "মাতার নাম (বাংলা)" }, { key: "mother_name_en", label: "মাতার নাম (EN)" },
    { key: "father_dob", label: "পিতার জন্ম তারিখ (Full)" },
    { key: "father_dob:year", label: "পিতার জন্ম → Year" },
    { key: "father_dob:month", label: "পিতার জন্ম → Month" },
    { key: "father_dob:day", label: "পিতার জন্ম → Day" },
    { key: "father_occupation", label: "পিতার পেশা" },
    { key: "mother_dob", label: "মাতার জন্ম তারিখ (Full)" },
    { key: "mother_dob:year", label: "মাতার জন্ম → Year" },
    { key: "mother_dob:month", label: "মাতার জন্ম → Month" },
    { key: "mother_dob:day", label: "মাতার জন্ম → Day" },
    { key: "mother_occupation", label: "মাতার পেশা" },
  ]},
  { group: "শিক্ষা", fields: [
    { key: "edu_ssc_school", label: "SSC স্কুল" }, { key: "edu_ssc_year", label: "SSC সন" },
    { key: "edu_ssc_board", label: "SSC বোর্ড" }, { key: "edu_ssc_gpa", label: "SSC GPA" },
    { key: "edu_ssc_subject", label: "SSC বিভাগ" },
    { key: "edu_hsc_school", label: "HSC কলেজ" }, { key: "edu_hsc_year", label: "HSC সন" },
    { key: "edu_hsc_board", label: "HSC বোর্ড" }, { key: "edu_hsc_gpa", label: "HSC GPA" },
    { key: "edu_hsc_subject", label: "HSC বিভাগ" },
    { key: "edu_honours_school", label: "Honours বিশ্ববিদ্যালয়" }, { key: "edu_honours_year", label: "Honours সন" },
    { key: "edu_honours_gpa", label: "Honours GPA" }, { key: "edu_honours_subject", label: "Honours বিষয়" },
  ]},
  { group: "জাপানি ভাষা", fields: [
    { key: "jp_exam_type", label: "পরীক্ষার ধরন" }, { key: "jp_level", label: "লেভেল" },
    { key: "jp_score", label: "স্কোর" }, { key: "jp_result", label: "ফলাফল" }, { key: "jp_exam_date", label: "পরীক্ষার তারিখ" },
  ]},
  { group: "স্পন্সর", fields: [
    { key: "sponsor_name", label: "স্পন্সরের নাম" }, { key: "sponsor_name_en", label: "স্পন্সর নাম (EN)" },
    { key: "sponsor_relationship", label: "সম্পর্ক" }, { key: "sponsor_phone", label: "স্পন্সর ফোন" },
    { key: "sponsor_address", label: "স্পন্সর ঠিকানা" }, { key: "sponsor_company", label: "কোম্পানি" },
    { key: "sponsor_income_y1", label: "আয় (১ম বছর)" }, { key: "sponsor_income_y2", label: "আয় (২য় বছর)" },
    { key: "sponsor_income_y3", label: "আয় (৩য় বছর)" },
    { key: "sponsor_tax_y1", label: "ট্যাক্স (১ম বছর)" }, { key: "sponsor_tax_y2", label: "ট্যাক্স (২য় বছর)" },
    { key: "sponsor_tax_y3", label: "ট্যাক্স (৩য় বছর)" },
  ]},
  { group: "গন্তব্য", fields: [
    { key: "country", label: "দেশ" }, { key: "intake", label: "Intake" },
    { key: "visa_type", label: "ভিসার ধরন" }, { key: "student_type", label: "স্টুডেন্ট টাইপ" },
  ]},
];

const ALL_FIELDS = SYSTEM_FIELDS.flatMap(g => g.fields);

export default function ExcelAutoFillPage({ students }) {
  const t = useTheme();
  const toast = useToast();
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
          headers: { Authorization: `Bearer ${tk}` },
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
    fetch(`${API}/schools`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setSchoolsList(data); }).catch(() => {});
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
    if (!file.name.match(/\.xlsx?$/i)) { toast.error("শুধু .xlsx ফাইল আপলোড করুন"); return; }
    if (file.name.endsWith(".xls") && !file.name.endsWith(".xlsx")) {
      toast.error("⚠️ .xls ফরম্যাট সাপোর্ট করে না — Excel-এ খুলে Save As → .xlsx করুন");
      return;
    }
    setUploadFile(file);
  };

  const doUpload = async () => {
    if (!uploadSchool) { toast.error("স্কুল সিলেক্ট করুন — স্কুল ছাড়া রিজুইমি হবে না"); return; }

    // Try API upload first
    if (uploadFile && token()) {
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", uploadFile);
        form.append("school_name", uploadSchool);
        const res = await fetch(`${API}/excel/upload-template`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}` },
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
        toast.success(`"${uploadSchool}" — ${phs.length} টি {{placeholder}} পাওয়া গেছে`);
      } catch (err) {
        toast.error(err.message || "আপলোড ব্যর্থ");
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
    toast.success("ম্যানুয়াল mapping শুরু করুন");
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
    if (!manualCell.cell || !manualCell.label) { toast.error("Cell ও Label দিন"); return; }
    setMappings([...mappings, { ...manualCell }]);
    setManualCell({ cell: "", label: "", field: "" });
  };

  const removeMapping = (idx) => setMappings(mappings.filter((_, i) => i !== idx));

  const saveMapping = async () => {
    const mapped = mappings.filter(m => m.field);
    if (mapped.length === 0) { toast.error("কমপক্ষে ১টি field map করুন"); return; }

    // Try API save
    if (activeTemplate?.id && token() && !activeTemplate.id.startsWith("tmpl-")) {
      try {
        const res = await fetch(`${API}/excel/templates/${activeTemplate.id}/mapping`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
          body: JSON.stringify({ mappings }),
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

    toast.success(`${mapped.length} fields mapping সংরক্ষণ হয়েছে`);
    setView("list");
  };

  // ================================================================
  // STEP 3: GENERATE
  // ================================================================
  const doGenerate = async () => {
    if (selectedStudents.length === 0) { toast.error("কমপক্ষে ১ জন স্টুডেন্ট সিলেক্ট করুন"); return; }

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
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
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
        toast.exported(`${name} — ${downloaded} জনের Resume ডাউনলোড হয়েছে`);
        setGenerating(false);
        return;
      } catch (err) {
        toast.error("API: " + err.message + " — CSV fallback ব্যবহার হচ্ছে");
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
          headers: { Authorization: `Bearer ${token()}` },
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      }
      setTemplates(prev => prev.filter(t => t.id !== tmpl.id));
      toast.success(`"${tmpl.school_name || tmpl.schoolName}" — Template ও ফাইল ডাটাবেস থেকে মুছে ফেলা হয়েছে`);
    } catch (err) {
      toast.error("Delete ব্যর্থ: " + err.message);
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
            <h2 className="text-xl font-bold">Excel Template আপলোড</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>স্কুলের Excel ফরম আপলোড করুন → অটো cell detect → field mapping</p>
          </div>
        </div>

        <Card delay={50}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>স্কুল সিলেক্ট করুন <span className="req-star">*</span></label>
              <select value={uploadSchool} onChange={e => setUploadSchool(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ ...is, borderColor: !uploadSchool ? t.rose + "40" : t.inputBorder }}>
                <option value="">— স্কুল সিলেক্ট করুন —</option>
                {schoolsList.map(s => <option key={s.id} value={s.name_en}>{s.name_en}{s.name_jp ? ` (${s.name_jp})` : ""}</option>)}
              </select>
              {!uploadSchool && <p className="text-[10px] mt-1" style={{ color: t.rose }}>স্কুল ছাড়া রিজুইমি তৈরি হবে না</p>}
            </div>

            {/* File Upload Area */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Excel ফাইল (.xlsx)</label>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
              <div
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 rounded-xl cursor-pointer transition-all border-2 border-dashed"
                style={{ borderColor: uploadFile ? t.cyan : t.inputBorder, background: uploadFile ? `${t.cyan}05` : t.inputBg }}
              >
                {uploadFile ? (
                  <>
                    <FileText size={32} style={{ color: t.cyan }} />
                    <p className="text-sm font-medium mt-2">{uploadFile.name}</p>
                    <p className="text-[10px] mt-1" style={{ color: t.muted }}>
                      {(uploadFile.size / 1024).toFixed(1)} KB — ক্লিক করে পরিবর্তন করুন
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={32} style={{ color: t.muted }} />
                    <p className="text-xs mt-2 font-medium">Excel ফাইল ড্র্যাগ করুন বা ক্লিক করুন</p>
                    <p className="text-[10px] mt-1" style={{ color: t.muted }}>.xlsx ফরম্যাট (⚠️ .xls নয়) • সর্বোচ্চ 10MB</p>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl" style={{ background: `${t.cyan}08`, border: `1px solid ${t.cyan}15` }}>
              <p className="text-[11px]" style={{ color: t.textSecondary }}>
                <strong>কিভাবে কাজ করে:</strong> Excel template-এ যেখানে student data বসাতে চান সেখানে <code style={{ color: t.cyan }}>{"{{name_en}}"}</code>, <code style={{ color: t.cyan }}>{"{{dob}}"}</code>, <code style={{ color: t.cyan }}>{"{{passport_number}}"}</code> ইত্যাদি লিখুন।
                আপলোড করলে সিস্টেম শুধু <code style={{ color: t.cyan }}>{"{{}}"}</code> cells detect করবে।
              </p>
              <p className="text-[10px] mt-2" style={{ color: t.muted }}>
                উদাহরণ: <code>{"{{name_en}}"}</code> → Mohammad Rahim, <code>{"{{dob}}"}</code> → 1998-03-12, <code>{"{{father_name}}"}</code> → আব্দুল করিম
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
              <Button variant="ghost" onClick={() => { setView("list"); setUploadFile(null); setUploadSchool(""); }}>বাতিল</Button>
              <Button icon={Upload} onClick={doUpload} disabled={uploading}>
                {uploading ? "আপলোড হচ্ছে..." : "আপলোড ও Cell Detect"}
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
            <h2 className="text-xl font-bold">Field Mapping — {activeTemplate.school_name || activeTemplate.schoolName}</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>
              প্রতিটি Excel cell-এর জন্য সিস্টেম field সিলেক্ট করুন • Mapped: {mappedCount}/{mappings.length}
            </p>
          </div>
          <Button icon={Save} onClick={saveMapping}>সংরক্ষণ ({mappedCount})</Button>
        </div>

        {/* Mapping Table */}
        <Card delay={50}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["Sheet", "Cell", "Placeholder ({{...}})", "System Field (কোন ডেটা বসবে)", ""].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mappings.map((m, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td className="py-2 px-2 text-[10px]" style={{ color: t.purple, width: 90 }}>
                      {m.sheet ? <span className="px-1.5 py-0.5 rounded" style={{ background: `${t.purple}10` }}>{m.sheet.length > 12 ? m.sheet.substring(0, 12) + "..." : m.sheet}</span> : <span style={{ color: t.muted }}>—</span>}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold" style={{ color: t.cyan, width: 60 }}>{m.cell}</td>
                    <td className="py-2 px-3" style={{ maxWidth: 200 }}>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${t.cyan}10`, color: t.cyan }}>
                        {m.placeholder || `{{${m.key || m.label}}}`}
                      </span>
                    </td>
                    <td className="py-2 px-3" style={{ minWidth: 220 }}>
                      <select value={m.field || ""} onChange={e => updateMapping(i, e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                        style={{ ...is, borderColor: m.field ? `${t.emerald}60` : t.inputBorder }}>
                        <option value="">— field সিলেক্ট করুন —</option>
                        {SYSTEM_FIELDS.map(g => (
                          <optgroup key={g.group} label={`── ${g.group} ──`}>
                            {g.fields.map(f => <option key={f.key} value={f.key}>{f.label} ({f.key})</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3 text-center" style={{ width: 60 }}>
                      <div className="flex items-center gap-1">
                        {m.field && <Check size={14} style={{ color: t.emerald }} />}
                        <button onClick={() => removeMapping(i)} className="p-1 rounded opacity-50 hover:opacity-100 transition"
                          style={{ color: t.rose }}><X size={12} /></button>
                      </div>
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
                className="w-full px-2 py-1.5 rounded text-xs outline-none" style={is} placeholder="Excel-এ যা লেখা (e.g. 氏名, নাম)" />
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
            <h2 className="text-xl font-bold">Resume Generate — {activeTemplate.school_name || activeTemplate.schoolName}</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>
              {(activeTemplate.mappings || []).filter(m => m.field).length} fields mapped • স্টুডেন্ট সিলেক্ট করুন → ডাউনলোড
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
                placeholder="স্টুডেন্ট খুঁজুন..." />
            </div>
            <select value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setSelectedStudents([]); }}
              className="px-3 py-2 rounded-xl text-xs outline-none"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
              <option value="all">সব ব্যাচ</option>
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
              <p className="text-center py-6 text-xs" style={{ color: t.muted }}>কোনো স্টুডেন্ট পাওয়া যায়নি</p>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <p className="text-xs" style={{ color: t.muted }}>
              সিলেক্টেড: <span className="font-bold" style={{ color: t.cyan }}>{selectedStudents.length}</span> জন
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
          <h2 className="text-xl font-bold">Resume Builder (রিজুইমি তৈরি)</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>স্কুলের Excel ফরম্যাটে স্টুডেন্ট ডেটা অটো বসান</p>
        </div>
        <Button icon={Upload} onClick={() => { setView("upload"); setUploadSchool(""); setUploadFile(null); }}>
          Template আপলোড
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "মোট Template", value: templates.length, color: t.cyan, icon: FileText },
          { label: "Fully Mapped", value: templates.filter(e => (e.mappedFields || e.mapped_fields || 0) >= (e.totalFields || e.total_fields || 1)).length, color: t.emerald, icon: CheckCircle },
          { label: "Needs Mapping", value: templates.filter(e => (e.mappedFields || e.mapped_fields || 0) < (e.totalFields || e.total_fields || 1)).length, color: t.amber, icon: AlertTriangle },
          { label: "মোট স্টুডেন্ট", value: eligibleStudents.length, color: t.purple, icon: FileText },
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
          <h3 className="text-sm font-bold mb-3">কিভাবে কাজ করে?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "১", title: "Template আপলোড", desc: "স্কুলের Excel ফরম (.xlsx) আপলোড করুন। সিস্টেম অটো সব cell ও label detect করবে।", color: t.cyan },
              { step: "২", title: "Field Mapping", desc: "প্রতিটি Excel cell-এর জন্য সিস্টেম field সিলেক্ট করুন। e.g. 氏名 → name_en, 生年月日 → dob", color: t.amber },
              { step: "৩", title: "Generate", desc: "স্টুডেন্ট সিলেক্ট করুন → ডাউনলোড। সিস্টেম অটো ডেটা বসিয়ে Excel ফাইল তৈরি করবে।", color: t.emerald },
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
          const date = tmpl.uploadDate || (tmpl.created_at || "").slice(0, 10);

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
                      toast.error("আগে mapping করুন");
                      return;
                    }
                    setActiveTemplate(tmpl);
                    setSelectedStudents([]);
                    setStudentSearch("");
                    setView("generate");
                  }}>Generate</Button>
                  {deleteConfirmId === tmpl.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteTemplate(tmpl)} className="text-[10px] px-2 py-1 rounded-lg font-medium" style={{ background: t.rose, color: "#fff" }}>মুছুন</button>
                      <button onClick={() => setDeleteConfirmId(null)} className="text-[10px] px-2 py-1 rounded-lg" style={{ color: t.muted }}>না</button>
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
