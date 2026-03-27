import { useState, useEffect } from "react";
import { AlertCircle, Save, Plus, Download, Settings, Search, X, ArrowLeft, Phone, Edit3, Trash2, Check, ChevronDown, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { INITIAL_BRANCHES, AGENTS_DATA } from "../../data/mockData";
import Pagination from "../../components/ui/Pagination";
import useSortable from "../../hooks/useSortable";
import SortHeader from "../../components/ui/SortHeader";
import { api } from "../../hooks/useAPI";

function NewVisitorForm({ onSave, onCancel }) {
  const t = useTheme();
  const toast = useToast();
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
  const [form, setForm] = useState({
    name: "", name_en: "", phone: "", guardian_phone: "", email: "", address: "", dob: "", gender: "Male", branch: "",
    education: [
      { level: "SSC/Dakhil", year: "", board: "", gpa: "", subject: "" },
      { level: "HSC/Alim/Diploma", year: "", board: "", gpa: "", subject: "" },
      { level: "Honours/Degree", year: "", board: "", gpa: "", subject: "" },
      { level: "Masters/B.Sc", year: "", board: "", gpa: "", subject: "" },
    ],
    has_jp_cert: false, jp_exam_type: "JLPT", jp_exam_type_other: "", jp_level: "N5", jp_score: "",
    visa_type: "Language Student", visa_type_other: "",
    interested_countries: ["Japan"], interested_intake: "April 2026", budget_concern: false,
    source: "Walk-in", agent_name: "", counselor: "Mina", notes: "", next_follow_up: "",
  });
  const [errors, setErrors] = useState({});
  const [sections, setSections] = useState({ personal: true, education: false, jpExam: false, visa: false, country: false, source: true });
  const toggleSection = (s) => setSections({ ...sections, [s]: !sections[s] });
  const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); if (errors[k]) setErrors(prev => ({ ...prev, [k]: null })); };
  const setEdu = (i, f, v) => { setForm(prev => { const e = [...prev.education]; e[i] = { ...e[i], [f]: v }; return { ...prev, education: e }; }); };
  const addEdu = () => setForm(prev => ({ ...prev, education: [...prev.education, { level: "", year: "", board: "", gpa: "", subject: "" }] }));
  const removeEdu = (i) => { setForm(prev => { if (prev.education.length <= 1) return prev; const e = [...prev.education]; e.splice(i, 1); return { ...prev, education: e }; }); };
  const toggleCountry = (c) => { const curr = form.interested_countries; if (curr.includes(c)) { if (curr.length === 1) return; set("interested_countries", curr.filter(x => x !== c)); } else { set("interested_countries", [...curr, c]); } };
  const validate = () => { const e = {}; if (!form.name.trim()) e.name = "নাম আবশ্যক"; if (!form.phone.trim()) e.phone = "ফোন আবশ্যক"; if (form.phone && !/^01\d{9}$/.test(form.phone.replace(/[- ]/g, ""))) e.phone = "সঠিক ফোন নম্বর দিন"; setErrors(e); return Object.keys(e).length === 0; };
  const save = () => { if (!validate()) { toast.error("ফর্মে ত্রুটি আছে — লাল চিহ্নিত field দেখুন"); return; } onSave({ ...form, id: `V-${Date.now()}`, status: "Interested", date: new Date().toISOString().slice(0, 10), lastFollowUp: null }); };

  const SectionHeader = ({ icon, title, sKey }) => (
    <button type="button" onClick={() => toggleSection(sKey)} className="w-full flex items-center gap-2 pt-3 pb-1 cursor-pointer">
      <span className="text-sm">{icon}</span>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.cyan }}>{title}</p>
      <div className="flex-1 h-px" style={{ background: `${t.cyan}20` }} />
      {sections[sKey] ? <ChevronDown size={14} style={{ color: t.cyan }} /> : <ChevronRight size={14} style={{ color: t.muted }} />}
    </button>
  );
  const FieldError = ({ error }) => error ? <p className="flex items-center gap-1 mt-1 text-[10px]" style={{ color: t.rose }}><AlertCircle size={10} /> {error}</p> : null;

  return (
    <div className="space-y-2">
      <SectionHeader icon="👤" title="ব্যক্তিগত তথ্য" sKey="personal" />
      {sections.personal && <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নাম (বাংলা) <span className="req-star">*</span></label>
        <input value={form.name} onChange={e => set("name", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ ...is, borderColor: errors.name ? t.rose : t.inputBorder }} placeholder="পুরো নাম" /><FieldError error={errors.name} /></div>
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নাম (ইংরেজি)</label>
        <input value={form.name_en} onChange={e => set("name_en", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Full Name" /></div>
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>জন্ম তারিখ</label>
        <input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ফোন <span className="req-star">*</span></label>
        <input value={form.phone} onChange={e => set("phone", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ ...is, borderColor: errors.phone ? t.rose : t.inputBorder }} placeholder="01XXXXXXXXX" /><FieldError error={errors.phone} /></div>
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>অভিভাবকের ফোন</label>
        <input value={form.guardian_phone} onChange={e => set("guardian_phone", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="01XXXXXXXXX" /></div>
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ইমেইল</label>
        <input value={form.email} onChange={e => set("email", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="email@example.com" /></div>
        <div className="md:col-span-2"><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ঠিকানা</label>
        <input value={form.address} onChange={e => set("address", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="বাড়ি, এলাকা, জেলা" /></div>
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>লিঙ্গ</label>
        <select value={form.gender} onChange={e => set("gender", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}><option value="Male">পুরুষ</option><option value="Female">মহিলা</option><option value="Other">অন্যান্য</option></select></div>
      </div>}

      <SectionHeader icon="🎓" title="শিক্ষাগত তথ্য" sKey="education" />
      {sections.education && <><div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
        <table className="w-full text-xs"><thead><tr style={{ background: t.inputBg }}>
          {["শিক্ষা", "সাল", "বোর্ড", "জিপিএ", "বিষয়", ""].map(h => <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>)}
        </tr></thead><tbody>
          {form.education.map((edu, idx) => (<tr key={idx} style={{ borderTop: `1px solid ${t.border}` }}>
            <td className="py-1.5 px-2"><input value={edu.level} onChange={e => setEdu(idx, "level", e.target.value)} className="w-full px-2 py-1.5 rounded text-xs outline-none" style={is} placeholder="SSC / HSC / Honours" /></td>
            <td className="py-1.5 px-2"><input value={edu.year} onChange={e => setEdu(idx, "year", e.target.value)} className="w-full px-2 py-1.5 rounded text-xs outline-none" style={is} placeholder="2022" /></td>
            <td className="py-1.5 px-2"><input value={edu.board} onChange={e => setEdu(idx, "board", e.target.value)} className="w-full px-2 py-1.5 rounded text-xs outline-none" style={is} placeholder="Dhaka" /></td>
            <td className="py-1.5 px-2"><input value={edu.gpa} onChange={e => setEdu(idx, "gpa", e.target.value)} className="w-full px-2 py-1.5 rounded text-xs outline-none" style={is} placeholder="5.00" /></td>
            <td className="py-1.5 px-2"><input value={edu.subject} onChange={e => setEdu(idx, "subject", e.target.value)} className="w-full px-2 py-1.5 rounded text-xs outline-none" style={is} placeholder="Science" /></td>
            <td className="py-1.5 px-2 text-center">{form.education.length > 1 && <button onClick={() => removeEdu(idx)} className="p-1 rounded transition" style={{ color: t.rose }} onMouseEnter={e => e.currentTarget.style.background = `${t.rose}15`} onMouseLeave={e => e.currentTarget.style.background = "transparent"}><X size={12} /></button>}</td>
          </tr>))}
        </tbody></table>
      </div>
      <button onClick={addEdu} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition" style={{ color: t.cyan, background: `${t.cyan}10` }} onMouseEnter={e => e.currentTarget.style.background = `${t.cyan}20`} onMouseLeave={e => e.currentTarget.style.background = `${t.cyan}10`}><Plus size={12} /> শিক্ষাগত তথ্য যোগ করুন</button></>}

      <SectionHeader icon="🇯🇵" title="জাপানি ভাষা পরীক্ষা" sKey="jpExam" />
      {sections.jpExam && <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.inputBg }}>
          <label className="text-xs" style={{ color: t.textSecondary }}>সার্টিফিকেট আছে?</label>
          <button onClick={() => set("has_jp_cert", !form.has_jp_cert)} className="relative w-10 h-5 rounded-full transition-all" style={{ background: form.has_jp_cert ? t.emerald : `${t.muted}40` }}>
            <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all" style={{ left: form.has_jp_cert ? "22px" : "2px" }} /></button>
        </div>
        {form.has_jp_cert && <>
          <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পরীক্ষার ধরন</label>
          <select value={form.jp_exam_type} onChange={e => { set("jp_exam_type", e.target.value); if (e.target.value !== "Other") setForm(prev => ({...prev, jp_exam_type: e.target.value, jp_exam_type_other: ""})); }} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
            <option value="JLPT">JLPT (日本語能力試験)</option>
            <option value="JFT">JFT-Basic (国際交流基金)</option>
            <option value="NAT">NAT-TEST</option>
            <option value="JPT">JPT (日本語能力テスト)</option>
            <option value="JLCT">JLCT (日本語コミュニケーション)</option>
            <option value="TopJ">Top J (実用日本語)</option>
            <option value="Other">Other</option>
          </select></div>
          {form.jp_exam_type === "Other" && <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.rose }}>কোন পরীক্ষা? <span className="req-star">*</span></label>
          <input value={form.jp_exam_type_other} onChange={e => set("jp_exam_type_other", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{...is, borderColor: `${t.rose}40`}} placeholder="পরীক্ষার নাম লিখুন" /></div>}
          <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>লেভেল</label>
          <select value={form.jp_level} onChange={e => set("jp_level", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}><option>N5</option><option>N4</option><option>N3</option><option>N2</option><option>N1</option></select></div>
          <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>স্কোর</label>
          <input value={form.jp_score} onChange={e => set("jp_score", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="100" type="number" /></div>
        </>}
      </div>}

      <SectionHeader icon="🛂" title="ভিসার ধরন / উদ্দেশ্য" sKey="visa" />
      {sections.visa && <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>কোন ভিসায় যেতে চান? <span className="req-star">*</span></label>
        <select value={form.visa_type} onChange={e => { set("visa_type", e.target.value); if (e.target.value !== "Other") setForm(prev => ({...prev, visa_type: e.target.value, visa_type_other: ""})); }} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
          <option value="Language Student">Language Student (ভাষা শিক্ষার্থী)</option>
          <option value="SSW">SSW — Specified Skilled Worker (特定技能)</option>
          <option value="TITP">TITP — Technical Intern (技能実習)</option>
          <option value="Engineer/Specialist">Engineer / Specialist in Humanities (技術・人文知識・国際業務)</option>
          <option value="Graduation">Graduation / University (留学 — 大学)</option>
          <option value="Masters">Master's / Research (留学 — 大学院)</option>
          <option value="Visitor">Visitor Visa (短期滞在)</option>
          <option value="Dependent">Dependent Visa (家族滞在)</option>
          <option value="Other">Other (অন্যান্য)</option>
        </select></div>
        {form.visa_type === "Other" && <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.rose }}>কোন ভিসা? <span className="req-star">*</span></label>
        <input value={form.visa_type_other} onChange={e => set("visa_type_other", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{...is, borderColor: `${t.rose}40`}} placeholder="ভিসার ধরন লিখুন" /></div>}
        {form.visa_type && form.visa_type !== "Other" && <div className="flex items-center p-3 rounded-xl" style={{ background: `${t.cyan}08`, border: `1px solid ${t.cyan}15` }}>
          <p className="text-[11px]" style={{ color: t.textSecondary }}>
            {form.visa_type === "Language Student" && "📚 ভাষা স্কুলে ভর্তি → N5/N4 প্রয়োজন → 1-2 বছর কোর্স"}
            {form.visa_type === "SSW" && "🔧 নির্দিষ্ট দক্ষতা ভিসা → N4 + Skill Test প্রয়োজন"}
            {form.visa_type === "TITP" && "🏭 কারিগরি প্রশিক্ষণ → N5 + সংস্থার মাধ্যমে"}
            {form.visa_type === "Engineer/Specialist" && "💼 চাকরি ভিসা → Bachelor/Master + Job Offer"}
            {form.visa_type === "Graduation" && "🎓 বিশ্ববিদ্যালয় → N2/EJU + ভর্তি পরীক্ষা"}
            {form.visa_type === "Masters" && "🔬 গবেষণা → N2/English + Professor Contact"}
            {form.visa_type === "Visitor" && "✈️ স্বল্পমেয়াদী ভিজিট → ৯০ দিন → Invitation Letter"}
            {form.visa_type === "Dependent" && "👨‍👩‍👧 পরিবার ভিসা → স্পন্সর জাপানে থাকতে হবে"}
          </p>
        </div>}
      </div>}

      <SectionHeader icon="🌍" title="আগ্রহের দেশ ও ইনটেক" sKey="country" />
      {sections.country && <><div><label className="text-[10px] uppercase tracking-wider block mb-2" style={{ color: t.muted }}>আগ্রহের দেশ (একাধিক নির্বাচন করুন)</label>
      <div className="flex flex-wrap gap-2">
        {["Japan", "Canada", "UK", "USA", "Australia", "China", "Germany", "Korea", "Other"].map(c => {
          const sel = form.interested_countries.includes(c);
          return <button key={c} onClick={() => toggleCountry(c)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: sel ? `${t.cyan}20` : t.inputBg, color: sel ? t.cyan : t.muted, border: `1px solid ${sel ? `${t.cyan}40` : t.inputBorder}` }}>{sel ? "✓ " : ""}{c}</button>;
        })}
      </div></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ইনটেক</label>
        <select value={form.interested_intake} onChange={e => set("interested_intake", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}><option>April 2026</option><option>October 2026</option><option>April 2027</option><option>নিশ্চিত নয়</option></select></div>
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.inputBg }}>
          <label className="text-xs" style={{ color: t.textSecondary }}>বাজেট চিন্তিত?</label>
          <button onClick={() => set("budget_concern", !form.budget_concern)} className="relative w-10 h-5 rounded-full transition-all" style={{ background: form.budget_concern ? t.amber : `${t.muted}40` }}>
            <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all" style={{ left: form.budget_concern ? "22px" : "2px" }} /></button>
        </div>
      </div></>}

      <SectionHeader icon="📋" title="সোর্স ও কাউন্সেলিং" sKey="source" />
      {sections.source && <><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Branch / শাখা <span className="req-star">*</span></label>
        <select value={form.branch} onChange={e => set("branch", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ ...is, borderColor: !form.branch ? `${t.amber}60` : t.inputBorder }}>
          <option value="">— Branch নির্বাচন করুন —</option>
          {INITIAL_BRANCHES.filter(b => b.status === "active").map(b => <option key={b.id} value={b.name}>{b.name} ({b.city})</option>)}
        </select></div>
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>সোর্স</label>
        <select value={form.source} onChange={e => set("source", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}><option>Walk-in</option><option>Facebook</option><option>Agent</option><option>Referral</option><option>Website</option><option>YouTube</option></select></div>
        {form.source === "Agent" && <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>এজেন্ট নির্বাচন করুন <span className="req-star">*</span></label>
        <select value={form.agent_name} onChange={e => set("agent_name", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ ...is, borderColor: !form.agent_name ? `${t.amber}60` : t.inputBorder }}>
          <option value="">— এজেন্ট সিলেক্ট করুন —</option>
          {AGENTS_DATA.filter(a => a.status === "active").map(a => <option key={a.id} value={a.name}>{a.name} ({a.area})</option>)}
        </select></div>}
        {form.source === "Referral" && <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>রেফারার নাম / ফোন</label>
        <input value={form.referral_info || ""} onChange={e => set("referral_info", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="যিনি রেফার করেছেন তার নাম বা ফোন" /></div>}
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>কাউন্সেলর</label>
        <select value={form.counselor} onChange={e => set("counselor", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}><option>Mina</option><option>Sadia</option><option>Karim</option></select></div>
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পরবর্তী ফলোআপ</label>
        <input type="date" value={form.next_follow_up} onChange={e => set("next_follow_up", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
      </div>
      <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>কাউন্সেলিং নোট</label>
      <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={is} placeholder="আলোচনার বিবরণ..." /></div></>}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
        <p className="text-[10px]" style={{ color: t.muted }}>* চিহ্নিত field আবশ্যক</p>
        <div className="flex gap-2"><Button variant="ghost" onClick={onCancel}>বাতিল</Button><Button icon={Save} onClick={save}>ভিজিটর সংরক্ষণ</Button></div>
      </div>
    </div>
  );
}

export default function VisitorsPage({ visitors, setVisitors, onConvertToStudent, reloadData }) {
  const t = useTheme();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);

  // ── Backend থেকে visitors load (prop empty হলে) ──
  useEffect(() => {
    if (visitors.length > 0) return; // ইতিমধ্যে data আছে
    api.get("/visitors").then(res => {
      const data = Array.isArray(res) ? res : res.data || [];
      if (data.length > 0) setVisitors(data.map(v => ({
        ...v, name_en: v.name_en || v.name, date: v.visit_date || v.date, lastFollowUp: v.last_follow_up || v.lastFollowUp,
      })));
    }).catch(() => {});
  }, []);
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewTab, setViewTab] = useState("active");
  const [confirmAction, setConfirmAction] = useState(null); // {type:"convert"|"delete", visitor}
  const [openMenuId, setOpenMenuId] = useState(null);
  const [archiveDays, setArchiveDays] = useState(30);
  const [showSettings, setShowSettings] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [searchQ, setSearchQ] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [filterBranch, setFilterBranch] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("name");

  // Close dropdowns on outside click — useEffect replaces backdrop div to avoid
  // z-index stacking context issues (anim-fade on Card creates a new stacking context,
  // causing a fixed backdrop at z-40 to sit ABOVE the dropdown at z-50 inside the Card).
  useEffect(() => {
    if (!openMenuId && !showExport) return;
    const close = () => { setOpenMenuId(null); setShowExport(false); };
    const timer = setTimeout(() => document.addEventListener("click", close), 0);
    return () => { clearTimeout(timer); document.removeEventListener("click", close); };
  }, [openMenuId, showExport]);

  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  const daysDiff = (d) => d ? Math.floor((today - new Date(d)) / 86400000) : 999;

  // Live lookup - always fresh from visitors array
  const detailVisitor = detailId ? visitors.find(v => v.id === detailId) : null;

  const nonEnrolled = visitors.filter(v => v.status !== "Enrolled");
  const activeList = nonEnrolled.filter(v => v.status === "Interested" || v.status === "Thinking");
  const recentList = nonEnrolled.filter(v => daysDiff(v.date) <= archiveDays);
  const archiveList = nonEnrolled.filter(v => daysDiff(v.date) > archiveDays);
  const enrolledCount = visitors.filter(v => v.status === "Enrolled").length;

  const base = viewTab === "active" ? activeList : viewTab === "recent" ? recentList : archiveList;
  const searched = searchQ ? base.filter(v => (v.name||"").toLowerCase().includes(searchQ.toLowerCase()) || v.phone.includes(searchQ)) : base;
  const byStatus = statusFilter === "All" ? searched : searched.filter(v => v.status === statusFilter);
  const filtered = filterBranch === "All" ? byStatus : byStatus.filter(v => (v.branch || "") === filterBranch);
  const allBranches = ["All", ...new Set(nonEnrolled.map(v => v.branch).filter(Boolean))];
  const sortedFiltered = sortFn(filtered);
  const totalPages = Math.ceil(sortedFiltered.length / pageSize);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = sortedFiltered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const todayCount = nonEnrolled.filter(v => v.date === todayStr).length;
  const needFU = nonEnrolled.filter(v => (v.status==="Interested"||v.status==="Thinking") && daysDiff(v.lastFollowUp||v.date) > 3).length;

  // === ACTIONS ===
  const updateVisitor = async (id, updates) => {
    try { await api.patch(`/visitors/${id}`, updates); } catch {}
    setVisitors(visitors.map(v => v.id === id ? {...v, ...updates} : v));
  };

  const changeStatus = (id, newStatus) => {
    updateVisitor(id, { status: newStatus, lastFollowUp: todayStr });
    setOpenMenuId(null);
    toast.updated("Status → " + newStatus);
  };

  const markFollowUp = (id) => {
    updateVisitor(id, { lastFollowUp: todayStr });
    toast.success("ফলো-আপ সম্পন্ন ✓");
  };

  const doConvert = (v) => {
    onConvertToStudent(v);
    setConfirmAction(null);
    setDetailId(null);
    toast.success(v.name + " — ভর্তি হয়েছে! স্টুডেন্ট তালিকায় যোগ হয়েছে");
  };

  const doDelete = async (v) => {
    try { await api.del(`/visitors/${v.id}`); } catch {}
    setVisitors(visitors.filter(x => x.id !== v.id));
    setConfirmAction(null);
    setDetailId(null);
    toast.deleted("ভিজিটর");
  };

  const saveEdit = () => {
    updateVisitor(editData.id, editData);
    setEditMode(false);
    toast.updated("ভিজিটর");
  };

  const doExport = (mode) => {
    const data = mode === "all" ? nonEnrolled : mode === "active" ? activeList : filtered;
    const cols = [
      { key: "id", label: "ID" },
      { key: "name", label: "Name (EN)" },
      { key: "name_bn", label: "Name (BN)" },
      { key: "phone", label: "Phone" },
      { key: "guardian_phone", label: "Guardian Phone" },
      { key: "email", label: "Email" },
      { key: "address", label: "Address" },
      { key: "dob", label: "DOB" },
      { key: "gender", label: "Gender" },
      { key: "visa_type", label: "Visa Type" },
      { key: "interested_countries", label: "Countries" },
      { key: "interested_intake", label: "Intake" },
      { key: "has_jp_cert", label: "JP Cert" },
      { key: "jp_exam_type", label: "JP Exam" },
      { key: "jp_level", label: "JP Level" },
      { key: "jp_score", label: "JP Score" },
      { key: "source", label: "Source" },
      { key: "agent_name", label: "Agent" },
      { key: "counselor", label: "Counselor" },
      { key: "date", label: "Visit Date" },
      { key: "lastFollowUp", label: "Last Follow-up" },
      { key: "next_follow_up", label: "Next Follow-up" },
      { key: "status", label: "Status" },
      { key: "budget_concern", label: "Budget Concern" },
      { key: "notes", label: "Notes" },
    ];
    const header = cols.map(c => c.label).join(",");
    const rows = data.map(v => cols.map(c => {
      let val = v[c.key];
      if (val === undefined || val === null) return "";
      if (Array.isArray(val)) val = val.join("; ");
      if (typeof val === "boolean") val = val ? "Yes" : "No";
      val = String(val).replace(/"/g, '""');
      return val.includes(",") || val.includes("\n") || val.includes('"') ? '"' + val + '"' : val;
    }).join(","));
    const csv = header + "\n" + rows.join("\n");
    const blob = new Blob([String.fromCharCode(0xFEFF) + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const label = mode === "all" ? "All" : mode === "active" ? "Active" : "Filtered";
    a.download = "Visitors_" + label + "_" + todayStr + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
    toast.exported("Visitors " + label + " (" + data.length + " records)");
  };

  const STS = [
    { v: "Interested", l: "আগ্রহী", c: t.emerald, i: "🟢" },
    { v: "Thinking", l: "ভাবছে", c: t.amber, i: "🟡" },
    { v: "Not Interested", l: "আগ্রহী না", c: t.muted, i: "⚪" },
  ];
  const stsColor = (s) => s==="Interested"?t.emerald:s==="Thinking"?t.amber:t.muted;
  const is = { background: t.inputBg, border: "1px solid "+t.inputBorder, color: t.text };

  // ═══ DETAIL VIEW ═══
  if (detailVisitor) {
    const v = detailVisitor;
    const days = daysDiff(v.date);

    if (editMode) {
      const ed = editData;
      const se = (k,val) => setEditData({...ed, [k]:val});
      return (
        <div className="space-y-5 anim-fade">
          <div className="flex items-center gap-4">
            <button onClick={() => setEditMode(false)} className="p-2 rounded-xl hover:bg-white/5"><ArrowLeft size={18}/></button>
            <div className="flex-1"><h2 className="text-xl font-bold">সম্পাদনা: {v.name}</h2></div>
            <Button variant="ghost" size="xs" onClick={() => setEditMode(false)}>বাতিল</Button>
            <Button size="xs" icon={Save} onClick={saveEdit}>পরিবর্তন সংরক্ষণ</Button>
          </div>
          <Card delay={0}><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[{k:"name",l:"নাম (ইংরেজি)"},{k:"name_bn",l:"নাম (বাংলা)"},{k:"phone",l:"ফোন"},{k:"guardian_phone",l:"অভিভাবকের ফোন"},{k:"email",l:"ইমেইল"},{k:"dob",l:"জন্ম তারিখ",type:"date"}].map(f=>(
              <div key={f.k}><label className="text-[10px] uppercase tracking-wider block mb-1" style={{color:t.muted}}>{f.l}</label>
              <input type={f.type||"text"} value={ed[f.k]||""} onChange={e=>se(f.k,e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}/></div>
            ))}
            <div className="md:col-span-2"><label className="text-[10px] uppercase tracking-wider block mb-1" style={{color:t.muted}}>ঠিকানা</label>
            <input value={ed.address||""} onChange={e=>se("address",e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}/></div>
            {[{k:"visa_type",l:"ভিসার ধরন",opts:["Language Student","SSW","TITP","Engineer/Specialist","Graduation","Masters","Visitor","Other"]},
              {k:"source",l:"সোর্স",opts:["Walk-in","Facebook","Agent","Referral","Website","YouTube"]},
              {k:"counselor",l:"কাউন্সেলর",opts:["Mina","Sadia","Karim"]}].map(f=>(
              <div key={f.k}><label className="text-[10px] uppercase tracking-wider block mb-1" style={{color:t.muted}}>{f.l}</label>
              <select value={ed[f.k]||f.opts[0]} onChange={e=>se(f.k,e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>{f.opts.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
            ))}
            <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{color:t.muted}}>পরবর্তী ফলো-আপ</label>
            <input type="date" value={ed.next_follow_up||""} onChange={e=>se("next_follow_up",e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}/></div>
            <div className="md:col-span-3"><label className="text-[10px] uppercase tracking-wider block mb-1" style={{color:t.muted}}>নোট</label>
            <textarea value={ed.notes||""} onChange={e=>se("notes",e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={is}/></div>
          </div></Card>
        </div>
      );
    }

    return (
      <div className="space-y-5 anim-fade">
        <div className="flex items-center gap-4">
          <button onClick={() => setDetailId(null)} className="p-2 rounded-xl hover:bg-white/5"><ArrowLeft size={18}/></button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{v.name}</h2>
            <p className="text-xs" style={{color:t.muted}}>{v.name_bn||""} • {v.id} • {days}d ago</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="xs" icon={Phone} onClick={() => markFollowUp(v.id)}>ফলো-আপ</Button>
            <Button variant="ghost" size="xs" icon={Edit3} onClick={() => { setEditData({...v}); setEditMode(true); }}>সম্পাদনা</Button>
            <Button variant="danger" size="xs" icon={Trash2} onClick={() => setConfirmAction({type:"delete",visitor:v})}>মুছুন</Button>
            {v.status!=="Not Interested" && <Button size="xs" icon={Check} onClick={() => setConfirmAction({type:"convert",visitor:v})}>ভর্তি</Button>}
          </div>
        </div>

        {/* Status Change Buttons — WORKS because detailVisitor is derived */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider" style={{color:t.muted}}>Status:</span>
          {STS.map(s => (
            <button key={s.v} onClick={() => changeStatus(v.id, s.v)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition hover:scale-105"
              style={{background: v.status===s.v ? s.c+"20" : t.inputBg, color: v.status===s.v ? s.c : t.muted, border:"1px solid "+(v.status===s.v ? s.c+"40" : t.inputBorder)}}>
              {s.i} {s.l}
            </button>
          ))}
        </div>

        {/* Confirm Actions */}
        {confirmAction && <Card delay={0}><div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg" style={{background:(confirmAction.type==="delete"?t.rose:t.emerald)+"15"}}>{confirmAction.type==="delete"?"🗑️":"🎓"}</div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{color:confirmAction.type==="delete"?t.rose:t.emerald}}>{confirmAction.type==="delete"?"এই ভিজিটর মুছবেন?":"স্টুডেন্ট হিসেবে ভর্তি?"}</p>
            <p className="text-xs" style={{color:t.muted}}>{confirmAction.visitor.name} — {confirmAction.type==="delete"?"সব ডাটা মুছে যাবে":"স্টুডেন্ট তালিকায় যোগ হবে"}</p>
          </div>
          <Button variant="ghost" size="xs" onClick={() => setConfirmAction(null)}>বাতিল</Button>
          <Button variant={confirmAction.type==="delete"?"danger":"primary"} size="xs" onClick={() => confirmAction.type==="delete"?doDelete(confirmAction.visitor):doConvert(confirmAction.visitor)}>নিশ্চিত</Button>
        </div></Card>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <Card delay={50}><h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{color:t.muted}}>ব্যক্তিগত তথ্য</h4>
            <div className="space-y-2">{[{l:"নাম",val:v.name},{l:"বাংলা",val:v.name_bn},{l:"ফোন",val:v.phone},{l:"অভিভাবক",val:v.guardian_phone},{l:"ইমেইল",val:v.email},{l:"ঠিকানা",val:v.address},{l:"জন্ম তারিখ",val:v.dob},{l:"লিঙ্গ",val:v.gender}].map(f=>
              <div key={f.l} className="flex justify-between text-xs"><span style={{color:t.muted}}>{f.l}</span><span className="font-medium">{f.val||"—"}</span></div>
            )}</div>
          </Card>
          <Card delay={100}><h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{color:t.muted}}>আগ্রহ ও ভিসা</h4>
            <div className="space-y-2">{[{l:"দেশ",val:v.interested_countries?v.interested_countries.join(", "):v.country},{l:"ভিসার ধরন",val:v.visa_type},{l:"ইনটেক",val:v.interested_intake},{l:"বাজেট সমস্যা",val:v.budget_concern?"হ্যাঁ":"না"}].map(f=>
              <div key={f.l} className="flex justify-between text-xs"><span style={{color:t.muted}}>{f.l}</span><span className="font-medium">{f.val||"—"}</span></div>
            )}</div>
            {v.has_jp_cert && <div className="mt-3 p-3 rounded-lg" style={{background:t.inputBg}}><p className="text-xs font-semibold">{v.jp_exam_type||"JLPT"} — {v.jp_level} — Score: {v.jp_score||"—"}</p></div>}
          </Card>
          <Card delay={150}><h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{color:t.muted}}>সোর্স ও ফলো-আপ</h4>
            <div className="space-y-2">{[{l:"সোর্স",val:v.source},{l:"এজেন্ট",val:v.agent_name},{l:"কাউন্সেলর",val:v.counselor},{l:"ভিজিটের তারিখ",val:v.date+" ("+days+"d ago)"},{l:"শেষ ফলো-আপ",val:v.lastFollowUp?v.lastFollowUp+" ("+daysDiff(v.lastFollowUp)+"d ago)":"করা হয়নি"},{l:"পরবর্তী ফলো-আপ",val:v.next_follow_up}].map(f=>
              <div key={f.l} className="flex justify-between text-xs"><span style={{color:t.muted}}>{f.l}</span><span className="font-medium" style={{color:f.val==="করা হয়নি"?t.rose:t.text}}>{f.val||"—"}</span></div>
            )}</div>
          </Card>
          <Card delay={200} className="md:col-span-2 xl:col-span-3"><h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color:t.muted}}>নোট</h4>
            <p className="text-sm" style={{color:v.notes?t.text:t.muted}}>{v.notes||"কোনো নোট নেই"}</p>
          </Card>
        </div>
      </div>
    );
  }

  // ═══ LIST VIEW ═══
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">ভিজিটর</h2><p className="text-xs mt-0.5" style={{color:t.muted}}>ভিজিটর ও ফলো-আপ ব্যবস্থাপনা</p></div>
        <div className="flex gap-2">
          <div className="relative">
            <Button variant="ghost" size="xs" icon={Download} onClick={() => setShowExport(!showExport)}>এক্সপোর্ট ▾</Button>
            {showExport && <div className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden min-w-[220px]" style={{background:t.cardSolid,border:"1px solid "+t.border,boxShadow:"0 8px 30px rgba(0,0,0,0.25)"}}>
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold" style={{color:t.muted,borderBottom:"1px solid "+t.border}}>ভিজিটর CSV এক্সপোর্ট</div>
              <button onClick={() => doExport("filtered")} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition" onMouseEnter={e=>e.currentTarget.style.background=t.hoverBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{color:t.cyan}}>📋</span><div><p className="font-medium">Current View ({filtered.length})</p><p className="text-[9px]" style={{color:t.muted}}>Only showing filtered visitors</p></div>
              </button>
              <button onClick={() => doExport("active")} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition" onMouseEnter={e=>e.currentTarget.style.background=t.hoverBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{color:t.emerald}}>🟢</span><div><p className="font-medium">Active Only ({activeList.length})</p><p className="text-[9px]" style={{color:t.muted}}>Interested + Thinking</p></div>
              </button>
              <button onClick={() => doExport("all")} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition" onMouseEnter={e=>e.currentTarget.style.background=t.hoverBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{color:t.purple}}>📦</span><div><p className="font-medium">All Visitors ({nonEnrolled.length})</p><p className="text-[9px]" style={{color:t.muted}}>Everything except enrolled</p></div>
              </button>
            </div>}
          </div>
          <Button variant="ghost" size="xs" icon={Settings} onClick={() => setShowSettings(!showSettings)}/>
          <Button icon={Plus} onClick={() => setShowForm(!showForm)}>{showForm?"বন্ধ":"নতুন ভিজিটর"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[{l:"সক্রিয়",v:activeList.length,c:t.cyan},{l:"আজ",v:todayCount,c:t.emerald},{l:"ফলো-আপ বাকি",v:needFU,c:needFU>0?t.rose:t.muted},{l:"ভর্তি হয়েছে",v:enrolledCount,c:t.purple},{l:"আর্কাইভ",v:archiveList.length,c:t.muted}].map((s,i)=>
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{background:t.inputBg}}><p className="text-lg font-bold" style={{color:s.c}}>{s.v}</p><p className="text-[10px]" style={{color:t.muted}}>{s.l}</p></div>
        )}
      </div>

      {showSettings && <Card delay={0} className="!p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">আর্কাইভ সেটিংস</p><p className="text-[10px]" style={{color:t.muted}}>আর্কাইভের আগে দিন</p></div><div className="flex items-center gap-2">
        {[7,15,30,60,90].map(d=><button key={d} onClick={()=>{setArchiveDays(d);toast.saved("Archive: "+d+"d")}} className="px-2.5 py-1 rounded-lg text-[10px] font-medium" style={{background:archiveDays===d?t.cyan+"20":t.inputBg,color:archiveDays===d?t.cyan:t.muted}}>{d}d</button>)}
        <button onClick={()=>setShowSettings(false)}><X size={14} style={{color:t.muted}}/></button>
      </div></div></Card>}

      <div className="flex gap-1 p-1 rounded-xl" style={{background:t.inputBg}}>
        {[{k:"active",l:"🟢 Active",c:activeList.length},{k:"recent",l:"📅 Recent ("+archiveDays+"d)",c:recentList.length},{k:"archive",l:"📦 Archive",c:archiveList.length}].map(tab=>
          <button key={tab.k} onClick={()=>{setViewTab(tab.k);setStatusFilter("All");setPage(1);}} className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition"
            style={{background:viewTab===tab.k?(t.mode==="dark"?"rgba(255,255,255,0.1)":"#fff"):"transparent",color:viewTab===tab.k?t.text:t.muted}}>{tab.l} ({tab.c})</button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-1.5 rounded-lg" style={{background:t.inputBg,border:"1px solid "+t.inputBorder}}>
          <Search size={13} style={{color:t.muted}}/>
          <input value={searchQ} onChange={e=>{setSearchQ(e.target.value);setPage(1);}} className="flex-1 bg-transparent text-xs outline-none" style={{color:t.text}} placeholder="নাম, ফোন খুঁজুন..."/>
          {searchQ && <button onClick={()=>setSearchQ("")}><X size={12} style={{color:t.muted}}/></button>}
        </div>
        {["All","Interested","Thinking","Not Interested"].map(f=>{
          const c=searched.filter(v=>f==="All"||v.status===f).length;
          return <button key={f} onClick={()=>{setStatusFilter(f);setPage(1);}} className="px-3 py-1.5 rounded-lg text-xs transition" style={{background:statusFilter===f?(t.mode==="dark"?"rgba(255,255,255,0.1)":"#e2e8f0"):"transparent",color:statusFilter===f?t.text:t.muted,fontWeight:statusFilter===f?600:400}}>{f} ({c})</button>;
        })}
        <select value={filterBranch} onChange={e=>{setFilterBranch(e.target.value);setPage(1);}} className="px-3 py-1.5 rounded-lg text-xs outline-none ml-auto" style={{background:t.inputBg,border:`1px solid ${filterBranch!=="All"?t.cyan:t.inputBorder}`,color:filterBranch!=="All"?t.cyan:t.text}}>
          {allBranches.map(b=><option key={b} value={b}>{b==="All"?"সব ব্রাঞ্চ":b}</option>)}
        </select>
      </div>

      {confirmAction && <Card delay={0}><div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg" style={{background:(confirmAction.type==="delete"?t.rose:t.emerald)+"15"}}>{confirmAction.type==="delete"?"🗑️":"🎓"}</div>
        <div className="flex-1"><p className="text-sm font-bold" style={{color:confirmAction.type==="delete"?t.rose:t.emerald}}>{confirmAction.type==="delete"?"এই ভিজিটর মুছবেন?":"স্টুডেন্ট হিসেবে ভর্তি?"}</p><p className="text-xs" style={{color:t.muted}}>{confirmAction.visitor.name}</p></div>
        <Button variant="ghost" size="xs" onClick={()=>setConfirmAction(null)}>বাতিল</Button>
        <Button variant={confirmAction.type==="delete"?"danger":"primary"} size="xs" onClick={()=>confirmAction.type==="delete"?doDelete(confirmAction.visitor):doConvert(confirmAction.visitor)}>নিশ্চিত</Button>
      </div></Card>}

      {showForm && <Card delay={0}><h3 className="text-sm font-semibold mb-4">+ নতুন ভিজিটর</h3>
        <NewVisitorForm onSave={async (v)=>{try{const saved=await api.post("/visitors",v);setVisitors([saved,...visitors]);}catch{setVisitors([v,...visitors]);}setShowForm(false);toast.created("ভিজিটর");}} onCancel={()=>setShowForm(false)}/></Card>}

      <Card delay={100}>
        <p className="text-xs font-medium mb-3" style={{color:t.textSecondary}}>মোট: {sortedFiltered.length} জন ভিজিটর</p>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr style={{borderBottom:"1px solid "+t.border}}>
          <SortHeader label="নাম" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label="ফোন" sortKey="phone" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label="ব্রাঞ্চ" sortKey="branch" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label="দেশ" sortKey="interested_countries" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label="স্ট্যাটাস" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label="সোর্স" sortKey="source" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label="তারিখ" sortKey="date" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label="ফলো-আপ" sortKey="lastFollowUp" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{color:t.muted}}>অ্যাকশন</th>
        </tr></thead><tbody>
          {paginated.map(v=>{
            const dc=v.interested_countries?v.interested_countries[0]:v.country;
            const mc=v.interested_countries&&v.interested_countries.length>1;
            const days=daysDiff(v.date);
            const fuD=daysDiff(v.lastFollowUp);
            const fuBad=(v.status==="Interested"||v.status==="Thinking")&&fuD>3;
            const isMenu=openMenuId===v.id;
            return <tr key={v.id} className="cursor-pointer" style={{borderBottom:"1px solid "+t.border}}
              onMouseEnter={e=>e.currentTarget.style.background=t.hoverBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              onClick={()=>setDetailId(v.id)}>
              {/* নাম */}
              <td className="py-3 px-3"><div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{background:t.cyan+"15",color:t.cyan}}>{v.name.charAt(0)}</div>
                <div><span className="font-medium block">{v.name}</span>{v.name_bn&&<span className="text-[9px] block" style={{color:t.muted}}>{v.name_bn}</span>}</div>
              </div></td>
              {/* ফোন */}
              <td className="py-3 px-3 font-mono text-[11px]" style={{color:t.textSecondary}}>{v.phone}</td>
              {/* Branch */}
              <td className="py-3 px-3"><Badge color={t.purple} size="xs">{v.branch || "—"}</Badge></td>
              {/* দেশ */}
              <td className="py-3 px-3"><Badge color={dc==="Japan"?t.rose:dc==="Germany"?t.amber:t.emerald} size="xs">{dc}</Badge>{mc&&<span className="text-[8px] ml-1" style={{color:t.muted}}>+{v.interested_countries.length-1}</span>}</td>
              {/* স্ট্যাটাস */}
              <td className="py-3 px-3" onClick={e=>e.stopPropagation()}>
                <div className="relative">
                  <button onClick={()=>setOpenMenuId(isMenu?null:v.id)} className="hover:scale-105 transition"><Badge color={stsColor(v.status)} size="xs">{v.status} ▾</Badge></button>
                  {isMenu&&<div className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-hidden min-w-[150px]" style={{background:t.cardSolid,border:"1px solid "+t.border,boxShadow:"0 8px 30px rgba(0,0,0,0.25)"}}>
                    {STS.map(s=><button key={s.v} onClick={()=>changeStatus(v.id,s.v)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition"
                      style={{background:v.status===s.v?s.c+"15":"transparent",color:v.status===s.v?s.c:t.text}}
                      onMouseEnter={e=>{if(v.status!==s.v)e.currentTarget.style.background=t.hoverBg}} onMouseLeave={e=>{if(v.status!==s.v)e.currentTarget.style.background="transparent"}}>
                      <span>{s.i}</span><span className="font-medium">{s.l}</span>{v.status===s.v&&<Check size={12} style={{marginLeft:"auto",color:s.c}}/>}
                    </button>)}
                  </div>}
                </div>
              </td>
              {/* Source */}
              <td className="py-3 px-3" style={{color:t.textSecondary}}>{v.source}</td>
              {/* তারিখ */}
              <td className="py-3 px-3"><span className="text-[10px] font-mono" style={{color:days>14?t.rose:days>7?t.amber:t.muted}}>{v.date} ({days}d)</span></td>
              {/* Follow-up */}
              <td className="py-3 px-3">{fuBad?<span className="text-[10px] font-semibold" style={{color:t.rose}}>বিলম্বিত</span>:v.lastFollowUp?<span className="text-[10px]" style={{color:t.emerald}}>✓ {fuD}d</span>:<span className="text-[10px]" style={{color:t.muted}}>—</span>}</td>
              {/* Action */}
              <td className="py-3 px-3" onClick={e=>e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  {(v.status==="Interested"||v.status==="Thinking")&&<button onClick={()=>markFollowUp(v.id)} className="px-2 py-1 rounded text-[9px] font-medium" style={{background:t.cyan+"15",color:t.cyan}} title="ফলো-আপ সম্পন্ন">📞</button>}
                  {v.status!=="Not Interested"&&<button onClick={()=>setConfirmAction({type:"convert",visitor:v})} className="px-2 py-1 rounded text-[9px] font-medium" style={{background:t.emerald+"15",color:t.emerald}}>🎓 ভর্তি</button>}
                </div>
              </td>
            </tr>;
          })}
        </tbody></table></div>
        {sortedFiltered.length===0&&<div className="flex flex-col items-center py-12 opacity-40"><p className="text-sm">কোনো ভিজিটর পাওয়া যায়নি</p></div>}
        <Pagination total={sortedFiltered.length} page={safePage} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </Card>
    </div>
  );
}
