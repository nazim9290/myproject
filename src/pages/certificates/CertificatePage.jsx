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

const API_URL = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "https://newbook-e2v3.onrender.com/api";
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

  // Generate
  const [selectedStudent, setSelectedStudent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [filterBatch, setFilterBatch] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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

  // ── Upload ──
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
      setTemplates(prev => [data.template, ...prev]);
      toast.success(`"${uploadName}" — ${data.placeholders.length} টি placeholder পাওয়া গেছে`);
      setView("list"); setUploadName(""); setUploadFile(null);
    } catch (err) { toast.error(err.message); }
    setUploading(false);
  };

  // ── Generate ──
  const doGenerate = async (format = "docx") => {
    if (!selectedStudent) { toast.error("একজন স্টুডেন্ট সিলেক্ট করুন"); return; }
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/docgen/generate`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ template_id: activeTemplate.id, student_id: selectedStudent, format }),
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

  // ══════════ GENERATE VIEW ══════════
  if (view === "generate" && activeTemplate) return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center gap-4">
        <button onClick={() => { setView("list"); setSelectedStudent(""); }} className="p-2 rounded-xl" style={{ background: t.inputBg }}><ArrowLeft size={18} /></button>
        <div>
          <h2 className="text-xl font-bold">Generate — {activeTemplate.name}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{activeTemplate.total_fields} placeholders • স্টুডেন্ট সিলেক্ট করুন</p>
        </div>
      </div>
      <Card delay={50}>
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.muted }}>Placeholders</p>
          <div className="flex flex-wrap gap-1.5">
            {(activeTemplate.placeholders || []).map((p, i) => (
              <span key={i} className="px-2 py-1 rounded text-[10px] font-mono" style={{ background: `${t.cyan}10`, color: t.cyan }}>{p.placeholder || `{{${p.key}}}`}</span>
            ))}
          </div>
        </div>
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
          {filteredStudents.length === 0 && <p className="text-xs text-center py-6" style={{ color: t.muted }}>কোনো স্টুডেন্ট পাওয়া যায়নি</p>}
        </div>
        <div className="flex justify-between items-center mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
          <p className="text-xs" style={{ color: t.muted }}>{selectedStudent ? eligibleStudents.find(s => s.id === selectedStudent)?.name_en : "স্টুডেন্ট সিলেক্ট করুন"}</p>
          <div className="flex gap-2">
            <Button variant="ghost" icon={Download} onClick={() => doGenerate("docx")} disabled={!selectedStudent || generating}>.docx</Button>
            <Button icon={Download} onClick={() => doGenerate("pdf")} disabled={!selectedStudent || generating}>.pdf</Button>
          </div>
        </div>
      </Card>
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
