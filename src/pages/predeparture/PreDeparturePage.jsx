import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, Calendar, ChevronRight, Check, Save, ArrowLeft, Filter, Upload, Download, Trash2, Paperclip , AlertTriangle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { preDeparture, API_URL } from "../../lib/api";

/**
 * PreDeparturePage — Country-specific Pre-Departure & VFS Tracking
 *
 * Japan: COE → Health → Tuition → VFS → Visa → Flight
 * Germany: Admission → Blocked Account → Insurance → VFS → Visa → Flight
 * Korea: Admission/TOPIK → D-4 Visa → Health → Flight → Arrival+ARC
 *
 * API থেকে real data — COE+ stage-এ থাকা students
 */

// ═══════════════════════════════════════════════════════
// দেশভিত্তিক স্টেপ কনফিগ — প্রতিটি দেশের জন্য আলাদা ধাপ
// ═══════════════════════════════════════════════════════
const COUNTRY_STEPS = {
  Japan: [
    { key: "coe", label: "সিওই", label_en: "COE Received", label_native: "在留資格認定証明書", icon: "📄" },
    { key: "health", label: "হেলথ", label_en: "Health Checkup", label_native: "健康診断", icon: "🏥" },
    { key: "tuition", label: "টিউশন", label_en: "Tuition Remittance", label_native: "学費送金", icon: "💰" },
    { key: "vfs", label: "ভিএফএস", label_en: "VFS Application", label_native: "VFS申請", icon: "🏢" },
    { key: "visa", label: "ভিসা", label_en: "Visa Result", label_native: "ビザ結果", icon: "🛂" },
    { key: "flight", label: "ফ্লাইট", label_en: "Flight & Arrival", label_native: "渡航・到着", icon: "✈️" },
  ],
  Germany: [
    { key: "admission", label: "অ্যাডমিশন", label_en: "Admission Letter", label_native: "Zulassungsbescheid", icon: "📄" },
    { key: "blocked_account", label: "ব্লকড একাউন্ট", label_en: "Blocked Account (€11,208)", label_native: "Sperrkonto", icon: "🏦" },
    { key: "insurance", label: "স্বাস্থ্য বীমা", label_en: "Health Insurance", label_native: "Krankenversicherung", icon: "🛡️" },
    { key: "vfs", label: "ভিএফএস/দূতাবাস", label_en: "VFS/Embassy Application", icon: "🏢" },
    { key: "visa", label: "ভিসা", label_en: "Visa Result", icon: "🛂" },
    { key: "flight", label: "ফ্লাইট", label_en: "Flight & Arrival", icon: "✈️" },
  ],
  Korea: [
    { key: "admission_topik", label: "অ্যাডমিশন/TOPIK", label_en: "Admission/TOPIK Score", label_native: "입학/TOPIK", icon: "📄" },
    { key: "d4_visa", label: "D-4 ভিসা", label_en: "D-4 Visa Application", icon: "🛂" },
    { key: "health", label: "হেলথ", label_en: "Health Checkup", icon: "🏥" },
    { key: "flight", label: "ফ্লাইট", label_en: "Flight Booking", icon: "✈️" },
    { key: "arrival_arc", label: "ARC কার্ড", label_en: "Arrival & ARC Card", label_native: "외국인등록증", icon: "🪪" },
  ],
};

// দেশের ব্যাজ রঙ ও ফ্ল্যাগ কনফিগ
const COUNTRY_CONFIG = {
  Japan: { flag: "🇯🇵", label: "জাপান", color: "#e74c3c" },
  Germany: { flag: "🇩🇪", label: "জার্মানি", color: "#f1c40f" },
  Korea: { flag: "🇰🇷", label: "কোরিয়া", color: "#3498db" },
};

// ═══════════════════════════════════════════════════════
// স্টুডেন্টের country অনুযায়ী steps নির্ধারণ
// ═══════════════════════════════════════════════════════

