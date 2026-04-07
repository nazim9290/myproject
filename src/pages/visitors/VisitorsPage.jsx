import { useState, useEffect, useCallback, useRef } from "react";
import { AlertCircle, Save, Plus, Download, Settings, Search, X, ArrowLeft, Phone, Edit3, Trash2, Check, ChevronDown, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import Pagination from "../../components/ui/Pagination";
import PhoneInput, { isValidPhone, formatPhoneDisplay } from "../../components/ui/PhoneInput";
import useSortable from "../../hooks/useSortable";
import SortHeader from "../../components/ui/SortHeader";
import ExportModal from "../../components/ui/ExportModal";
import { getRowStyle } from "../../lib/conditionalFormat";
import TableInsights from "../../components/ui/TableInsights";
import DateInput, { formatDateDisplay } from "../../components/ui/DateInput";
import { api } from "../../hooks/useAPI";

// ── টেবিল ইনসাইটস — গ্রুপিং ও শর্তভিত্তিক ফর্ম্যাটিং ফিল্ডসমূহ ──
const VISITOR_INSIGHT_FIELDS = [
  { key: "status", label: "Status" },
  { key: "source", label: "Source" },
  { key: "branch", label: "Branch" },
  { key: "counselor", label: "Counselor" },
  { key: "interested_countries", label: "Countries" },
  { key: "interested_intake", label: "Intake" },
  { key: "gender", label: "Gender" },
];

// ── এক্সপোর্ট মডালে দেখানো কলামগুলো — সব visitor ফিল্ড ──
const VISITOR_EXPORT_COLUMNS = [
  { key: "display_id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "name_en", label: "Name (EN)" },
  { key: "phone", label: "Phone" },
  { key: "guardian_phone", label: "Guardian Phone" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
  { key: "source", label: "Source" },
  { key: "counselor", label: "Counselor" },
  { key: "branch", label: "Branch" },
  { key: "interested_countries", label: "Countries" },
  { key: "interested_intake", label: "Intake" },
  { key: "date", label: "Visit Date" },
  { key: "notes", label: "Notes" },
];

function NewVisitorForm({ onSave, onCancel }) {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
  // API থেকে branches ও agents load (mock data সরানো হয়েছে)
  const [branchesList, setBranchesList] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  useEffect(() => {
    api.get("/branches").then(d => { if (Array.isArray(d)) setBranchesList(d); }).catch(() => {});
    api.get("/agents").then(d => { if (Array.isArray(d)) setAgentsList(d); }).catch(() => {});
    api.get("/users").then(d => { const arr = Array.isArray(d) ? d : d?.data || []; setUsersList(arr); }).catch(() => {});
  }, []);
  // ── User-এর branch auto-detect — JWT token থেকে ──
  const userBranch = (() => { try { const t = localStorage.getItem("agencyos_token"); if (!t) return ""; const p = JSON.parse(atob(t.split(".")[1])); return p.branch || ""; } catch { return ""; } })();

  const [form, setForm] = useState({
    name: "", name_en: "", phone: "", guardian_phone: "", email: "", address: "", dob: "", gender: "Male", branch: userBranch,
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
  const validate = () => { const e = {}; if (!form.name.trim()) e.name = "নাম আবশ্যক"; if (!form.phone.trim()) e.phone = "ফোন আবশ্যক"; else if (!isValidPhone(form.phone)) e.phone = "সঠিক ফোন নম্বর দিন"; setErrors(e); return Object.keys(e).length === 0; };
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
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Full Name <span className="req-star">*</span></label>
        <input value={form.name} onChange={e => { set("name", e.target.value); if (!form.name_en) set("name_en", e.target.value); }} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ ...is, borderColor: errors.name ? t.rose : t.inputBorder }} placeholder="FULL NAME IN ENGLISH" /><FieldError error={errors.name} /></div>
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>জন্ম তারিখ</label>
        <DateInput value={form.dob} onChange={v => set("dob", v)} size="md" /></div>
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ফোন <span className="req-star">*</span></label>
        <PhoneInput value={form.phone} onChange={v => set("phone", v)} error={errors.phone} size="md" /><FieldError error={errors.phone} /></div>
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>অভিভাবকের ফোন</label>
        <PhoneInput value={form.guardian_phone} onChange={v => set("guardian_phone", v)} size="md" /></div>
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
          {branchesList.map(b => <option key={b.id || b.name} value={b.name}>{b.name} {b.city ? `(${b.city})` : ""}</option>)}
        </select></div>
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>সোর্স</label>
        <select value={form.source} onChange={e => set("source", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}><option>Walk-in</option><option>Facebook</option><option>Agent</option><option>Referral</option><option>Website</option><option>YouTube</option></select></div>
        {form.source === "Agent" && <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>এজেন্ট নির্বাচন করুন <span className="req-star">*</span></label>
        <select value={form.agent_name} onChange={e => set("agent_name", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ ...is, borderColor: !form.agent_name ? `${t.amber}60` : t.inputBorder }}>
          <option value="">— এজেন্ট সিলেক্ট করুন —</option>
          {agentsList.filter(a => a.status === "active").map(a => <option key={a.id} value={a.name}>{a.name} {a.area ? `(${a.area})` : ""}</option>)}
        </select></div>}
        {form.source === "Referral" && <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>রেফারার নাম / ফোন</label>
        <input value={form.referral_info || ""} onChange={e => set("referral_info", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="যিনি রেফার করেছেন তার নাম বা ফোন" /></div>}
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>কাউন্সেলর</label>
        <select value={form.counselor} onChange={e => set("counselor", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}><option value="">নির্বাচন করুন</option>{usersList.map(u => <option key={u.id} value={u.name || u.email}>{u.name || u.email}</option>)}</select></div>
        <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পরবর্তী ফলোআপ</label>
        <DateInput value={form.next_follow_up} onChange={v => set("next_follow_up", v)} size="md" /></div>
      </div>
      <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>কাউন্সেলিং নোট</label>
      <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={is} placeholder="আলোচনার বিবরণ..." /></div></>}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
        <p className="text-[10px]" style={{ color: t.muted }}>* চিহ্নিত field আবশ্যক</p>
        <div className="flex gap-2"><Button variant="ghost" onClick={onCancel}>{tr("common.cancel")}</Button><Button icon={Save} onClick={save}>{tr("common.save")}</Button></div>
      </div>
    </div>
  );
}

export default function VisitorsPage({ visitors, setVisitors, onConvertToStudent, reloadData }) {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
  const [showForm, setShowForm] = useState(false);

  // ── Server-side pagination state ──
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewTab, setViewTab] = useState("active");
  const [confirmAction, setConfirmAction] = useState(null); // {type:"convert", visitor}
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [insightFilter, setInsightFilter] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [archiveDays, setArchiveDays] = useState(30);
  const [showSettings, setShowSettings] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [visitorChecks, setVisitorChecks] = useState({});
  const [editData, setEditData] = useState({});
  const [searchQ, setSearchQ] = useState("");
  const [showExport, setShowExport] = useState(false);
  // ── ExportModal দেখানোর state — কলাম সিলেক্ট করে CSV ডাউনলোড ──
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalData, setExportModalData] = useState([]);
  const [filterBranch, setFilterBranch] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [serverTotal, setServerTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("date", "desc");

  // ── Search debounce — টাইপ করার সময় প্রতিটি keystroke-এ API call এড়ানো ──
  const searchTimerRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(searchQ), 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQ]);

  // ── Server-side pagination — API থেকে page-by-page data fetch ──
  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, exclude_status: "Enrolled" };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterBranch !== "All") params.branch = filterBranch;
      // viewTab অনুযায়ী status filter — "active" = Interested,Thinking
      if (viewTab === "active") {
        params.status_in = "Interested,Thinking";
      }
      // statusFilter button — নির্দিষ্ট status সিলেক্ট করা হলে
      if (statusFilter !== "All") {
        params.status = statusFilter;
        delete params.status_in; // single status সিলেক্ট হলে status_in override
      }
      const qs = new URLSearchParams(params).toString();
      const res = await api.get(`/visitors?${qs}`);
      const data = Array.isArray(res) ? res : res.data || [];
      const total = res.total ?? data.length;
      setVisitors(data.map(v => ({
        ...v, name_en: v.name_en || v.name, date: v.visit_date || v.date,
        lastFollowUp: v.last_follow_up || v.lastFollowUp,
      })));
      setServerTotal(total);
    } catch (err) {
      console.error("[Visitors Load]", err);
      toast.error("ভিজিটর ডাটা লোড করতে সমস্যা হয়েছে");
    }
    setLoading(false);
  }, [page, pageSize, debouncedSearch, filterBranch, viewTab, statusFilter]);

  // ── ফিল্টার/পেজ বদলালে re-fetch হবে ──
  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

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

  // ── সার্ভার থেকে ইতিমধ্যে ফিল্টার ও পেজিনেট করা data এসেছে ──
  // শুধু client-side sort প্রয়োগ করা হচ্ছে
  const paginated = sortFn(visitors);

  // ── Insight filter — TableInsights group card click করলে client-side filter ──
  const displayData = insightFilter?.value
    ? paginated.filter(v => String(v[insightFilter.field] || "").toLowerCase() === String(insightFilter.value).toLowerCase())
    : paginated;

  const allBranches = ["All", ...new Set(visitors.map(v => v.branch).filter(Boolean))];

  // KPI counts — current page data থেকে (approximate)
  const todayCount = visitors.filter(v => v.date === todayStr).length;
  const needFU = visitors.filter(v => (v.status==="Interested"||v.status==="Thinking") && daysDiff(v.lastFollowUp||v.date) > 3).length;

  // === ACTIONS ===
  const updateVisitor = async (id, updates) => {
    try {
      await api.patch(`/visitors/${id}`, updates);
      // লোকাল state আপডেট + সার্ভার re-fetch
      setVisitors(visitors.map(v => v.id === id ? {...v, ...updates} : v));
    } catch (err) { console.error("[Visitor Update]", err); toast.error("আপডেট সার্ভারে সেভ ব্যর্থ"); }
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
    fetchVisitors(); // সার্ভার থেকে re-fetch
  };

  const doDelete = async (v) => {
    try { await api.del(`/visitors/${v.id}`); } catch (err) { console.error("[Visitor Delete]", err); toast.error("সার্ভার থেকে মুছতে সমস্যা হয়েছে"); }
    setDeleteTarget(null);
    setDetailId(null);
    toast.deleted("ভিজিটর");
    fetchVisitors(); // সার্ভার থেকে re-fetch
  };

  const saveEdit = () => {
    updateVisitor(editData.id, editData);
    setEditMode(false);
    toast.updated("ভিজিটর");
  };

  // ── সার্ভার থেকে সব ভিজিটর আনার হেল্পার — ExportModal-এর জন্য ──
  const fetchAllVisitors = async (mode) => {
    try {
      let allData = [];
      let pg = 1, hasMore = true;
      const baseParams = { limit: 100, exclude_status: "Enrolled" };
      if (mode === "active") baseParams.status_in = "Interested,Thinking";
      while (hasMore) {
        const qs = new URLSearchParams({ ...baseParams, page: pg }).toString();
        const res = await api.get(`/visitors?${qs}`);
        const d = Array.isArray(res) ? res : res.data || [];
        allData = allData.concat(d.map(v => ({ ...v, name_en: v.name_en || v.name, date: v.visit_date || v.date, lastFollowUp: v.last_follow_up })));
        hasMore = d.length === 100;
        pg++;
      }
      return allData;
    } catch { return visitors; }
  };

  // ── পুরাতন inline CSV export — fallback হিসেবে রাখা হয়েছে ──
  const doExport = async (mode) => {
    // mode: "filtered" = বর্তমান পেজ, "active" = সক্রিয় সব, "all" = সব ভিজিটর
    let data = visitors;
    if (mode === "all" || mode === "active") {
      try {
        let allData = [];
        let pg = 1, hasMore = true;
        const baseParams = { limit: 100, exclude_status: "Enrolled" };
        if (mode === "active") baseParams.status_in = "Interested,Thinking";
        while (hasMore) {
          const qs = new URLSearchParams({ ...baseParams, page: pg }).toString();
          const res = await api.get(`/visitors?${qs}`);
          const d = Array.isArray(res) ? res : res.data || [];
          allData = allData.concat(d.map(v => ({ ...v, name_en: v.name_en || v.name, date: v.visit_date || v.date, lastFollowUp: v.last_follow_up })));
          hasMore = d.length === 100;
          pg++;
        }
        data = allData;
      } catch { data = visitors; }
    }
    const cols = [
      { key: "display_id", label: "ID" },
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
    // ফোন নম্বরে leading zero রক্ষা — Excel-এ ="0171..." format
    const PHONE_KEYS = ["phone", "guardian_phone"];
    const rows = data.map(v => cols.map(c => {
      let val = v[c.key];
      if (val === undefined || val === null) return "";
      if (Array.isArray(val)) val = val.join("; ");
      if (typeof val === "boolean") val = val ? "Yes" : "No";
      val = String(val).replace(/"/g, '""');
      // ফোন নম্বর — leading zero রাখতে ="..." format
      if (PHONE_KEYS.includes(c.key) && val && /^0\d+$/.test(val)) return '="' + val + '"';
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
            <div className="flex-1"><h2 className="text-xl font-bold">সম্পাদনা: {v.name_en || v.name}</h2></div>
            <Button variant="ghost" size="xs" onClick={() => setEditMode(false)}>{tr("common.cancel")}</Button>
            <Button size="xs" icon={Save} onClick={saveEdit}>{tr("common.save")}</Button>
          </div>
          <Card delay={0}><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[{k:"name",l:"নাম (ইংরেজি)"},{k:"email",l:"ইমেইল"}].map(f=>(
              <div key={f.k}><label className="text-[10px] uppercase tracking-wider block mb-1" style={{color:t.muted}}>{f.l}</label>
              <input value={ed[f.k]||""} onChange={e=>se(f.k,e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}/></div>
            ))}
            <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{color:t.muted}}>জন্ম তারিখ</label>
            <DateInput value={ed.dob||""} onChange={v=>se("dob",v)} size="md" /></div>
            <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{color:t.muted}}>ফোন</label>
            <PhoneInput value={ed.phone||""} onChange={v=>se("phone",v)} size="md" /></div>
            <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{color:t.muted}}>অভিভাবকের ফোন</label>
            <PhoneInput value={ed.guardian_phone||""} onChange={v=>se("guardian_phone",v)} size="md" /></div>
            <div className="md:col-span-2"><label className="text-[10px] uppercase tracking-wider block mb-1" style={{color:t.muted}}>ঠিকানা</label>
            <input value={ed.address||""} onChange={e=>se("address",e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}/></div>
            {[{k:"visa_type",l:"ভিসার ধরন",opts:["Language Student","SSW","TITP","Engineer/Specialist","Graduation","Masters","Visitor","Other"]},
              {k:"source",l:"সোর্স",opts:["Walk-in","Facebook","Agent","Referral","Website","YouTube"]},
              {k:"counselor",l:"কাউন্সেলর",opts:usersList.map(u=>u.name||u.email)}].map(f=>(
              <div key={f.k}><label className="text-[10px] uppercase tracking-wider block mb-1" style={{color:t.muted}}>{f.l}</label>
              <select value={ed[f.k]||f.opts[0]} onChange={e=>se(f.k,e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>{f.opts.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
            ))}
            <div><label className="text-[10px] uppercase tracking-wider block mb-1" style={{color:t.muted}}>পরবর্তী ফলো-আপ</label>
            <DateInput value={ed.next_follow_up||""} onChange={v=>se("next_follow_up",v)} size="md" /></div>
            <div className="md:col-span-3"><label className="text-[10px] uppercase tracking-wider block mb-1" style={{color:t.muted}}>নোট</label>
            <textarea value={ed.notes||""} onChange={e=>se("notes",e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={is}/></div>
          </div></Card>
        </div>
      );
    }

    return (
      <div className="space-y-5 anim-fade">
        <div className="flex items-center gap-4">
          <button onClick={() => setDetailId(null)} className="p-2 rounded-xl transition flex items-center gap-1 text-xs font-medium"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
            onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = t.inputBg}>
            <ArrowLeft size={16} /> <span className="hidden sm:inline">ফিরুন</span>
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{v.name_en || v.name}</h2>
            <p className="text-xs" style={{color:t.muted}}>{v.display_id || v.id} • {days}d ago</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="xs" icon={Phone} onClick={() => markFollowUp(v.id)}>{tr("visitors.followUp")}</Button>
            <Button variant="ghost" size="xs" icon={Edit3} onClick={() => { setEditData({...v}); setEditMode(true); }}>{tr("common.edit")}</Button>
            <Button variant="danger" size="xs" icon={Trash2} onClick={() => setDeleteTarget(v)}>{tr("common.delete")}</Button>
            {v.status!=="Not Interested" && <Button size="xs" icon={Check} onClick={() => setConfirmAction({type:"convert",visitor:v})}>{tr("students.enrolled")}</Button>}
          </div>
        </div>

        {/* ── Visitor → ভর্তি Pipeline + Checklist নির্দেশনা ── */}
        {(() => {
          const VISITOR_PIPELINE = [
            { code: "Interested", label: "আগ্রহী", icon: "🟢", color: t.emerald,
              hint: "প্রাথমিক কাউন্সেলিং সম্পন্ন করুন — আগ্রহের দেশ, বাজেট ও সময়সীমা নির্ধারণ করুন",
              checklist: [
                { id: "v1", text: "প্রাথমিক কাউন্সেলিং সম্পন্ন হয়েছে", req: true },
                { id: "v2", text: "আগ্রহের দেশ ও ভিসার ধরন নির্ধারিত", req: true },
                { id: "v3", text: "বাজেট ও সময়সীমা আলোচনা হয়েছে", req: false },
                { id: "v4", text: "পরবর্তী ফলো-আপ তারিখ নির্ধারিত", req: true },
              ],
              nextAction: "Thinking", nextLabel: "পরবর্তী: ভাবছে",
            },
            { code: "Thinking", label: "ভাবছে / পরামর্শ", icon: "🤔", color: t.amber,
              hint: "ভিজিটর সিদ্ধান্ত নিচ্ছে — নিয়মিত ফলো-আপ করুন, প্রশ্নের উত্তর দিন",
              checklist: [
                { id: "t1", text: "কমপক্ষে ২ বার ফলো-আপ কল করা হয়েছে", req: true },
                { id: "t2", text: "অভিভাবকের সাথে আলোচনা হয়েছে", req: false },
                { id: "t3", text: "সব প্রশ্নের সঠিক উত্তর দেওয়া হয়েছে", req: true },
                { id: "t4", text: "প্রতিযোগী এজেন্সির offer জানা হয়েছে", req: false },
              ],
              nextAction: "follow-up", nextLabel: "পরবর্তী: ফলো-আপ",
            },
            { code: "Follow-up", label: "ফলো-আপ চলছে", icon: "📞", color: t.cyan,
              hint: "নিয়মিত ফলো-আপ অব্যাহত রাখুন — ভর্তির সিদ্ধান্ত চূড়ান্ত করুন",
              checklist: [
                { id: "f1", text: "কমপক্ষে ৩ বার ফলো-আপ সম্পন্ন", req: true },
                { id: "f2", text: "ভর্তি ফি ও কিস্তির পরিমাণ জানানো হয়েছে", req: true },
                { id: "f3", text: "প্রয়োজনীয় কাগজপত্রের তালিকা দেওয়া হয়েছে", req: false },
                { id: "f4", text: "ভর্তির সিদ্ধান্ত চূড়ান্ত হয়েছে", req: true },
              ],
              nextAction: "ready", nextLabel: "পরবর্তী: ভর্তির জন্য প্রস্তুত",
            },
            { code: "Ready", label: "ভর্তির জন্য প্রস্তুত", icon: "✅", color: t.purple,
              hint: "ভর্তি ফি গ্রহণ করুন ও স্টুডেন্ট হিসেবে convert করুন",
              checklist: [
                { id: "r1", text: "ভর্তি ফি পরিশোধ হয়েছে", req: true },
                { id: "r2", text: "ভর্তি ফর্ম পূরণ হয়েছে", req: true },
                { id: "r3", text: "পাসপোর্ট কপি জমা হয়েছে", req: false },
                { id: "r4", text: "ছবি জমা হয়েছে", req: false },
              ],
              nextAction: "convert", nextLabel: "🎓 ভর্তি করুন (স্টুডেন্ট-এ কনভার্ট)",
            },
            { code: "Enrolled", label: "ভর্তি সম্পন্ন", icon: "🎓", color: t.emerald,
              hint: "ভর্তি সম্পন্ন — Students মডিউলে চলে গেছে",
              checklist: [], nextAction: null, nextLabel: null,
            },
          ];

          const sMap = { "Interested": 0, "Thinking": 1, "Not Interested": -1 };
          const hasFollowUp = v.lastFollowUp || v.last_follow_up;
          let currentStep = sMap[v.status] ?? 0;
          if (hasFollowUp && currentStep >= 1) currentStep = Math.max(currentStep, 2);
          if (v.status === "converted" || v.status === "Enrolled") currentStep = 4;
          const currentPipe = VISITOR_PIPELINE[Math.max(0, Math.min(currentStep, VISITOR_PIPELINE.length - 1))];

          return (
            <>
              {/* Pipeline Progress */}
              <Card delay={50}>
                <p className="text-[10px] uppercase tracking-wider mb-3 font-semibold" style={{color:t.muted}}>ভিজিটর → ভর্তি পাইপলাইন</p>
                <div className="flex items-center gap-1">
                  {VISITOR_PIPELINE.map((step, i) => {
                    const isDone = i <= currentStep;
                    const isCurrent = i === currentStep;
                    return (
                      <div key={step.code} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                            style={{
                              background: isDone ? step.color+"20" : t.inputBg,
                              border: `2px solid ${isDone ? step.color : t.inputBorder}`,
                              color: isDone ? step.color : t.muted,
                              transform: isCurrent ? "scale(1.15)" : "scale(1)",
                              boxShadow: isCurrent ? `0 0 12px ${step.color}40` : "none",
                            }}>
                            {isDone ? step.icon : i+1}
                          </div>
                          <p className="text-[9px] mt-1 text-center leading-tight" style={{color: isDone ? step.color : t.muted, fontWeight: isCurrent ? 700 : 400}}>
                            {step.label}
                          </p>
                        </div>
                        {i < VISITOR_PIPELINE.length-1 && (
                          <div className="h-0.5 flex-1 mx-1 rounded-full" style={{background: i<currentStep ? step.color : t.inputBorder}} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* ── এই ধাপের নির্দেশনা ও Checklist ── */}
              {currentPipe.checklist.length > 0 && (
                <Card delay={100}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{background: currentPipe.color+"15"}}>
                      {currentPipe.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{currentPipe.label} — করণীয়</p>
                      <p className="text-[11px] mt-0.5" style={{color: t.muted}}>{currentPipe.hint}</p>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2 mb-4">
                    <p className="text-[10px] uppercase tracking-wider font-bold" style={{color:t.muted}}>এই ধাপে যা করতে হবে</p>
                    {currentPipe.checklist.map(item => {
                      const key = `vp_${currentPipe.code}_${item.id}`;
                      const ticked = !!visitorChecks[key];
                      return (
                        <button key={item.id} onClick={()=>setVisitorChecks(prev=>({...prev,[key]:!prev[key]}))}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all"
                          style={{background: ticked ? `${t.emerald}10` : t.inputBg, border:`1px solid ${ticked ? `${t.emerald}30` : "transparent"}`}}>
                          <div className="h-5 w-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-all"
                            style={{background: ticked ? t.emerald : "transparent", borderColor: ticked ? t.emerald : t.inputBorder}}>
                            {ticked && <Check size={11} color="#fff"/>}
                          </div>
                          <span className="text-xs flex-1" style={{color: ticked ? t.textSecondary : t.text, textDecoration: ticked ? "line-through" : "none"}}>
                            {item.text}
                          </span>
                          {item.req && !ticked && <span className="text-[9px] shrink-0 px-1.5 py-0.5 rounded-full" style={{background:`${t.rose}15`,color:t.rose}}>আবশ্যক</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Step Button */}
                  {currentPipe.nextAction && (
                    <div className="pt-3" style={{borderTop:`1px solid ${t.border}`}}>
                      {currentPipe.nextAction === "convert" ? (
                        <button onClick={()=>setConfirmAction({type:"convert",visitor:v})}
                          className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.01]"
                          style={{background:`linear-gradient(135deg, ${t.emerald}, ${t.cyan})`, color:"#fff"}}>
                          🎓 ভর্তি করুন — স্টুডেন্ট মডিউলে কনভার্ট
                        </button>
                      ) : (
                        <button onClick={()=>{
                          if (currentPipe.nextAction === "Thinking") changeStatus(v.id, "Thinking");
                          else if (currentPipe.nextAction === "follow-up") markFollowUp(v.id);
                          else if (currentPipe.nextAction === "ready") toast.success("ভর্তির জন্য প্রস্তুত!");
                        }}
                          className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
                          style={{background: currentPipe.color+"15", color: currentPipe.color, border:`1px solid ${currentPipe.color}30`}}>
                          → {currentPipe.nextLabel}
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              )}
            </>
          );
        })()}

        {/* Status Change */}
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

        {/* ══════════ CONFIRM CONVERT MODAL (DETAIL VIEW) ══════════ */}
        <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title="ভর্তি নিশ্চিত করুন" size="sm">
          {confirmAction && <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg" style={{background:t.emerald+"15"}}>🎓</div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{color:t.emerald}}>স্টুডেন্ট হিসেবে ভর্তি?</p>
              <p className="text-xs" style={{color:t.muted}}>{confirmAction.visitor.name} — স্টুডেন্ট তালিকায় যোগ হবে</p>
            </div>
          </div>}
          {confirmAction && <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="xs" onClick={() => setConfirmAction(null)}>{tr("common.cancel")}</Button>
            <Button variant="primary" size="xs" onClick={() => doConvert(confirmAction.visitor)}>{tr("common.confirm")}</Button>
          </div>}
        </Modal>

        {/* ── ডিলিট কনফার্ম মোডাল (DETAIL VIEW) ── */}
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => doDelete(deleteTarget)}
          itemName={deleteTarget?.name || ""}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <Card delay={50}><h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{color:t.muted}}>ব্যক্তিগত তথ্য</h4>
            <div className="space-y-2">{[{l:"নাম",val:v.name_en || v.name},{l:"ফোন",val:formatPhoneDisplay(v.phone)},{l:"অভিভাবক",val:formatPhoneDisplay(v.guardian_phone)},{l:"ইমেইল",val:v.email},{l:"ঠিকানা",val:v.address},{l:"জন্ম তারিখ",val:formatDateDisplay(v.dob)},{l:"লিঙ্গ",val:v.gender}].map(f=>
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
            <div className="space-y-2">{[{l:"সোর্স",val:v.source},{l:"এজেন্ট",val:v.agent_name},{l:"কাউন্সেলর",val:v.counselor},{l:"ভিজিটের তারিখ",val:formatDateDisplay(v.date)+" ("+days+" দিন আগে)"},{l:"শেষ ফলো-আপ",val:v.lastFollowUp?formatDateDisplay(v.lastFollowUp)+" ("+daysDiff(v.lastFollowUp)+" দিন আগে)":"করা হয়নি"},{l:"পরবর্তী ফলো-আপ",val:formatDateDisplay(v.next_follow_up)}].map(f=>
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
        <div><h2 className="text-xl font-bold">{tr("visitors.title")}</h2><p className="text-xs mt-0.5" style={{color:t.muted}}>{tr("visitors.title")} — {tr("visitors.followUp")}</p></div>
        <div className="flex gap-2">
          <div className="relative">
            {/* ── এক্সপোর্ট মেনু — বর্তমান পেজ / সক্রিয় / সব ভিজিটর ExportModal দিয়ে ── */}
            <Button variant="ghost" size="xs" icon={Download} onClick={() => setShowExport(!showExport)}>{tr("common.export")} ▾</Button>
            {showExport && <div className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden min-w-[220px]" style={{background:t.cardSolid,border:"1px solid "+t.border,boxShadow:"0 8px 30px rgba(0,0,0,0.25)"}}>
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold" style={{color:t.muted,borderBottom:"1px solid "+t.border}}>ভিজিটর CSV এক্সপোর্ট</div>
              <button onClick={async () => { setExportModalData(visitors); setShowExportModal(true); setShowExport(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition" onMouseEnter={e=>e.currentTarget.style.background=t.hoverBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{color:t.cyan}}>📋</span><div><p className="font-medium">বর্তমান পেজ ({visitors.length})</p><p className="text-[9px]" style={{color:t.muted}}>এই পেজের ভিজিটর</p></div>
              </button>
              <button onClick={async () => { const data = await fetchAllVisitors("active"); setExportModalData(data); setShowExportModal(true); setShowExport(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition" onMouseEnter={e=>e.currentTarget.style.background=t.hoverBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{color:t.emerald}}>🟢</span><div><p className="font-medium">শুধু সক্রিয়</p><p className="text-[9px]" style={{color:t.muted}}>আগ্রহী + ভাবছে</p></div>
              </button>
              <button onClick={async () => { const data = await fetchAllVisitors("all"); setExportModalData(data); setShowExportModal(true); setShowExport(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition" onMouseEnter={e=>e.currentTarget.style.background=t.hoverBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{color:t.purple}}>📦</span><div><p className="font-medium">সব ভিজিটর ({serverTotal})</p><p className="text-[9px]" style={{color:t.muted}}>ভর্তি ছাড়া সবাই</p></div>
              </button>
            </div>}
          </div>
          <Button variant="ghost" size="xs" icon={Settings} onClick={() => setShowSettings(!showSettings)}/>
          <Button icon={Plus} onClick={() => setShowForm(!showForm)}>{showForm ? tr("common.close") : tr("visitors.addNew")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[{l:"মোট (ভর্তি বাদে)",v:serverTotal,c:t.cyan},{l:"আজ",v:todayCount,c:t.emerald},{l:"ফলো-আপ বাকি",v:needFU,c:needFU>0?t.rose:t.muted},{l:"বর্তমান পেজে",v:visitors.length,c:t.purple}].map((s,i)=>
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{background:t.inputBg}}><p className="text-lg font-bold" style={{color:s.c}}>{s.v}</p><p className="text-[10px]" style={{color:t.muted}}>{s.l}</p></div>
        )}
      </div>

      {showSettings && <Card delay={0} className="!p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">আর্কাইভ সেটিংস</p><p className="text-[10px]" style={{color:t.muted}}>আর্কাইভের আগে দিন</p></div><div className="flex items-center gap-2">
        {[7,15,30,60,90].map(d=><button key={d} onClick={()=>{setArchiveDays(d);toast.saved("Archive: "+d+"d")}} className="px-2.5 py-1 rounded-lg text-[10px] font-medium" style={{background:archiveDays===d?t.cyan+"20":t.inputBg,color:archiveDays===d?t.cyan:t.muted}}>{d}d</button>)}
        <button onClick={()=>setShowSettings(false)}><X size={14} style={{color:t.muted}}/></button>
      </div></div></Card>}

      <div className="flex gap-1 p-1 rounded-xl" style={{background:t.inputBg}}>
        {[{k:"active",l:"🟢 সক্রিয় (আগ্রহী + ভাবছে)"},{k:"recent",l:"📅 সব ভিজিটর"}].map(tab=>
          <button key={tab.k} onClick={()=>{setViewTab(tab.k);setStatusFilter("All");setPage(1);}} className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition"
            style={{background:viewTab===tab.k?(t.mode==="dark"?"rgba(255,255,255,0.1)":"#fff"):"transparent",color:viewTab===tab.k?t.text:t.muted}}>{tab.l}</button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-1.5 rounded-lg" style={{background:t.inputBg,border:"1px solid "+t.inputBorder}}>
          <Search size={13} style={{color:t.muted}}/>
          <input value={searchQ} onChange={e=>{setSearchQ(e.target.value);setPage(1);}} className="flex-1 bg-transparent text-xs outline-none" style={{color:t.text}} placeholder={tr("visitors.searchPlaceholder")}/>
          {searchQ && <button onClick={()=>setSearchQ("")}><X size={12} style={{color:t.muted}}/></button>}
        </div>
        {["All","Interested","Thinking","Not Interested"].map(f=>{
          return <button key={f} onClick={()=>{setStatusFilter(f);setPage(1);}} className="px-3 py-1.5 rounded-lg text-xs transition" style={{background:statusFilter===f?(t.mode==="dark"?"rgba(255,255,255,0.1)":"#e2e8f0"):"transparent",color:statusFilter===f?t.text:t.muted,fontWeight:statusFilter===f?600:400}}>{f==="All"?tr("common.all"):f==="Interested"?tr("visitors.interested"):f==="Not Interested"?tr("visitors.notInterested"):f}</button>;
        })}
        <select value={filterBranch} onChange={e=>{setFilterBranch(e.target.value);setPage(1);}} className="px-3 py-1.5 rounded-lg text-xs outline-none ml-auto" style={{background:t.inputBg,border:`1px solid ${filterBranch!=="All"?t.cyan:t.inputBorder}`,color:filterBranch!=="All"?t.cyan:t.text}}>
          {allBranches.map(b=><option key={b} value={b}>{b==="All"?tr("students.allBranches"):b}</option>)}
        </select>
      </div>

      {/* ══════════ CONFIRM CONVERT MODAL (LIST VIEW) ══════════ */}
      <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title="ভর্তি নিশ্চিত করুন" size="sm">
        {confirmAction && <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg" style={{background:t.emerald+"15"}}>🎓</div>
          <div className="flex-1"><p className="text-sm font-bold" style={{color:t.emerald}}>স্টুডেন্ট হিসেবে ভর্তি?</p><p className="text-xs" style={{color:t.muted}}>{confirmAction.visitor.name}</p></div>
        </div>}
        {confirmAction && <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="xs" onClick={()=>setConfirmAction(null)}>{tr("common.cancel")}</Button>
          <Button variant="primary" size="xs" onClick={()=>doConvert(confirmAction.visitor)}>{tr("common.confirm")}</Button>
        </div>}
      </Modal>

      {/* ── ডিলিট কনফার্ম মোডাল (LIST VIEW) ── */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => doDelete(deleteTarget)}
        itemName={deleteTarget?.name || ""}
      />

      {/* ══════════ NEW VISITOR MODAL ══════════ */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={tr("visitors.addNew")} size="xl">
        <NewVisitorForm onSave={async (v)=>{try{await api.post("/visitors",v);}catch(err){console.error("[Visitor Create]",err);toast.error("সার্ভারে সেভ ব্যর্থ");}setShowForm(false);toast.created("ভিজিটর");fetchVisitors();}} onCancel={()=>setShowForm(false)}/>
      </Modal>

      {/* ── টেবিল ইনসাইটস — কুইক স্ট্যাটস ও গ্রুপ বাই ── */}
      <TableInsights
        module="visitors"
        data={paginated}
        fields={VISITOR_INSIGHT_FIELDS}
        onFilter={(field, value) => setInsightFilter(value ? { field, value } : null)}
      />

      <Card delay={100}>
        <p className="text-xs font-medium mb-3" style={{color:t.textSecondary}}>{tr("common.total")}: {serverTotal} {tr("visitors.title")}{loading && ` — ${tr("common.loading")}`}</p>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr style={{borderBottom:"1px solid "+t.border}}>
          <SortHeader label={tr("common.name")} sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label={tr("common.phone")} sortKey="phone" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label={tr("students.branch")} sortKey="branch" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label={tr("students.country")} sortKey="interested_countries" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label={tr("common.status")} sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label="সোর্স" sortKey="source" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label={tr("common.date")} sortKey="date" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortHeader label={tr("visitors.followUp")} sortKey="lastFollowUp" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{color:t.muted}}>{tr("common.actions")}</th>
        </tr></thead><tbody>
          {displayData.map(v=>{
            const dc=v.interested_countries?v.interested_countries[0]:v.country;
            const mc=v.interested_countries&&v.interested_countries.length>1;
            const days=daysDiff(v.date);
            const fuD=daysDiff(v.lastFollowUp);
            const fuBad=(v.status==="Interested"||v.status==="Thinking")&&fuD>3;
            const isMenu=openMenuId===v.id;
            // ── শর্তভিত্তিক সারি রং — conditionalFormat রুল অনুযায়ী ──
            const condStyle = getRowStyle("visitors", v);
            const defaultBg = condStyle?.background || "transparent";
            return <tr key={v.id} className="cursor-pointer" style={{borderBottom:"1px solid "+t.border, background: defaultBg}}
              onMouseEnter={e=>e.currentTarget.style.background=t.hoverBg} onMouseLeave={e=>e.currentTarget.style.background=defaultBg}
              onClick={()=>setDetailId(v.id)}>
              {/* নাম */}
              <td className="py-3 px-3"><div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{background:t.cyan+"15",color:t.cyan}}>{v.name.charAt(0)}</div>
                <div><span className="font-medium block">{v.name_en || v.name}</span></div>
              </div></td>
              {/* ফোন */}
              <td className="py-3 px-3 font-mono text-[11px]" style={{color:t.textSecondary}}>{formatPhoneDisplay(v.phone)}</td>
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
              <td className="py-3 px-3"><span className="text-[10px] font-mono" style={{color:days>14?t.rose:days>7?t.amber:t.muted}}>{formatDateDisplay(v.date)} ({days}d)</span></td>
              {/* Follow-up */}
              <td className="py-3 px-3">{fuBad?<span className="text-[10px] font-semibold" style={{color:t.rose}}>বিলম্বিত</span>:v.lastFollowUp?<span className="text-[10px]" style={{color:t.emerald}}>✓ {fuD}d</span>:<span className="text-[10px]" style={{color:t.muted}}>—</span>}</td>
              {/* Action */}
              <td className="py-3 px-3" onClick={e=>e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <button onClick={()=>setDetailId(v.id)} className="px-2 py-1 rounded text-[9px] font-medium" style={{background:t.purple+"15",color:t.purple}} title="বিস্তারিত দেখুন">👁 বিস্তারিত</button>
                  {(v.status==="Interested"||v.status==="Thinking")&&<button onClick={()=>markFollowUp(v.id)} className="px-2 py-1 rounded text-[9px] font-medium" style={{background:t.cyan+"15",color:t.cyan}} title="ফলো-আপ সম্পন্ন">📞</button>}
                  {v.status!=="Not Interested"&&<button onClick={()=>setConfirmAction({type:"convert",visitor:v})} className="px-2 py-1 rounded text-[9px] font-medium" style={{background:t.emerald+"15",color:t.emerald}}>🎓 ভর্তি</button>}
                </div>
              </td>
            </tr>;
          })}
        </tbody></table></div>
        {paginated.length===0&&!loading&&<div className="flex flex-col items-center py-12 opacity-40"><p className="text-sm">{tr("common.noData")}</p></div>}
        <Pagination total={serverTotal} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </Card>

      {/* ── ExportModal — কলাম নির্বাচন করে CSV এক্সপোর্ট ── */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        columns={VISITOR_EXPORT_COLUMNS}
        data={exportModalData}
        fileName="Visitors"
        onExport={(count) => toast.exported(`Visitors (${count} records)`)}
      />
    </div>
  );
}