// DEFAULT_CHECKLISTS — নতুন student-এর জন্য ডিফল্ট checklist items
const DEFAULT_CHECKLISTS = {
  coe: [{ id: 1, text: "স্কুল থেকে COE কপি পাওয়া হয়েছে", done: false }, { id: 2, text: "COE নম্বর যাচাই করা হয়েছে", done: false }],
  health: [{ id: 1, text: "হাসপাতালে অ্যাপয়েন্টমেন্ট নেওয়া হয়েছে", done: false }, { id: 2, text: "হেলথ চেকআপ সম্পন্ন", done: false }, { id: 3, text: "হেলথ রিপোর্ট পাওয়া হয়েছে", done: false }],
  tuition: [{ id: 1, text: "স্কুলের সাথে টিউশন পরিমাণ নিশ্চিত", done: false }, { id: 2, text: "ব্যাংক রেমিটেন্স সম্পন্ন", done: false }, { id: 3, text: "রেমিটেন্স রিসিপ্ট পাওয়া হয়েছে", done: false }],
  vfs: [{ id: 1, text: "VFS অ্যাপয়েন্টমেন্ট নেওয়া হয়েছে", done: false }, { id: 2, text: "সব ডকুমেন্ট প্রস্তুত ও চেক করা হয়েছে", done: false }, { id: 3, text: "VFS সেন্টারে ডকুমেন্ট জমা দেওয়া হয়েছে", done: false }, { id: 4, text: "VFS ট্র্যাকিং নম্বর পাওয়া হয়েছে", done: false }],
  visa: [{ id: 1, text: "ভিসা আবেদন জমা দেওয়া হয়েছে", done: false }, { id: 2, text: "ভিসা ইন্টারভিউ সম্পন্ন (প্রয়োজনে)", done: false }, { id: 3, text: "ভিসার ফলাফল পাওয়া হয়েছে", done: false }],
  flight: [{ id: 1, text: "ফ্লাইট টিকেট বুক করা হয়েছে", done: false }, { id: 2, text: "এয়ারপোর্ট পিকআপ ব্যবস্থা করা হয়েছে", done: false }, { id: 3, text: "প্রি-ডিপার্চার ওরিয়েন্টেশন সম্পন্ন", done: false }],
  admission: [{ id: 1, text: "অ্যাডমিশন লেটার প্রাপ্তি", done: false }, { id: 2, text: "লেটার যাচাই সম্পন্ন", done: false }],
  blocked_account: [{ id: 1, text: "ব্লকড একাউন্ট খোলা হয়েছে", done: false }, { id: 2, text: "নির্ধারিত পরিমাণ জমা দেওয়া হয়েছে", done: false }, { id: 3, text: "একাউন্ট কনফার্মেশন পাওয়া হয়েছে", done: false }],
  insurance: [{ id: 1, text: "বীমা কোম্পানি নির্বাচন", done: false }, { id: 2, text: "বীমা কেনা সম্পন্ন", done: false }, { id: 3, text: "বীমা সার্টিফিকেট পাওয়া হয়েছে", done: false }],
  admission_topik: [{ id: 1, text: "TOPIK পরীক্ষা দেওয়া হয়েছে", done: false }, { id: 2, text: "অ্যাডমিশন আবেদন জমা দেওয়া হয়েছে", done: false }, { id: 3, text: "অ্যাডমিশন লেটার পাওয়া হয়েছে", done: false }],
  d4_visa: [{ id: 1, text: "D-4 ভিসা আবেদন জমা দেওয়া হয়েছে", done: false }, { id: 2, text: "ভিসা পাওয়া হয়েছে", done: false }],
  arrival_arc: [{ id: 1, text: "এয়ারপোর্টে পৌঁছেছে", done: false }, { id: 2, text: "ARC কার্ড আবেদন করা হয়েছে", done: false }, { id: 3, text: "ARC কার্ড পাওয়া হয়েছে", done: false }],
};

function getNextDeadlineInfo(deadlines, countrySteps) {
  if (!deadlines || typeof deadlines !== "object") return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const labelMap = {}; if (countrySteps) countrySteps.forEach(s => { labelMap[s.key] = s.label; });
  let nearest = null;
  for (const [step, dateStr] of Object.entries(deadlines)) {
    if (!dateStr) continue;
    const d = new Date(dateStr); d.setHours(0,0,0,0);
    const diff = Math.round((d - today) / 86400000);
    if (!nearest) { nearest = { step, diff, label: labelMap[step] || step }; }
    else if (diff < 0 && nearest.diff >= 0) { nearest = { step, diff, label: labelMap[step] || step }; }
    else if (diff < 0 && nearest.diff < 0 && diff > nearest.diff) { nearest = { step, diff, label: labelMap[step] || step }; }
    else if (diff >= 0 && nearest.diff >= 0 && diff < nearest.diff) { nearest = { step, diff, label: labelMap[step] || step }; }
  }
  return nearest;
}

function DeadlineBadge({ deadlines, countrySteps, t }) {
  const info = getNextDeadlineInfo(deadlines, countrySteps);
  if (!info) return null;
  if (info.diff < 0) return <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${t.rose}15`, color: t.rose }}>{info.label} {Math.abs(info.diff)} দিন ওভারডিউ!</span>;
  if (info.diff === 0) return <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${t.amber}15`, color: t.amber }}>{info.label} আজ ডেডলাইন!</span>;
  if (info.diff <= 7) return <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${t.amber}15`, color: t.amber }}>{info.label} {info.diff} দিনে</span>;
  return null;
}

const getStepsForStudent = (student) => {
  const country = student?.country || "Japan";
  return COUNTRY_STEPS[country] || COUNTRY_STEPS["Japan"];
};

// ═══════════════════════════════════════════════════════
// স্টুডেন্টের country অনুযায়ী step done কিনা চেক
// ═══════════════════════════════════════════════════════
const isStepDone = (st, stepKey) => {
  switch (stepKey) {
    // Japan steps
    case "coe": return !!st.coe?.number;
    case "health": return st.health?.status === "done";
    case "tuition": return !!st.tuition?.remitted;
    case "vfs": return !!st.vfs?.docsSubmitted;
    case "visa": return ["granted", "VISA_GRANTED", "ARRIVED", "COMPLETED"].includes(st.visa?.status) || ["VISA_GRANTED", "ARRIVED", "COMPLETED"].includes(st.status);
    case "flight": return !!st.flight?.date;
    // Germany steps
    case "admission": return st.admissionLetter?.status === "done";
    case "blocked_account": return st.blockedAccount?.status === "done";
    case "insurance": return st.insurance?.status === "done";
    // Korea steps
    case "admission_topik": return st.admissionTopik?.status === "done";
    case "d4_visa": return st.d4Visa?.status === "done";
    case "arrival_arc": return st.arcCard?.status === "done";
    default: return false;
  }
};

export default function PreDeparturePage() {
  const t = useTheme();
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [kpi, setKpi] = useState({ total: 0, visaGranted: 0, healthPending: 0, vfsPending: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  // দেশ ফিল্টার — সব / Japan / Germany / Korea
  const [countryFilter, setCountryFilter] = useState("");

  // ── API থেকে data লোড ──
  const loadData = async () => {
    try {
      const res = await preDeparture.list();
      setStudents(res.students || []);
      setKpi(res.kpi || {});
    } catch (err) {
      console.error("Pre-departure load error:", err);
      toast.error("প্রি-ডিপার্চার ডাটা লোড করতে সমস্যা হয়েছে");
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // দেশ ফিল্টার প্রয়োগ
  const filtered = countryFilter
    ? students.filter(st => (st.country || "Japan") === countryFilter)
    : students;

  // ── Detail View ──
  if (selectedStudent) {
    return (
      <DepartureDetail
        student={selectedStudent}
        onBack={() => { setSelectedStudent(null); loadData(); }}
        t={t}
        toast={toast}
      />
    );
  }

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">প্রি-ডিপার্চার ও ভিএফএস</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>দেশভিত্তিক প্রি-ডিপার্চার ট্র্যাকিং — জাপান, জার্মানি, কোরিয়া</p>
        </div>
        {/* দেশ ফিল্টার */}
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: t.muted }} />
          <select
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs outline-none"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
          >
            <option value="">সব দেশ</option>
            <option value="Japan">🇯🇵 জাপান</option>
            <option value="Germany">🇩🇪 জার্মানি</option>
            <option value="Korea">🇰🇷 কোরিয়া</option>
          </select>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "COE+ স্টুডেন্ট", value: kpi.total, color: t.cyan, icon: FileText },
          { label: "ভিসা পেয়েছে", value: kpi.visaGranted, color: t.emerald, icon: CheckCircle },
          { label: "হেলথ বাকি", value: kpi.healthPending, color: t.amber, icon: Clock },
          { label: "ভিএফএস বাকি", value: kpi.vfsPending, color: t.rose, icon: Calendar },
          { label: "ওভারডিউ", value: kpi.overdue || 0, color: t.rose, icon: AlertTriangle },
        ].map((k, i) => (
          <Card key={i} delay={i * 50}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{k.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
              </div>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15` }}>
                <k.icon size={16} style={{ color: k.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Student List — দেশভিত্তিক steps সহ */}
      {loading ? (
        <Card><div className="py-10 text-center text-xs" style={{ color: t.muted }}>লোড হচ্ছে...</div></Card>
      ) : filtered.length === 0 ? (
        <Card><div className="py-10 text-center text-xs" style={{ color: t.muted }}>
          {countryFilter ? `${COUNTRY_CONFIG[countryFilter]?.label || countryFilter} — কোনো স্টুডেন্ট নেই` : "COE+ পর্যায়ে কোনো স্টুডেন্ট নেই"}
        </div></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((st, i) => {
            // দেশ অনুযায়ী dynamic steps
            const countrySteps = getStepsForStudent(st);
            const steps = countrySteps.map(step => ({
              ...step,
              done: isStepDone(st, step.key),
            }));
            const completedSteps = steps.filter(s => s.done).length;
            const pct = Math.round((completedSteps / steps.length) * 100);
            const countryInfo = COUNTRY_CONFIG[st.country] || COUNTRY_CONFIG.Japan;

            return (
              <Card key={st.id} delay={150 + i * 60}
                className="cursor-pointer group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 !p-4"
                onClick={() => setSelectedStudent(st)}>
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                    {(st.name || st.name_en || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold group-hover:text-cyan-400 transition">{st.name || st.name_en}</p>
                      {/* দেশের ব্যাজ */}
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                        style={{ background: `${countryInfo.color}18`, color: countryInfo.color, border: `1px solid ${countryInfo.color}30` }}>
                        {countryInfo.flag} {countryInfo.label}
                      </span>
                      <Badge color={
                        ["VISA_GRANTED","ARRIVED","COMPLETED"].includes(st.status) ? t.emerald
                        : st.status === "VISA_APPLIED" ? t.purple
                        : t.amber
                      } size="xs">
                        {st.status === "VISA_GRANTED" ? "ভিসা পেয়েছে" : st.status === "ARRIVED" ? "পৌঁছেছে"
                          : st.status === "COMPLETED" ? "সম্পন্ন" : "COE পেয়েছে"}
                      </Badge>
                      <DeadlineBadge deadlines={st.deadlines} countrySteps={getStepsForStudent(st)} t={t} />
                    </div>
                    <p className="text-[10px]" style={{ color: t.muted }}>{st.school} • {st.batch}{st.coe?.number ? ` • COE: ${st.coe.number}` : ""}</p>
                    {/* দেশভিত্তিক dynamic step indicators */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {steps.map((step, j) => (
                        <div key={j} className="flex items-center gap-1 text-[9px]" style={{ color: step.done ? t.emerald : t.muted }}>
                          <span>{step.icon}</span>
                          <span className="hidden sm:inline">{step.label}</span>
                          {step.done ? <Check size={9} /> : <Clock size={9} />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold" style={{ color: pct === 100 ? t.emerald : pct >= 50 ? t.amber : t.muted }}>{pct}%</p>
                    <p className="text-[9px]" style={{ color: t.muted }}>{completedSteps}/{steps.length}</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 transition-transform group-hover:translate-x-1" style={{ color: t.muted }} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DepartureDetail — student-এর বিস্তারিত pre-departure info + edit
// দেশভিত্তিক dynamic sections রেন্ডার
// ═══════════════════════════════════════════════════════
function DepartureDetail({ student: st, onBack, t, toast }) {
  const country = st.country || "Japan";
  const countryInfo = COUNTRY_CONFIG[country] || COUNTRY_CONFIG.Japan;
  const countrySteps = getStepsForStudent(st);

  // ── দেশ অনুযায়ী initial form state তৈরি ──
  const buildInitialForm = () => {
    const base = {
      notes: st.notes || "",
      // Common fields (Japan-এ ব্যবহৃত, অন্য দেশেও shared fields)
      vfs_appointment_date: st.vfs?.appointmentDate || "",
      vfs_docs_submitted: st.vfs?.docsSubmitted || false,
      visa_status: st.visa?.status || "pending",
      visa_date: st.visa?.date || "",
      visa_expiry: st.visa?.expiry || "",
      flight_date: st.flight?.date || "",
      flight_number: st.flight?.number || "",
      arrival_confirmed: st.arrivalConfirmed || false,
    };

    if (country === "Japan") {
      return {
        ...base,
        coe_number: st.coe?.number || "",
        coe_date: st.coe?.date || "",
        health_status: st.health?.status || "pending",
        health_date: st.health?.date || "",
        health_notes: st.health?.notes || "",
        tuition_amount: st.tuition?.amount || 0,
        tuition_remitted: st.tuition?.remitted || false,
        tuition_date: st.tuition?.date || "",
      };
    }

    if (country === "Germany") {
      return {
        ...base,
        admission_letter_status: st.admissionLetter?.status || "pending",
        admission_letter_date: st.admissionLetter?.date || "",
        blocked_account_status: st.blockedAccount?.status || "pending",
        blocked_account_date: st.blockedAccount?.date || "",
        blocked_account_amount: st.blockedAccount?.amount || 0,
        insurance_status: st.insurance?.status || "pending",
        insurance_date: st.insurance?.date || "",
        insurance_provider: st.insurance?.provider || "",
      };
    }

    if (country === "Korea") {
      return {
        ...base,
        admission_topik_status: st.admissionTopik?.status || "pending",
        admission_topik_date: st.admissionTopik?.date || "",
        admission_topik_score: st.admissionTopik?.score || "",
        d4_visa_status: st.d4Visa?.status || "pending",
        d4_visa_date: st.d4Visa?.date || "",
        health_status: st.health?.status || "pending",
        health_date: st.health?.date || "",
        health_notes: st.health?.notes || "",
        arc_card_status: st.arcCard?.status || "pending",
        arc_card_date: st.arcCard?.date || "",
      };
    }

    // Fallback — Japan-like
    return { ...base };
  };

  const [form, setForm] = useState(buildInitialForm);
  const [saving, setSaving] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState(0);

  const [checklists, setChecklists] = useState(() => {
    const existing = st.checklists || {};
    const merged = {};
    for (const key of countrySteps.map(s => s.key)) {
      if (existing[key] && existing[key].length > 0) merged[key] = existing[key];
      else if (DEFAULT_CHECKLISTS[key]) merged[key] = DEFAULT_CHECKLISTS[key].map(item => ({ ...item }));
      else merged[key] = [];
    }
    return merged;
  });
  const [deadlines, setDeadlines] = useState(st.deadlines || {});
  const [newCheckItem, setNewCheckItem] = useState({});
  const toggleCheckItem = (step, idx) => { setChecklists(prev => { const u = { ...prev }; u[step] = [...(prev[step] || [])]; u[step][idx] = { ...u[step][idx], done: !u[step][idx].done }; return u; }); };
  const addCheckItem = (step) => { const text = (newCheckItem[step] || "").trim(); if (!text) return; setChecklists(prev => { const u = { ...prev }; const items = [...(prev[step] || [])]; const maxId = items.reduce((m, it) => Math.max(m, it.id || 0), 0); items.push({ id: maxId + 1, text, done: false }); u[step] = items; return u; }); setNewCheckItem(prev => ({ ...prev, [step]: "" })); };
  const removeCheckItem = (step, idx) => { setChecklists(prev => { const u = { ...prev }; u[step] = [...(prev[step] || [])]; u[step].splice(idx, 1); return u; }); };
  const setDeadlineFn = (step, value) => { setDeadlines(prev => ({ ...prev, [step]: value || null })); };
  const isOverdue = (dateStr) => { if (!dateStr) return false; const today = new Date(); today.setHours(0,0,0,0); return new Date(dateStr) < today; };


  // ── ফাইল আপলোড state ──
  const [files, setFiles] = useState(st.files || []);
  const [uploading, setUploading] = useState(null); // কোন step-এ uploading চলছে
  const [deleteConfirm, setDeleteConfirm] = useState(null); // মুছে ফেলার confirm

  // ── ফাইল আপলোড handler ──
  const handleFileUpload = async (stepKey, file) => {
    if (!file) return;
    // সর্বোচ্চ 10MB চেক
    if (file.size > 10 * 1024 * 1024) {
      toast.error("ফাইল সাইজ সর্বোচ্চ 10MB");
      return;
    }
    setUploading(stepKey);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("step", stepKey);
      const res = await preDeparture.uploadFile(st.id, formData);
      setFiles(res.files || []);
      toast.success("ফাইল আপলোড হয়েছে");
    } catch (err) {
      toast.error(err.message || "আপলোড ব্যর্থ");
    }
    setUploading(null);
  };

  // ── ফাইল ডিলিট handler ──
  const handleFileDelete = async (fileId) => {
    try {
      const res = await preDeparture.deleteFile(st.id, fileId);
      setFiles(res.files || []);
      toast.success("ফাইল মুছে ফেলা হয়েছে");
    } catch (err) {
      toast.error(err.message || "মুছতে সমস্যা হয়েছে");
    }
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await preDeparture.update(st.id, { ...form, checklists, deadlines });
      toast.success("ডিপার্চার তথ্য সেভ হয়েছে");
    } catch (err) {
      toast.error(err.message || "সেভ করতে সমস্যা হয়েছে");
    }
    setSaving(false);
  };

  const inputStyle = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  // ── 3-option status select (pending/in-progress/done) ──
  const statusOptions = [
    { value: "pending", label: "বাকি" },
    { value: "in-progress", label: "চলমান" },
    { value: "done", label: "সম্পন্ন" },
  ];

  // ── দেশভিত্তিক sections builder ──
  const buildSections = () => {
    if (country === "Japan") {
      return [
        {
          stepKey: "coe", icon: "📄", title: "সিওই তথ্য", subtitle: "在留資格認定証明書", color: t.cyan, step: "coe",
          fields: [
            { key: "coe_number", label: "COE নম্বর", type: "text" },
            { key: "coe_date", label: "COE প্রাপ্তির তারিখ", type: "date" },
          ],
        },
        {
          stepKey: "health", icon: "🏥", title: "হেলথ টেস্ট", subtitle: "健康診断", color: t.emerald, step: "health",
          fields: [
            { key: "health_status", label: "স্ট্যাটাস", type: "select", options: [
              { value: "pending", label: "বাকি" }, { value: "scheduled", label: "তারিখ নির্ধারিত" }, { value: "done", label: "সম্পন্ন" },
            ]},
            { key: "health_date", label: "তারিখ", type: "date" },
            { key: "health_notes", label: "নোট", type: "text" },
          ],
        },
        {
          stepKey: "tuition", icon: "💰", title: "টিউশন রেমিটেন্স", subtitle: "学費送金", color: t.amber, step: "tuition",
          fields: [
            { key: "tuition_amount", label: "পরিমাণ (JPY)", type: "number" },
            { key: "tuition_remitted", label: "পাঠানো হয়েছে", type: "checkbox" },
            { key: "tuition_date", label: "পাঠানোর তারিখ", type: "date" },
          ],
        },
        {
          stepKey: "vfs", icon: "🏢", title: "ভিএফএস আবেদন", subtitle: "VFS申請", color: t.purple, step: "vfs",
          fields: [
            { key: "vfs_appointment_date", label: "অ্যাপয়েন্টমেন্ট তারিখ", type: "date" },
            { key: "vfs_docs_submitted", label: "ডকুমেন্ট জমা দেওয়া হয়েছে", type: "checkbox" },
          ],
        },
        {
          stepKey: "visa", icon: "🛂", title: "ভিসা", subtitle: "ビザ結果", color: t.emerald, step: "visa",
          fields: [
            { key: "visa_status", label: "স্ট্যাটাস", type: "select", options: [
              { value: "pending", label: "অপেক্ষমাণ" }, { value: "applied", label: "আবেদন করা হয়েছে" }, { value: "granted", label: "পেয়েছে" }, { value: "rejected", label: "প্রত্যাখ্যাত" },
            ]},
            { key: "visa_date", label: "ভিসার তারিখ", type: "date" },
            { key: "visa_expiry", label: "মেয়াদ শেষ", type: "date" },
          ],
        },
        {
          stepKey: "flight", icon: "✈️", title: "ফ্লাইট", subtitle: "渡航・到着", color: t.cyan, step: "flight",
          fields: [
            { key: "flight_date", label: "ফ্লাইট তারিখ", type: "date" },
            { key: "flight_number", label: "ফ্লাইট নম্বর", type: "text" },
            { key: "arrival_confirmed", label: "পৌঁছেছে (confirmed)", type: "checkbox" },
          ],
        },
      ];
    }

    if (country === "Germany") {
      return [
        {
          stepKey: "admission", icon: "📄", title: "অ্যাডমিশন লেটার", subtitle: "Zulassungsbescheid", color: t.cyan, step: "admission",
          fields: [
            { key: "admission_letter_status", label: "স্ট্যাটাস", type: "select", options: statusOptions },
            { key: "admission_letter_date", label: "প্রাপ্তির তারিখ", type: "date" },
          ],
        },
        {
          stepKey: "blocked_account", icon: "🏦", title: "ব্লকড একাউন্ট", subtitle: "Sperrkonto — €11,208", color: t.amber,
          step: "blocked_account",
          fields: [
            { key: "blocked_account_status", label: "স্ট্যাটাস", type: "select", options: statusOptions },
            { key: "blocked_account_amount", label: "জমা পরিমাণ (€)", type: "number" },
            { key: "blocked_account_date", label: "জমা তারিখ", type: "date" },
          ],
        },
        {
          stepKey: "insurance", icon: "🛡️", title: "স্বাস্থ্য বীমা", subtitle: "Krankenversicherung", color: t.emerald, step: "insurance",
          fields: [
            { key: "insurance_status", label: "স্ট্যাটাস", type: "select", options: statusOptions },
            { key: "insurance_provider", label: "বীমা কোম্পানি", type: "text" },
            { key: "insurance_date", label: "তারিখ", type: "date" },
          ],
        },
        {
          stepKey: "vfs", icon: "🏢", title: "ভিএফএস/দূতাবাস আবেদন", color: t.purple, step: "vfs",
          fields: [
            { key: "vfs_appointment_date", label: "অ্যাপয়েন্টমেন্ট তারিখ", type: "date" },
            { key: "vfs_docs_submitted", label: "ডকুমেন্ট জমা দেওয়া হয়েছে", type: "checkbox" },
          ],
        },
        {
          stepKey: "visa", icon: "🛂", title: "ভিসা", color: t.emerald, step: "visa",
          fields: [
            { key: "visa_status", label: "স্ট্যাটাস", type: "select", options: [
              { value: "pending", label: "অপেক্ষমাণ" }, { value: "applied", label: "আবেদন করা হয়েছে" }, { value: "granted", label: "পেয়েছে" }, { value: "rejected", label: "প্রত্যাখ্যাত" },
            ]},
            { key: "visa_date", label: "ভিসার তারিখ", type: "date" },
            { key: "visa_expiry", label: "মেয়াদ শেষ", type: "date" },
          ],
        },
        {
          stepKey: "flight", icon: "✈️", title: "ফ্লাইট", color: t.cyan, step: "flight",
          fields: [
            { key: "flight_date", label: "ফ্লাইট তারিখ", type: "date" },
            { key: "flight_number", label: "ফ্লাইট নম্বর", type: "text" },
            { key: "arrival_confirmed", label: "পৌঁছেছে (confirmed)", type: "checkbox" },
          ],
        },
      ];
    }

    if (country === "Korea") {
      return [
        {
          stepKey: "admission_topik", icon: "📄", title: "অ্যাডমিশন / TOPIK", subtitle: "입학/TOPIK", color: t.cyan, step: "admission_topik",
          fields: [
            { key: "admission_topik_status", label: "স্ট্যাটাস", type: "select", options: statusOptions },
            { key: "admission_topik_score", label: "TOPIK স্কোর/লেভেল", type: "text" },
            { key: "admission_topik_date", label: "তারিখ", type: "date" },
          ],
        },
        {
          stepKey: "d4_visa", icon: "🛂", title: "D-4 ভিসা আবেদন", color: t.purple, step: "d4_visa",
          fields: [
            { key: "d4_visa_status", label: "স্ট্যাটাস", type: "select", options: statusOptions },
            { key: "d4_visa_date", label: "আবেদন তারিখ", type: "date" },
          ],
        },
        {
          stepKey: "health", icon: "🏥", title: "হেলথ চেকআপ", color: t.emerald, step: "health",
          fields: [
            { key: "health_status", label: "স্ট্যাটাস", type: "select", options: [
              { value: "pending", label: "বাকি" }, { value: "scheduled", label: "তারিখ নির্ধারিত" }, { value: "done", label: "সম্পন্ন" },
            ]},
            { key: "health_date", label: "তারিখ", type: "date" },
            { key: "health_notes", label: "নোট", type: "text" },
          ],
        },
        {
          stepKey: "flight", icon: "✈️", title: "ফ্লাইট বুকিং", color: t.amber, step: "flight",
          fields: [
            { key: "flight_date", label: "ফ্লাইট তারিখ", type: "date" },
            { key: "flight_number", label: "ফ্লাইট নম্বর", type: "text" },
          ],
        },
        {
          stepKey: "arrival_arc", icon: "🪪", title: "পৌঁছানো ও ARC কার্ড", subtitle: "외국인등록증", color: t.cyan, step: "arrival_arc",
          fields: [
            { key: "arc_card_status", label: "স্ট্যাটাস", type: "select", options: statusOptions },
            { key: "arc_card_date", label: "ARC কার্ড তারিখ", type: "date" },
            { key: "arrival_confirmed", label: "পৌঁছেছে (confirmed)", type: "checkbox" },
          ],
        },
      ];
    }

    // Fallback — empty sections
    return [];
  };

  const sections = buildSections();

  // ── Progress bar — dynamic steps অনুযায়ী ──
  const progressSteps = countrySteps.map(step => ({
    ...step,
    done: isStepDone({ ...st, ...formToStudentShape(form, country) }, step.key),
  }));
  const completedCount = progressSteps.filter(s => s.done).length;
  const progressPct = Math.round((completedCount / progressSteps.length) * 100);

  return (
    <div className="space-y-5 anim-fade">
      {/* হেডার — দেশের ফ্ল্যাগ সহ */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:opacity-80" style={{ background: `${t.cyan}15` }}>
          <ArrowLeft size={16} style={{ color: t.cyan }} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold">{st.name || st.name_en}</h2>
            <span className="text-xs px-2 py-0.5 rounded-md font-medium"
              style={{ background: `${countryInfo.color}18`, color: countryInfo.color, border: `1px solid ${countryInfo.color}30` }}>
              {countryInfo.flag} {countryInfo.label}
            </span>
          </div>
          <p className="text-xs" style={{ color: t.muted }}>{st.school} • {st.batch} • {st.status}</p>
        </div>
      </div>

      {/* Progress Bar — দেশভিত্তিক steps */}
      <Card delay={50}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold">অগ্রগতি</p>
          <p className="text-sm font-bold" style={{ color: progressPct === 100 ? t.emerald : progressPct >= 50 ? t.amber : t.muted }}>
            {progressPct}% ({completedCount}/{progressSteps.length})
          </p>
        </div>
        {/* Step indicator bar */}
        <div className="flex items-center gap-1 mb-3">
          {progressSteps.map((step, idx) => (
            <div key={idx} className="flex-1 h-2 rounded-full transition-all duration-500"
              style={{ background: step.done ? t.emerald : `${t.muted}30` }} />
          ))}
        </div>
        {/* Step labels */}
        <div className="flex items-center gap-2 flex-wrap">
          {progressSteps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-1 text-[9px]"
              style={{ color: step.done ? t.emerald : t.muted }}>
              <span>{step.icon}</span>
              <span>{step.label}</span>
              {step.done ? <Check size={9} /> : <Clock size={9} />}
              {idx < progressSteps.length - 1 && <span style={{ color: t.muted }}>→</span>}
            </div>
          ))}
        </div>
      </Card>

      {/* Tab bar — প্রতিটি step এক tab */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {sections.map((sec, si) => {
          const stepDone = progressSteps[si]?.done;
          return (
            <button key={si} onClick={() => setActiveStepTab(si)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: activeStepTab === si ? t.cardSolid : "transparent",
                color: activeStepTab === si ? sec.color : t.muted,
                border: activeStepTab === si ? `1px solid ${sec.color}30` : "1px solid transparent",
              }}>
              <span>{sec.icon}</span> {sec.title}
              {stepDone && <Check size={10} style={{ color: t.emerald }} />}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      {sections[activeStepTab] && (() => {
        const sec = sections[activeStepTab];
        const stepFiles = files.filter(f => f.step === sec.stepKey);
        return (
          <Card delay={50}>
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
              <span>{sec.icon}</span> {sec.title}
            </h3>
            {sec.subtitle && (
              <p className="text-[10px] mb-3" style={{ color: t.muted }}>{sec.subtitle}</p>
            )}
            {!sec.subtitle && <div className="mb-3" />}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px]" style={{ color: t.muted }}>ডেডলাইন:</span>
              <input type="date" value={deadlines[sec.step] || ""} onChange={e => setDeadlineFn(sec.step, e.target.value)} className="px-2 py-1 rounded text-[10px] outline-none" style={inputStyle} />
              {deadlines[sec.step] && isOverdue(deadlines[sec.step]) && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${t.rose}15`, color: t.rose }}>ওভারডিউ!</span>}
            </div>
            <div className="space-y-3">
              {sec.fields.map(f => (
                <div key={f.key}>
                  {f.type === "checkbox" ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!form[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.checked }))}
                        className="rounded" />
                      <span className="text-xs" style={{ color: t.text }}>{f.label}</span>
                    </label>
                  ) : (
                    <>
                      <label className="text-[10px] font-medium mb-1 block" style={{ color: t.muted }}>{f.label}</label>
                      {f.type === "select" ? (
                        <select value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle}>
                          {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : (
                        <input type={f.type} value={form[f.key] || ""}
                          onChange={e => setForm(p => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle} />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* ── ডকুমেন্ট আপলোড সেকশন ── */}
            <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-medium flex items-center gap-1" style={{ color: t.muted }}>
                  <Paperclip size={10} /> ডকুমেন্ট ({stepFiles.length})
                </p>
                {/* Google Drive লিংক */}
                <button onClick={() => {
                  const url = prompt("Google Drive লিংক পেস্ট করুন:");
                  if (url && url.trim()) {
                    const newFile = { id: Date.now().toString(), step: sec.stepKey, name: "Google Drive Link", url: url.trim(), uploaded_at: new Date().toISOString().slice(0, 10), type: "gdrive" };
                    setFiles(prev => [...prev, newFile]);
                    preDeparture.update(st.id, { ...form, checklists, deadlines, files: [...files, newFile] }).catch(() => {});
                    toast.success("Drive লিংক যোগ হয়েছে");
                  }
                }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium hover:opacity-80 transition"
                  style={{ background: `${t.emerald}15`, color: t.emerald }}>
                  🔗 Drive Link
                </button>
              </div>

              {/* আপলোড করা ফাইল তালিকা */}
              {stepFiles.length > 0 && (
                <div className="space-y-1.5">
                  {stepFiles.map(file => (
                    <div key={file.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px]"
                      style={{ background: `${t.muted}08` }}>
                      <FileText size={12} style={{ color: sec.color }} className="shrink-0" />
                      <span className="flex-1 truncate" style={{ color: t.text }} title={file.name}>{file.name}</span>
                      <span style={{ color: t.muted }} className="shrink-0">{file.uploaded_at}</span>
                      {/* ডাউনলোড লিংক */}
                      <a href={`${API_URL.replace("/api", "")}${file.url}`} target="_blank" rel="noopener noreferrer"
                        className="p-1 rounded hover:opacity-70 shrink-0" title="ডাউনলোড">
                        <Download size={11} style={{ color: t.cyan }} />
                      </a>
                      {/* মুছে ফেলা — confirm সহ */}
                      {deleteConfirm === file.id ? (
                        <span className="flex items-center gap-1 shrink-0">
                          <button onClick={() => handleFileDelete(file.id)}
                            className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                            style={{ background: t.rose, color: "#fff" }}>হ্যাঁ</button>
                          <button onClick={() => setDeleteConfirm(null)}
                            className="text-[9px] px-1.5 py-0.5 rounded"
                            style={{ color: t.muted }}>না</button>
                        </span>
                      ) : (
                        <button onClick={() => setDeleteConfirm(file.id)}
                          className="p-1 rounded hover:opacity-70 shrink-0" title="মুছুন">
                          <Trash2 size={11} style={{ color: t.rose }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
              <p className="text-[10px] font-semibold mb-2" style={{ color: t.muted }}>চেকলিস্ট</p>
              {(checklists[sec.step] || []).map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 py-1 group/item">
                  <label className="flex items-center gap-2 flex-1 cursor-pointer"><input type="checkbox" checked={item.done} onChange={() => toggleCheckItem(sec.step, idx)} className="rounded" /><span className="text-[11px]" style={{ color: item.done ? t.muted : t.text, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span></label>
                  <button onClick={() => removeCheckItem(sec.step, idx)} className="text-[10px] opacity-0 group-hover/item:opacity-100 transition-opacity px-1" style={{ color: t.rose }} title="মুছুন">✕</button>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2">
                <input value={newCheckItem[sec.step] || ""} onChange={e => setNewCheckItem(prev => ({ ...prev, [sec.step]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") addCheckItem(sec.step); }} className="flex-1 px-2 py-1 rounded text-[10px] outline-none" style={inputStyle} placeholder="নতুন টাস্ক যোগ করুন..." />
                <button onClick={() => addCheckItem(sec.step)} className="text-[10px] px-2 py-1 rounded font-bold" style={{ color: t.cyan }}>+</button>
              </div>
              {(checklists[sec.step] || []).length > 0 && (() => { const items = checklists[sec.step]; const done = items.filter(it => it.done).length; const total = items.length; const pct = Math.round((done / total) * 100); return (<div className="mt-2 flex items-center gap-2"><div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: t.border }}><div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: pct === 100 ? t.emerald : sec.color }} /></div><span className="text-[9px]" style={{ color: t.muted }}>{done}/{total}</span></div>); })()}
            </div>
          </Card>
        );
      })()}

      {/* Notes + Save */}
      <Card delay={500}>
        <label className="text-[10px] font-medium mb-1 block" style={{ color: t.muted }}>নোট</label>
        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg text-xs outline-none h-20 resize-none" style={inputStyle}
          placeholder="অতিরিক্ত তথ্য..." />
        <div className="flex justify-end mt-3">
          <Button icon={Save} onClick={handleSave} disabled={saving}>
            {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Helper: form data থেকে student shape-এ রূপান্তর
// progress bar-এ real-time step status দেখানোর জন্য
// ═══════════════════════════════════════════════════════
function formToStudentShape(form, country) {
  const base = {
    vfs: { appointmentDate: form.vfs_appointment_date, docsSubmitted: form.vfs_docs_submitted },
    visa: { status: form.visa_status, date: form.visa_date, expiry: form.visa_expiry },
    flight: { date: form.flight_date, number: form.flight_number },
    arrivalConfirmed: form.arrival_confirmed,
  };

  if (country === "Japan") {
    return {
      ...base,
      coe: { number: form.coe_number, date: form.coe_date },
      health: { status: form.health_status, date: form.health_date, notes: form.health_notes },
      tuition: { amount: form.tuition_amount, remitted: form.tuition_remitted, date: form.tuition_date },
    };
  }

  if (country === "Germany") {
    return {
      ...base,
      admissionLetter: { status: form.admission_letter_status, date: form.admission_letter_date },
      blockedAccount: { status: form.blocked_account_status, date: form.blocked_account_date, amount: form.blocked_account_amount },
      insurance: { status: form.insurance_status, date: form.insurance_date, provider: form.insurance_provider },
    };
  }

  if (country === "Korea") {
    return {
      ...base,
      admissionTopik: { status: form.admission_topik_status, date: form.admission_topik_date, score: form.admission_topik_score },
      d4Visa: { status: form.d4_visa_status, date: form.d4_visa_date },
      health: { status: form.health_status, date: form.health_date, notes: form.health_notes },
      arcCard: { status: form.arc_card_status, date: form.arc_card_date },
    };
  }

  return base;
}
