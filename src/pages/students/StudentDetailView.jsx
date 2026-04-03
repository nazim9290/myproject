import { useState, useEffect } from "react";
import { ArrowLeft, Edit3, Save, Trash2, Check, User, FileCheck, Globe, ChevronLeft, ChevronRight, AlertTriangle, Plus, Clock, MessageSquare, CreditCard, X, LayoutDashboard, Users, GraduationCap, BookOpen, Link as LinkIcon, StickyNote, Briefcase } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PhoneInput, { formatPhoneDisplay } from "../../components/ui/PhoneInput";
import { PIPELINE_STATUSES } from "../../data/students";
import { FEE_CATEGORIES, CATEGORY_CONFIG } from "../../data/mockData";
import { api } from "../../hooks/useAPI";

// ── Pipeline step configs — prop থেকে dynamic ভাবে আসবে (Admin সেটিংস থেকে) ──
import { DEFAULT_STEPS_META } from "../../data/pipelineSteps";

// Student pipeline — COE_RECEIVED পর্যন্ত, এরপর Pre-Departure module-এ handle হয়
const STUDENT_PIPELINE_CODES = ["ENROLLED","IN_COURSE","EXAM_PASSED","DOC_COLLECTION","SCHOOL_INTERVIEW","DOC_SUBMITTED","COE_RECEIVED"];
const POST_COE_STATUSES = ["HEALTH_CHECK","TUITION_REMITTED","VFS_SCHEDULED","VISA_APPLIED","VISA_GRANTED","PRE_DEPARTURE","ARRIVED","COMPLETED"];
const MAIN_STEPS = PIPELINE_STATUSES.filter(s => STUDENT_PIPELINE_CODES.includes(s.code));
export default function StudentDetailView({ student, onBack, onUpdate, onDelete, stepConfigs, onNavigate }) {
  // stepConfigs prop থেকে dynamic checklist — না পেলে default fallback
  const STEPS_META = stepConfigs || DEFAULT_STEPS_META;
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();

  // ── ট্যাব কনফিগারেশন — i18n keys ব্যবহার করে ──
  const TABS = [
    { key: "overview", label: tr("students.overview"), icon: LayoutDashboard },
    { key: "profile", label: tr("students.profile"), icon: User },
    { key: "fees", label: tr("students.fees"), icon: CreditCard },
    { key: "sponsor", label: tr("students.sponsor"), icon: Users },
    { key: "timeline", label: tr("students.timeline"), icon: Clock },
  ];

  // ── ট্যাব স্টেট ──
  const [activeTab, setActiveTab] = useState("overview");

  // ── প্রোফাইল সেকশন-ভিত্তিক Edit স্টেট ──
  const [editSection, setEditSection] = useState(null); // "personal" | "passport" | "destination" | "internal" | null
  const [sectionForm, setSectionForm] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Dropdown options: batches, schools, branches, agents, users backend থেকে load ──
  const [batchOptions, setBatchOptions] = useState([]);
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [agentOptions, setAgentOptions] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [partnerOptions, setPartnerOptions] = useState([]);
  useEffect(() => {
    // API response normalize — কিছু endpoint { data: [...] } ফরম্যাটে দেয়
    const toArr = (res) => Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    api.get("/batches").then(r => setBatchOptions(toArr(r))).catch(() => {});
    api.get("/schools?limit=100").then(r => setSchoolOptions(toArr(r))).catch(() => {});
    api.get("/branches").then(r => setBranchOptions(toArr(r))).catch(() => {});
    api.get("/agents").then(r => setAgentOptions(toArr(r))).catch(() => {});
    api.get("/users").then(r => setStaffOptions(toArr(r))).catch(() => {});
    api.get("/partners").then(r => setPartnerOptions(toArr(r))).catch(() => {});
  }, []);

  // ── Education, JP Exams, Family — Detail API থেকে load ──
  const [education, setEducation] = useState([]);
  const [jpExams, setJpExams] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  useEffect(() => {
    // GET /students/:id — detail endpoint-এ student_education, student_jp_exams, student_family, work_experience, jp_study আসে
    api.get(`/students/${student.id}`).then(data => {
      if (data) {
        if (Array.isArray(data.student_education)) setEducation(data.student_education);
        if (Array.isArray(data.student_jp_exams)) setJpExams(data.student_jp_exams);
        if (Array.isArray(data.student_family)) setFamilyMembers(data.student_family);
        if (Array.isArray(data.work_experience)) setWorkExperience(data.work_experience);
        if (Array.isArray(data.jp_study)) setJpStudy(data.jp_study);
      }
    }).catch(() => {});
  }, [student.id]);

  // ── JP Exam যোগ/edit state ──
  const [showJpExamForm, setShowJpExamForm] = useState(false);
  const [editingJpExamId, setEditingJpExamId] = useState(null);
  const [jpExamForm, setJpExamForm] = useState({ exam_type: "JLPT", level: "", score: "", result: "", exam_date: "" });

  // ── Education যোগ/edit state ──
  const [showEduForm, setShowEduForm] = useState(false);
  const [editingEduId, setEditingEduId] = useState(null);
  const [eduForm, setEduForm] = useState({ level: "SSC", school_name: "", year: "", board: "", gpa: "", group_name: "", school_type: "", entrance_year: "", address: "" });

  // ── Work Experience state ──
  const [workExperience, setWorkExperience] = useState([]);
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [workForm, setWorkForm] = useState({ company_name: "", address: "", start_date: "", end_date: "", position: "" });

  // ── JP Study History state ──
  const [jpStudy, setJpStudy] = useState([]);
  const [showJpStudyForm, setShowJpStudyForm] = useState(false);
  const [jpStudyForm, setJpStudyForm] = useState({ institution: "", period: "", hours: "", level: "", description: "" });

  const saveEducation = async () => {
    try {
      if (editingEduId) {
        const res = await api.patch(`/students/${student.id}/education/${editingEduId}`, eduForm);
        setEducation(prev => prev.map(e => e.id === editingEduId ? { ...e, ...eduForm } : e));
      } else {
        const res = await api.post(`/students/${student.id}/education`, eduForm);
        setEducation(prev => [...prev, res]);
      }
      setShowEduForm(false);
      setEditingEduId(null);
      toast.success(editingEduId ? "আপডেট হয়েছে" : "যোগ হয়েছে");
    } catch (err) { toast.error(err.message); }
  };

  const addJpExam = async () => {
    if (!jpExamForm.exam_type) { toast.error("পরীক্ষার ধরন দিন"); return; }
    try {
      if (editingJpExamId) {
        // Update existing exam
        await api.patch(`/students/${student.id}/jp-exams/${editingJpExamId}`, jpExamForm);
        setJpExams(prev => prev.map(e => e.id === editingJpExamId ? { ...e, ...jpExamForm } : e));
        toast.success(tr("success.updated"));
      } else {
        const saved = await api.post(`/students/${student.id}/exam-result`, jpExamForm);
        setJpExams(prev => [...prev, saved || { id: `jp-${Date.now()}`, ...jpExamForm }]);
        logActivity(`JP পরীক্ষা যোগ — ${jpExamForm.exam_type} ${jpExamForm.level || ""}`, "edit");
        toast.success(tr("success.created"));
      }
      setJpExamForm({ exam_type: "JLPT", level: "", score: "", result: "", exam_date: "" });
      setEditingJpExamId(null);
      setShowJpExamForm(false);
    } catch {
      toast.error(tr("errors.saveFailed"));
    }
  };

  // ── Work Experience যোগ/মুছা — API call ──
  const saveWorkExperience = async () => {
    if (!workForm.company_name.trim()) { toast.error("প্রতিষ্ঠানের নাম দিন"); return; }
    try {
      const saved = await api.post(`/students/${student.id}/work-experience`, workForm);
      setWorkExperience(prev => [...prev, saved || { id: `we-${Date.now()}`, ...workForm }]);
      setShowWorkForm(false);
      setWorkForm({ company_name: "", address: "", start_date: "", end_date: "", position: "" });
      logActivity(`কর্ম অভিজ্ঞতা যোগ — ${workForm.company_name}`, "edit");
      toast.success("কর্ম অভিজ্ঞতা যোগ হয়েছে");
    } catch (err) { toast.error(err.message || "সার্ভারে সেভ ব্যর্থ"); }
  };

  const deleteWorkExperience = async (weId) => {
    try {
      await api.del(`/students/${student.id}/work-experience/${weId}`);
      setWorkExperience(prev => prev.filter(w => w.id !== weId));
      toast.success("মুছে ফেলা হয়েছে");
    } catch (err) { toast.error(err.message || "সার্ভারে মুছতে ব্যর্থ"); }
  };

  // ── JP Study History যোগ/মুছা — API call ──
  const saveJpStudy = async () => {
    if (!jpStudyForm.institution.trim()) { toast.error("প্রতিষ্ঠানের নাম দিন"); return; }
    try {
      const saved = await api.post(`/students/${student.id}/jp-study`, jpStudyForm);
      setJpStudy(prev => [...prev, saved || { id: `js-${Date.now()}`, ...jpStudyForm }]);
      setShowJpStudyForm(false);
      setJpStudyForm({ institution: "", period: "", hours: "", level: "", description: "" });
      logActivity(`জাপানি ভাষা শিক্ষা ইতিহাস যোগ — ${jpStudyForm.institution}`, "edit");
      toast.success("জাপানি ভাষা শিক্ষা ইতিহাস যোগ হয়েছে");
    } catch (err) { toast.error(err.message || "সার্ভারে সেভ ব্যর্থ"); }
  };

  const deleteJpStudy = async (jsId) => {
    try {
      await api.del(`/students/${student.id}/jp-study/${jsId}`);
      setJpStudy(prev => prev.filter(j => j.id !== jsId));
      toast.success("মুছে ফেলা হয়েছে");
    } catch (err) { toast.error(err.message || "সার্ভারে মুছতে ব্যর্থ"); }
  };

  const [checked, setChecked] = useState({});       // { "ENROLLED_en1": true, ... }
  const [noteText, setNoteText] = useState("");
  const [activityLog, setActivityLog] = useState([
    { time: student.created, text: `Student created — ${student.source || "Walk-in"}`, type: "create" },
  ]);
  // DB থেকে activity log load
  useEffect(() => {
    api.get(`/activity-log?record_id=${student.id}&module=students`).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const dbLogs = data.map(d => ({
          time: d.created_at ? new Date(d.created_at).toISOString().slice(0, 16).replace("T", " ") : "",
          text: d.description, type: d.action,
        }));
        setActivityLog(prev => {
          const existing = new Set(prev.map(p => p.text + p.time));
          return [...prev, ...dbLogs.filter(d => !existing.has(d.text + d.time))];
        });
      }
    }).catch(() => {});
  }, [student.id]);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // ── Portal Access ──
  const [showPortalForm, setShowPortalForm] = useState(false);
  const [portalAccess, setPortalAccess] = useState(student.portal_access || false);
  const [portalPassword, setPortalPassword] = useState("");
  const [showStepCard, setShowStepCard] = useState(false);

  // ── Sponsor state ──
  const BLANK_SPONSOR = { name: "", relationship: "Father", phone: "", address: "", nid: "", dob: "", company_name: "", company_phone: "", company_address: "", trade_license_no: "", work_address: "", tin: "", annual_income_y1: "", annual_income_y2: "", annual_income_y3: "", tax_y1: "", tax_y2: "", tax_y3: "", banks: [], tuition_jpy: "", living_jpy_monthly: "", payment_method: "Bank Transfer", exchange_rate: "", statement: "", payment_to_student: false, payment_to_school: true, sign_date: "" };
  const [sponsor, setSponsor] = useState(student.sponsor || BLANK_SPONSOR);
  const [sponsorForm, setSponsorForm] = useState(student.sponsor || BLANK_SPONSOR);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankForm, setBankForm] = useState({ bank_name: "", branch: "", account_no: "", balance: "", balance_date: "", name_in_statement: "", address_in_statement: "" });

  const saveSponsor = () => {
    setSponsor(sponsorForm);
    onUpdate({ ...student, sponsor: sponsorForm });
    setShowSponsorModal(false);
    logActivity("স্পনসর তথ্য আপডেট হয়েছে", "edit");
    toast.updated("Sponsor");
  };
  const addBank = () => {
    if (!bankForm.bank_name.trim()) { toast.error("ব্যাংকের নাম দিন"); return; }
    const updated = { ...sponsorForm, banks: [...(sponsorForm.banks || []), { id: `bk-${Date.now()}`, ...bankForm }] };
    setSponsorForm(updated);
    setSponsor(updated);
    onUpdate({ ...student, sponsor: updated });
    setBankForm({ bank_name: "", branch: "", account_no: "", balance: "", balance_date: "", name_in_statement: "", address_in_statement: "" });
    setShowAddBank(false);
    toast.success("ব্যাংক যোগ হয়েছে");
  };
  const removeBank = (id) => {
    const updated = { ...sponsorForm, banks: (sponsorForm.banks || []).filter(b => b.id !== id) };
    setSponsorForm(updated);
    setSponsor(updated);
    onUpdate({ ...student, sponsor: updated });
    toast.success("ব্যাংক মুছে ফেলা হয়েছে");
  };
  const sf = (k, v) => setSponsorForm(p => ({ ...p, [k]: v }));

  // ── Fee & Payment state — DB থেকে load ──
  const [feeItems, setFeeItems] = useState(student.fees?.items || []);
  const [payments, setPayments] = useState(student.fees?.payments || []);
  useEffect(() => {
    // DB থেকে fee items ও payments load
    api.get(`/students/${student.id}/fee-items`).then(data => {
      if (Array.isArray(data) && data.length > 0) setFeeItems(data);
    }).catch((err) => { console.error("[Fee Items Load]", err); toast.error("ফি আইটেম লোড করতে সমস্যা হয়েছে"); });
    api.get(`/students/${student.id}/payments-list`).then(data => {
      if (Array.isArray(data) && data.length > 0) setPayments(data);
    }).catch((err) => { console.error("[Payments Load]", err); toast.error("পেমেন্ট ডাটা লোড করতে সমস্যা হয়েছে"); });
  }, [student.id]);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", method: "Cash", category: "", note: "" });
  const [showFeeItemForm, setShowFeeItemForm] = useState(false);
  const [feeItemForm, setFeeItemForm] = useState({ category: "enrollment_fee", label: "", amount: "" });

  const currentStatus = student.status;
  // Post-COE student-দের জন্য pipeline-এ COE_RECEIVED পর্যন্ত complete দেখাবে
  const isPastCoe = POST_COE_STATUSES.includes(currentStatus);
  const currentStepIdx = isPastCoe
    ? MAIN_STEPS.findIndex(s => s.code === "COE_RECEIVED")
    : MAIN_STEPS.findIndex(s => s.code === currentStatus);
  const meta = STEPS_META[currentStatus] || STEPS_META.ENROLLED;
  const stepColor = PIPELINE_STATUSES.find(s => s.code === currentStatus)?.color || t.cyan;
  const isTerminal = ["CANCELLED", "PAUSED"].includes(currentStatus);

  // Checklist helpers
  const toggleCheck = (itemId) => {
    const key = `${currentStatus}_${itemId}`;
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const isChecked = (itemId) => !!checked[`${currentStatus}_${itemId}`];
  const requiredItems = meta.checklist.filter(c => c.req);
  const checkedRequired = requiredItems.filter(c => isChecked(c.id)).length;
  const allRequiredDone = checkedRequired === requiredItems.length;

  const logActivity = (text, type = "action") => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    setActivityLog(prev => [...prev, { time: now, text, type }]);
    // DB-তে activity log save
    api.post("/activity-log", { module: "students", record_id: student.id, action: type, description: text }).catch(() => {});
  };

  // Status change — API-তেও save (optimistic lock সহ)
  const changeStatus = async (newStatus, msg) => {
    try {
      const res = await api.patch(`/students/${student.id}`, { status: newStatus, updated_at: student.updated_at });
      const updated = { ...student, status: newStatus, updated_at: res?.updated_at || new Date().toISOString() };
      onUpdate(updated);
      const stepLabel = PIPELINE_STATUSES.find(s => s.code === newStatus)?.label || newStatus;
      logActivity(msg || `Status → ${stepLabel}`, "status");
      toast.success(`${stepLabel} — আপডেট হয়েছে`);
      setChecked({});
    } catch (err) {
      const errMsg = err.message || "স্ট্যাটাস সেভ ব্যর্থ";
      if (errMsg.includes("পরিবর্তন করেছে") || errMsg.includes("CONFLICT")) {
        toast.error(errMsg);
      } else {
        console.error("[Student Status Update]", err);
        toast.error("স্ট্যাটাস সার্ভারে সেভ ব্যর্থ");
      }
    }
  };

  const goNext = () => {
    if (meta.nextStatus) changeStatus(meta.nextStatus);
  };
  const goPrev = () => {
    if (currentStepIdx > 0) changeStatus(MAIN_STEPS[currentStepIdx - 1].code, "পূর্ববর্তী ধাপে ফিরে গেছে");
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    logActivity(noteText.trim(), "note");
    setNoteText("");
    toast.success("নোট যোগ হয়েছে");
  };

  // ── সেকশন-ভিত্তিক Profile save (optimistic lock সহ) ──
  const handleSectionSave = async () => {
    try {
      // শুধু ঐ সেকশনের fields পাঠাও — updated_at সহ concurrent edit check
      const res = await api.patch(`/students/${student.id}`, { ...sectionForm, updated_at: student.updated_at });
      // সফল হলে — নতুন updated_at সহ student আপডেট করো
      const updatedStudent = { ...student, ...sectionForm, updated_at: res?.updated_at || new Date().toISOString() };
      onUpdate(updatedStudent);
      setEditSection(null);
      logActivity("তথ্য আপডেট হয়েছে", "edit");
      toast.updated("Student");
    } catch (err) {
      const msg = err.message || "সেভ ব্যর্থ";
      // Conflict error — অন্য কেউ এর মধ্যে পরিবর্তন করেছে
      if (msg.includes("পরিবর্তন করেছে") || msg.includes("CONFLICT")) {
        toast.error("⚠️ " + msg);
      } else {
        console.error("[Student Save]", err);
        toast.error("সার্ভারে সেভ ব্যর্থ");
      }
    }
  };

  const logIcon = { create: "🟢", status: "🔵", action: "🟡", note: "📝", edit: "✏️", payment: "💰" };

  // Fee helpers
  /* safeNum — NaN, negative, undefined মান থেকে সুরক্ষা */
  const safeNum = (v) => { const n = Number(v); return isNaN(n) || n < 0 ? 0 : n; };
  const taka = (n) => `৳${safeNum(n).toLocaleString("en-IN")}`;
  const totalFee = feeItems.reduce((s, i) => s + safeNum(i.amount), 0);
  const totalPaid = payments.reduce((s, p) => s + safeNum(p.amount || p.paid_amount), 0);
  const balance = totalFee - totalPaid;
  const paidPercent = totalFee > 0 ? Math.min(100, (totalPaid / totalFee) * 100) : 0;

  // Per-category paid amount
  const paidByCategory = (catId) => payments.filter(p => p.category === catId).reduce((s, p) => s + safeNum(p.amount || p.paid_amount), 0);

  const syncFees = (items, pays) => {
    onUpdate({ ...student, fees: { items, payments: pays } });
  };

  const addFeeItem = async () => {
    const amount = parseInt(feeItemForm.amount, 10);
    if (!amount || amount <= 0) { toast.error("সঠিক পরিমাণ দিন"); return; }
    const catCfg = CATEGORY_CONFIG[feeItemForm.category];
    const label = feeItemForm.label.trim() || catCfg?.label || feeItemForm.category;
    let newItem = { id: `fi-${Date.now()}`, category: feeItemForm.category, label, amount };
    try {
      const saved = await api.post(`/students/${student.id}/fee-items`, { category: feeItemForm.category, label, amount });
      if (saved && saved.id) newItem = saved;
    } catch (err) { console.error("[Fee Item Save]", err); toast.error("সার্ভারে ফি সেভ ব্যর্থ"); }
    const updated = [...feeItems, newItem];
    setFeeItems(updated);
    syncFees(updated, payments);
    logActivity(`ফি খাত যোগ — ${label}: ${taka(amount)}`, "edit");
    setFeeItemForm({ category: "enrollment_fee", label: "", amount: "" });
    setShowFeeItemForm(false);
    toast.success("ফি খাত যোগ হয়েছে");
  };

  const deleteFeeItem = (itemId) => {
    const updated = feeItems.filter(i => i.id !== itemId);
    setFeeItems(updated);
    syncFees(updated, payments);
    logActivity("ফি খাত মুছে ফেলা হয়েছে", "edit");
    toast.success("ফি আইটেম মুছে ফেলা হয়েছে");
  };

  const addPayment = async () => {
    const amount = parseInt(payForm.amount, 10);
    if (!amount || amount <= 0) { toast.error("সঠিক পরিমাণ দিন"); return; }
    if (!payForm.category) { toast.error("খাত নির্বাচন করুন"); return; }
    const newP = { date: new Date().toISOString().slice(0, 10), amount, method: payForm.method, category: payForm.category, note: payForm.note };
    // API-তে save
    try {
      const saved = await api.post(`/students/${student.id}/payments`, newP);
      const updated = [...payments, saved || { id: `P-${Date.now()}`, ...newP }];
      setPayments(updated);
      syncFees(feeItems, updated);
    } catch {
      // fallback local
      const updated = [...payments, { id: `P-${Date.now()}`, ...newP }];
      setPayments(updated);
      syncFees(feeItems, updated);
    }
    const catLabel = CATEGORY_CONFIG[payForm.category]?.label || payForm.category;
    logActivity(`পেমেন্ট — ${taka(amount)} [${catLabel}] (${payForm.method})${payForm.note ? ` — ${payForm.note}` : ""}`, "payment");
    setPayForm({ amount: "", method: "Cash", category: "", note: "" });
    setShowPayForm(false);
    toast.success("পেমেন্ট যোগ হয়েছে");
  };

  const deletePayment = (pid) => {
    const updated = payments.filter(p => p.id !== pid);
    setPayments(updated);
    syncFees(feeItems, updated);
    logActivity("পেমেন্ট এন্ট্রি মুছে ফেলা হয়েছে", "edit");
    toast.success("মুছে ফেলা হয়েছে");
  };

  // ── Timeline helper — combined events ──
  const TL_COLORS = { create: t.emerald, status: t.cyan, payment: t.purple, note: t.amber, edit: t.muted, action: t.muted };
  const buildTimeline = () => {
    const feeEvents = payments.map(p => ({
      time: p.date + " 00:00",
      text: `পেমেন্ট — ৳${Number(p.amount).toLocaleString("en-IN")} [${p.category}] (${p.method})${p.note ? ` — ${p.note}` : ""}`,
      type: "payment"
    }));
    return [...activityLog, ...feeEvents].sort((a, b) => b.time.localeCompare(a.time));
  };

  // ── Personal fields config — label i18n key দিয়ে (ভাষা সেটিং অনুযায়ী পরিবর্তন হবে) ──
  const personalFields = [
    { label: tr("students.f_fullName"), key: "name_en" },
    { label: tr("students.f_nameKatakana"), key: "name_katakana" },
    { label: tr("students.f_dob"), key: "dob", type: "date" },
    { label: tr("students.f_gender"), key: "gender", type: "select", options: ["Male","Female","Other"] },
    { label: tr("students.f_maritalStatus"), key: "marital_status", type: "select", options: ["Single","Married","Divorced","Widowed"] },
    { label: tr("students.f_nationality"), key: "nationality" },
    { label: tr("students.f_bloodGroup"), key: "blood_group", type: "select", options: ["","A+","A-","B+","B-","AB+","AB-","O+","O-"] },
    { label: tr("students.f_phone"), key: "phone", type: "phone" },
    { label: tr("students.f_whatsapp"), key: "whatsapp", type: "phone" },
    { label: tr("students.f_email"), key: "email" },
    { label: tr("students.f_nid"), key: "nid" },
    { label: tr("students.f_currentAddress"), key: "current_address" },
    { label: tr("students.f_permanentAddress"), key: "permanent_address" },
    { label: tr("students.f_birthPlace"), key: "birth_place" },
    { label: tr("students.f_occupation"), key: "occupation" },
  ];

  const passportFields = [
    { label: tr("students.f_passport"), key: "passport" },
    { label: tr("students.f_passportIssue"), key: "passport_issue", type: "date" },
    { label: tr("students.f_passportExpiry"), key: "passport_expiry", type: "date" },
    { label: tr("students.f_fatherName"), key: "father_name_en" },
    { label: tr("students.f_motherName"), key: "mother_name_en" },
    { label: tr("students.f_permanentAddress"), key: "permanent_address" },
    { label: tr("students.f_spouseName"), key: "spouse_name" },
    { label: tr("students.f_emergencyContact"), key: "emergency_contact" },
    { label: tr("students.f_emergencyPhone"), key: "emergency_phone", type: "phone" },
  ];

  const destinationExtraFields = [
    { label: tr("students.f_intake"), key: "intake" },
    { label: tr("students.f_visaType"), key: "visa_type", type: "select", options: ["","Language Student","SSW","TITP","Engineer/Specialist","Graduation","Masters","Visitor","Dependent"] },
    { label: tr("students.f_branch"), key: "branch", type: "branch_select" },
    { label: tr("students.f_source"), key: "source", type: "select", options: ["Walk-in","Facebook","Agent","Referral","Website","YouTube","Friend"] },
    { label: tr("students.f_type"), key: "student_type", type: "select", options: ["own","agent","partner"] },
    { label: tr("students.f_counselor"), key: "counselor", type: "counselor_select" },
    { label: tr("students.f_enrollDate"), key: "created" },
  ];

  // ── Conditional fields — Source/Type অনুযায়ী dynamic field ──
  // Source = Agent/Referral → Agent dropdown দেখাও
  // Type = partner → Partner Agency dropdown দেখাও
  const getConditionalDestFields = (formData) => {
    const base = [
      { label: tr("students.f_country"), key: "country", type: "select", options: ["Japan","Germany","Korea","Canada","UK","USA","Australia","China","Malaysia"] },
      { label: tr("students.f_school"), key: "school", type: "school_select" },
      { label: tr("students.f_batch"), key: "batch", type: "batch_select" },
      { label: tr("students.f_intake"), key: "intake" },
      { label: tr("students.f_visaType"), key: "visa_type", type: "select", options: ["","Language Student","SSW","TITP","Engineer/Specialist","Graduation","Masters","Visitor","Dependent"] },
      { label: tr("students.f_branch"), key: "branch", type: "branch_select" },
      { label: tr("students.f_source"), key: "source", type: "select", options: ["Walk-in","Facebook","Agent","Referral","Website","YouTube","Friend"] },
    ];
    // Source = Agent বা Referral → Agent dropdown
    const src = (formData?.source || "").toLowerCase();
    if (src === "agent" || src === "referral") {
      base.push({ label: tr("students.f_agent"), key: "agent_id", type: "agent_select" });
    }
    base.push({ label: tr("students.f_type"), key: "student_type", type: "select", options: ["own","agent","partner"] });
    // Type = partner → Partner Agency dropdown
    if (formData?.student_type === "partner") {
      base.push({ label: tr("students.f_partner"), key: "partner_id", type: "partner_select" });
    }
    base.push({ label: tr("students.f_counselor"), key: "counselor", type: "counselor_select" });
    return base;
  };

  // ── Read-only field renderer ──
  const ReadOnlyField = ({ label, value }) => (
    <div className="flex justify-between items-center text-xs gap-2">
      <span style={{ color: t.muted }} className="shrink-0">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );

  // ── সেকশন-ভিত্তিক ফিল্ড কনফিগ (Modal-এ dynamic render হবে) ──
  // destination fields dynamic — sectionForm state থেকে conditional fields বের হয়
  const getFields = (section) => {
    if (section === "destination") return getConditionalDestFields(sectionForm);
    return SECTION_FIELDS_STATIC[section] || [];
  };
  const SECTION_FIELDS_STATIC = {
    personal: personalFields,
    passport: passportFields,
    internal: [
      { label: tr("students.f_driveUrl"), key: "gdrive_folder_url" },
      { label: tr("students.f_internalNotes"), key: "internal_notes", type: "textarea" },
    ],
    study_plan: [
      { label: tr("students.f_reasonStudy"), key: "reason_for_study", type: "textarea" },
      { label: tr("students.f_futurePlan"), key: "future_plan", type: "textarea" },
      { label: tr("students.f_studySubject"), key: "study_subject", type: "text" },
    ],
  };

  // ── সেকশন Modal-এর টাইটেল — i18n ──
  const SECTION_TITLES = {
    personal: `${tr("students.personalInfo")} — ${tr("common.edit")}`,
    passport: `${tr("students.passportFamily")} — ${tr("common.edit")}`,
    destination: `${tr("students.destinationInfo")} — ${tr("common.edit")}`,
    internal: `${tr("students.internal")} — ${tr("common.edit")}`,
    study_plan: `Study Plan — ${tr("common.edit")}`,
  };

  // ── সেকশন Edit শুরু — ফিল্ড ভ্যালু student থেকে নিয়ে form-এ সেট ──
  const openSectionEdit = (section) => {
    const fields = getFields(section);
    const formData = {};
    fields.forEach(f => { formData[f.key] = student[f.key] || ""; });
    setSectionForm(formData);
    setEditSection(section);
  };

  return (
    <div className="space-y-5 anim-fade">

      {/* ══════════════════════════════════════
          HEADER — সবসময় দেখাবে
      ══════════════════════════════════════ */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="p-2 rounded-xl transition flex items-center gap-1 text-xs font-medium"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
          onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = t.inputBg}>
          <ArrowLeft size={16} /> <span className="hidden sm:inline">ফিরুন</span>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold">{student.name_en}</h2>
            <StatusBadge status={student.status} />
            {student.branch && <Badge color={t.purple} size="xs">{student.branch}</Badge>}
            {student.type === "partner" && <Badge color={t.amber} size="xs">Partner</Badge>}
          </div>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{student.name_bn} • {student.id} • {student.country}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="danger" icon={Trash2} size="xs" onClick={() => setShowDeleteConfirm(true)}>{tr("common.delete")}</Button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          TAB BAR — SettingsPage-এর মতো স্টাইল
      ══════════════════════════════════════ */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab === tab.key ? t.cardSolid : "transparent",
              color: activeTab === tab.key ? t.cyan : t.muted,
              boxShadow: activeTab === tab.key ? `0 1px 3px rgba(0,0,0,0.2)` : "none",
            }}>
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          TAB 1: OVERVIEW — ড্যাশবোর্ড স্টাইল ওভারভিউ
      ══════════════════════════════════════ */}
      {activeTab === "overview" && (
        <>
          {/* ── স্ট্যাট কার্ড — 4 কলাম ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Pipeline Step */}
            <Card delay={30}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                  style={{ background: `${stepColor}15` }}>
                  {meta.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px]" style={{ color: t.muted }}>{tr("students.pipeline")}</p>
                  <p className="text-sm font-bold truncate" style={{ color: stepColor }}>
                    {PIPELINE_STATUSES.find(s => s.code === currentStatus)?.label || currentStatus}
                  </p>
                </div>
              </div>
              <p className="text-[10px]" style={{ color: t.muted }}>
                {isPastCoe ? "সম্পন্ন → Pre-Departure" : `ধাপ ${Math.max(currentStepIdx + 1, 1)} / ${MAIN_STEPS.length}`}
                {isTerminal && <span className="ml-1 px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${t.rose}20`, color: t.rose }}>{currentStatus}</span>}
              </p>
            </Card>

            {/* Payment Progress */}
            <Card delay={40}>
              <p className="text-[10px] mb-1" style={{ color: t.muted }}>পেমেন্ট</p>
              <p className="text-sm font-bold" style={{ color: paidPercent >= 100 ? t.emerald : paidPercent >= 50 ? t.cyan : t.amber }}>
                {taka(totalPaid)} / {taka(totalFee)}
              </p>
              <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: t.inputBg }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${paidPercent}%`, background: paidPercent >= 100 ? t.emerald : paidPercent >= 50 ? t.cyan : t.amber }} />
              </div>
              <p className="text-[10px] mt-1 text-right" style={{ color: t.muted }}>{Math.round(paidPercent)}%</p>
            </Card>

            {/* Documents (checklist progress) */}
            <Card delay={50}>
              <p className="text-[10px] mb-1" style={{ color: t.muted }}>চেকলিস্ট</p>
              <p className="text-sm font-bold" style={{ color: allRequiredDone ? t.emerald : t.amber }}>
                {checkedRequired} / {requiredItems.length} আবশ্যক
              </p>
              <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: t.inputBg }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${requiredItems.length > 0 ? (checkedRequired / requiredItems.length) * 100 : 0}%`, background: allRequiredDone ? t.emerald : t.amber }} />
              </div>
              <p className="text-[10px] mt-1" style={{ color: t.muted }}>{meta.hint}</p>
            </Card>

            {/* Portal Access */}
            <Card delay={60}>
              <p className="text-[10px] mb-1" style={{ color: t.muted }}>{tr("students.portalAccess")}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{portalAccess ? "✅" : "❌"}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: portalAccess ? t.emerald : t.muted }}>
                    {portalAccess ? "চালু" : "বন্ধ"}
                  </p>
                  {portalAccess && <p className="text-[10px]" style={{ color: t.muted }}>{student.phone}</p>}
                </div>
              </div>
              <button onClick={() => setShowPortalForm(true)}
                className="mt-2 w-full px-2 py-1 rounded-lg text-[10px] font-medium transition"
                style={{ background: portalAccess ? `${t.rose}15` : `${t.emerald}15`, color: portalAccess ? t.rose : t.emerald }}>
                {portalAccess ? "বন্ধ করুন" : "চালু করুন"}
              </button>
            </Card>
          </div>

          {/* ── Pipeline Progress — horizontal stepper (COE_RECEIVED পর্যন্ত) ── */}
          <Card delay={70}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">পাইপলাইন অগ্রগতি</h3>
              <p className="text-[11px]" style={{ color: t.muted }}>
                {isPastCoe ? `সম্পন্ন — ${PIPELINE_STATUSES.find(s => s.code === currentStatus)?.label || currentStatus}` : `ধাপ ${Math.max(currentStepIdx + 1, 1)} / ${MAIN_STEPS.length}`}
              </p>
            </div>
            {/* Step circles — ENROLLED থেকে COE_RECEIVED পর্যন্ত */}
            <div className="overflow-x-auto pb-2">
              <div className="flex items-center min-w-max">
                {MAIN_STEPS.map((step, i) => {
                  // Post-COE student-দের জন্য সব step complete দেখাবে
                  const done = isPastCoe ? true : i < currentStepIdx;
                  const active = isPastCoe ? false : i === currentStepIdx;
                  const color = step.color;
                  return (
                    <div key={step.code} className="flex items-center">
                      <button
                        onClick={() => !isTerminal && !isPastCoe && changeStatus(step.code, `Status → ${step.label}`)}
                        title={step.label}
                        className="flex flex-col items-center gap-1.5 group transition-all"
                        style={{ minWidth: 52 }}
                      >
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2"
                          style={{
                            background: done ? `${t.emerald}20` : active ? `${color}25` : t.inputBg,
                            borderColor: done ? t.emerald : active ? color : t.inputBorder,
                            color: done ? t.emerald : active ? color : t.muted,
                            boxShadow: active ? `0 0 0 3px ${color}30` : "none",
                          }}>
                          {done ? <Check size={14} /> : i + 1}
                        </div>
                        <span className="text-[9px] text-center leading-tight max-w-[52px]"
                          style={{ color: done ? t.emerald : active ? color : `${t.muted}70`, fontWeight: active ? 700 : 400 }}>
                          {step.label}
                        </span>
                      </button>
                      {i < MAIN_STEPS.length - 1 && (
                        <div className="h-0.5 w-5 mx-0.5 shrink-0 rounded-full transition-all"
                          style={{ background: (isPastCoe || i < currentStepIdx) ? t.emerald : t.inputBorder }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* ── Pre-Departure ব্যানার — COE_RECEIVED বা তার পরের status হলে দেখাবে ── */}
          {(currentStatus === "COE_RECEIVED" || isPastCoe) && (
            <Card delay={100}>
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✈️</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: t.emerald }}>
                      {isPastCoe ? `${PIPELINE_STATUSES.find(s => s.code === currentStatus)?.label || currentStatus} — Pre-Departure process চলছে` : "COE Received — Pre-Departure process শুরু করুন"}
                    </p>
                    <p className="text-[10px]" style={{ color: t.muted }}>ভিসা, VFS, ফ্লাইট ইত্যাদি Pre-Departure মডিউলে ম্যানেজ করুন</p>
                  </div>
                </div>
                <button onClick={() => onNavigate && onNavigate("departure")}
                  className="px-4 py-2 rounded-xl text-xs font-medium shrink-0"
                  style={{ background: t.emerald, color: "#fff" }}>
                  {tr("students.goToPreDeparture")} →
                </button>
              </div>
            </Card>
          )}

          {/* ── Current Step Action Card + Quick Info (2-column) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Current Step Action Card — 3 col wide */}
            <div className="lg:col-span-3">
              {/* Post-COE student — Pre-Departure মডিউলে ম্যানেজ হচ্ছে */}
              {isPastCoe ? (
                <Card delay={80}>
                  <div className="flex items-center gap-4 p-2">
                    <div className="text-3xl">✈️</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: t.emerald }}>
                        {PIPELINE_STATUSES.find(s => s.code === currentStatus)?.label || currentStatus}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: t.muted }}>
                        এই স্টুডেন্টের ভিসা, VFS, ফ্লাইট ইত্যাদি Pre-Departure মডিউলে ম্যানেজ হচ্ছে
                      </p>
                    </div>
                    <button onClick={() => onNavigate && onNavigate("departure")}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition shrink-0"
                      style={{ background: `${t.emerald}20`, color: t.emerald, border: `1px solid ${t.emerald}40` }}
                      onMouseEnter={e => e.currentTarget.style.background = `${t.emerald}30`}
                      onMouseLeave={e => { const el = e.currentTarget; el.style.background = `${t.emerald}20`; }}>
                      প্রি-ডিপার্চার →
                    </button>
                  </div>
                </Card>
              ) : !isTerminal ? (
                <Card delay={80}>
                  {/* Collapsible toggle header */}
                  <button
                    onClick={() => setShowStepCard(v => !v)}
                    className="w-full flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: `${stepColor}15` }}>
                        {meta.icon}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: stepColor }}>
                            {PIPELINE_STATUSES.find(s => s.code === currentStatus)?.label}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${stepColor}15`, color: stepColor }}>
                            {checkedRequired}/{requiredItems.length} আবশ্যক ✓
                          </span>
                          {!allRequiredDone && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${t.rose}15`, color: t.rose }}>
                              {requiredItems.length - checkedRequired}টি বাকি
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: t.muted }}>{meta.hint}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: t.muted, transform: showStepCard ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                  </button>

                  {!showStepCard ? null : (<div className="mt-4" style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
                  {/* Checklist */}
                  <div className="space-y-2 mb-5">
                    <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: t.muted }}>এই ধাপে যা করতে হবে</p>
                    {meta.checklist.map(item => {
                      const ticked = isChecked(item.id);
                      return (
                        <button key={item.id} onClick={() => toggleCheck(item.id)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all"
                          style={{ background: ticked ? `${t.emerald}10` : t.inputBg, border: `1px solid ${ticked ? `${t.emerald}30` : "transparent"}` }}>
                          <div className="h-5 w-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-all"
                            style={{ background: ticked ? t.emerald : "transparent", borderColor: ticked ? t.emerald : t.inputBorder }}>
                            {ticked && <Check size={11} color="#fff" />}
                          </div>
                          <span className="text-xs flex-1" style={{ color: ticked ? t.textSecondary : t.text, textDecoration: ticked ? "line-through" : "none" }}>
                            {item.text}
                          </span>
                          {item.req && !ticked && (
                            <span className="text-[9px] shrink-0 px-1.5 py-0.5 rounded-full" style={{ background: `${t.rose}15`, color: t.rose }}>আবশ্যক</span>
                          )}
                          {ticked && <Check size={13} style={{ color: t.emerald, shrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-4" style={{ borderTop: `1px solid ${t.border}` }}>
                    {currentStepIdx > 0 && (
                      <button onClick={goPrev}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition"
                        style={{ background: t.inputBg, color: t.muted, border: `1px solid ${t.inputBorder}` }}
                        onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.background = t.inputBg; }}>
                        <ChevronLeft size={13} /> পূর্ববর্তী ধাপ
                      </button>
                    )}
                    {!["COMPLETED"].includes(currentStatus) && (
                      <button onClick={() => setShowPauseConfirm(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition"
                        style={{ background: `${t.amber}15`, color: t.amber, border: `1px solid ${t.amber}30` }}
                        onMouseEnter={e => e.currentTarget.style.background = `${t.amber}25`}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.background = `${t.amber}15`; }}>
                        ⏸ বিরতি
                      </button>
                    )}
                    {!["COMPLETED"].includes(currentStatus) && (
                      <button onClick={() => setShowCancelConfirm(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition"
                        style={{ background: `${t.rose}12`, color: t.rose, border: `1px solid ${t.rose}25` }}
                        onMouseEnter={e => e.currentTarget.style.background = `${t.rose}22`}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.background = `${t.rose}12`; }}>
                        ✕ বাতিল
                      </button>
                    )}
                    <div className="flex-1" />
                    {/* COE_RECEIVED হলে Pre-Departure-এ যাওয়ার বাটন দেখাবে, পরবর্তী ধাপ নয় */}
                    {currentStatus === "COE_RECEIVED" ? (
                      <button
                        onClick={() => onNavigate && onNavigate("departure")}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${t.emerald}, ${t.emerald}cc)`,
                          color: "#fff",
                          boxShadow: `0 4px 12px ${t.emerald}40`,
                        }}>
                        ✈️ প্রি-ডিপার্চারে যান <ChevronRight size={13} />
                      </button>
                    ) : meta.nextStatus && (
                      <div className="flex items-center gap-2">
                        {!allRequiredDone && (
                          <p className="text-[10px]" style={{ color: t.rose }}>
                            {requiredItems.length - checkedRequired}টি আবশ্যক বাকি
                          </p>
                        )}
                        <button
                          onClick={goNext}
                          disabled={!allRequiredDone}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{
                            background: allRequiredDone ? `linear-gradient(135deg, ${stepColor}, ${stepColor}cc)` : `${stepColor}20`,
                            color: allRequiredDone ? "#fff" : `${stepColor}80`,
                            cursor: allRequiredDone ? "pointer" : "not-allowed",
                            boxShadow: allRequiredDone ? `0 4px 12px ${stepColor}40` : "none",
                          }}>
                          {meta.nextLabel} <ChevronRight size={13} />
                        </button>
                        {!allRequiredDone && (
                          <button onClick={goNext}
                            className="text-[10px] px-2 py-1 rounded-lg transition"
                            style={{ background: t.inputBg, color: t.muted }}
                            onMouseEnter={e => e.currentTarget.style.color = t.text}
                            onMouseLeave={e => { const el = e.currentTarget; el.style.color = t.muted; }}
                            title="Checklist ছাড়াই এগিয়ে যান">
                            ওভাররাইড →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  </div>)}
                </Card>
              ) : (
                /* Terminal state (PAUSED/CANCELLED) */
                <Card delay={80}>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{currentStatus === "PAUSED" ? "⏸" : "❌"}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: currentStatus === "PAUSED" ? t.amber : t.rose }}>
                        {currentStatus === "PAUSED" ? "সাময়িক বিরতি" : "বাদ দেওয়া হয়েছে"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: t.muted }}>
                        {currentStatus === "PAUSED" ? "পরিস্থিতি ঠিক হলে Re-activate করুন" : "কারণ নোট করুন এবং Re-activate করা যাবে"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        changeStatus("ENROLLED", "Pipeline Re-activate করা হয়েছে");
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition"
                      style={{ background: `${t.emerald}20`, color: t.emerald, border: `1px solid ${t.emerald}40` }}
                      onMouseEnter={e => e.currentTarget.style.background = `${t.emerald}30`}
                      onMouseLeave={e => { const el = e.currentTarget; el.style.background = `${t.emerald}20`; }}>
                      ▶ Re-activate করুন
                    </button>
                  </div>
                </Card>
              )}
            </div>

            {/* Quick Info — 2 col wide */}
            <div className="lg:col-span-2">
              <Card delay={90}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: t.muted }}>
                  <User size={12} /> {tr("students.f_quickInfo")}
                </h4>
                <div className="space-y-2.5">
                  <ReadOnlyField label={tr("students.f_phone")} value={formatPhoneDisplay(student.phone)} />
                  <ReadOnlyField label={tr("students.f_email")} value={student.email} />
                  <ReadOnlyField label={tr("students.f_country")} value={student.country} />
                  <ReadOnlyField label={tr("students.f_school")} value={student.school} />
                  <ReadOnlyField label={tr("students.f_batch")} value={student.batch} />
                  <ReadOnlyField label={tr("students.f_counselor")} value={student.counselor} />
                  <ReadOnlyField label={tr("students.f_source")} value={student.source} />
                  <ReadOnlyField label={tr("students.f_enrollDate")} value={student.created} />
                  <ReadOnlyField label={tr("students.f_type")} value={student.student_type === "own" ? "Own" : student.student_type === "agent" ? "Agent" : "Partner"} />
                </div>
              </Card>
            </div>
          </div>

          {/* ── Activity Log (সর্বশেষ ৫টি) ── */}
          <Card delay={100}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <MessageSquare size={14} style={{ color: t.cyan }} /> সাম্প্রতিক কার্যকলাপ
              </h3>
              <button onClick={() => setActiveTab("timeline")}
                className="text-[10px] px-2 py-1 rounded-lg transition"
                style={{ background: `${t.cyan}15`, color: t.cyan }}>
                সব দেখুন →
              </button>
            </div>
            <div className="space-y-2">
              {[...activityLog].reverse().slice(0, 5).map((entry, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  <span className="text-sm shrink-0 mt-0.5">{logIcon[entry.type] || "⚪"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="leading-snug" style={{ color: entry.type === "note" ? t.text : t.textSecondary }}>{entry.text}</p>
                    <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: t.muted }}>
                      <Clock size={9} /> {entry.time}
                    </p>
                  </div>
                </div>
              ))}
              {activityLog.length === 0 && <p className="text-xs text-center py-3" style={{ color: t.muted }}>কোনো কার্যকলাপ নেই</p>}
            </div>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════
          TAB 2: PROFILE — Read-only + Edit Modal
      ══════════════════════════════════════ */}
      {activeTab === "profile" && (
        <>
          {/* 3-column read-only grid — প্রতিটি কার্ডে নিজস্ব Edit বাটন */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {/* ── ব্যক্তিগত তথ্য কার্ড ── */}
            <Card delay={50}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.muted }}><User size={12} /> {tr("students.personalInfo")}</h4>
                <button onClick={() => openSectionEdit("personal")}
                  className="text-[10px] px-2 py-1 rounded-lg transition"
                  style={{ color: t.cyan }}
                  onMouseEnter={e => e.currentTarget.style.background = `${t.cyan}15`}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  ✏️ Edit
                </button>
              </div>
              <div className="space-y-2.5">
                {personalFields.map(f => (
                  <ReadOnlyField key={f.key} label={f.label} value={student[f.key]} />
                ))}
              </div>
            </Card>

            {/* ── পাসপোর্ট ও পরিবার কার্ড ── */}
            <Card delay={80}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.muted }}><FileCheck size={12} /> {tr("students.passportFamily")}</h4>
                <button onClick={() => openSectionEdit("passport")}
                  className="text-[10px] px-2 py-1 rounded-lg transition"
                  style={{ color: t.cyan }}
                  onMouseEnter={e => e.currentTarget.style.background = `${t.cyan}15`}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  ✏️ Edit
                </button>
              </div>
              <div className="space-y-2.5">
                {passportFields.map(f => (
                  <ReadOnlyField key={f.key} label={f.label} value={student[f.key]} />
                ))}
              </div>
            </Card>

            {/* ── গন্তব্য তথ্য কার্ড ── */}
            <Card delay={110}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.muted }}><Globe size={12} /> {tr("students.destinationInfo")}</h4>
                <button onClick={() => openSectionEdit("destination")}
                  className="text-[10px] px-2 py-1 rounded-lg transition"
                  style={{ color: t.cyan }}
                  onMouseEnter={e => e.currentTarget.style.background = `${t.cyan}15`}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  ✏️ Edit
                </button>
              </div>
              <div className="space-y-2.5">
                <ReadOnlyField label={tr("students.f_country")} value={student.country} />
                <ReadOnlyField label={tr("students.f_school")} value={student.school} />
                <ReadOnlyField label={tr("students.f_batch")} value={student.batch} />
                {destinationExtraFields.map(f => {
                  let val = student[f.key];
                  if (f.key === "student_type") val = val === "own" ? "Own" : val === "agent" ? "Agent" : "Partner";
                  return <ReadOnlyField key={f.key} label={f.label} value={val} />;
                })}
                {/* Conditional: Source=Agent/Referral → Agent দেখাও */}
                {(student.source === "Agent" || student.source === "Referral") && (
                  <ReadOnlyField label={tr("students.f_agent")}
                    value={student.agent_id ? (agentOptions.find(a => a.id === student.agent_id)?.name || student.agent_id) : "—"} />
                )}
                {/* Conditional: Type=partner → Partner Agency দেখাও */}
                {student.student_type === "partner" && (
                  <ReadOnlyField label={tr("students.f_partner")}
                    value={student.partner_id ? (partnerOptions.find(p => p.id === student.partner_id)?.name || student.partner_id) : "—"} />
                )}
              </div>
            </Card>
          </div>

          {/* ── শিক্ষাগত তথ্য (Education) — SSC / HSC ── */}
          <Card delay={150}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.muted }}>
                <GraduationCap size={12} /> {tr("students.education")}
              </h4>
              <Button variant="ghost" icon={Plus} size="xs" onClick={() => {
                setShowEduForm(true);
                setEduForm({ level: "SSC", school_name: "", year: "", board: "", gpa: "", group_name: "", school_type: "", entrance_year: "", address: "" });
              }}>{tr("students.addEducation")}</Button>
            </div>

            {/* Education যোগ/edit Modal */}
            <Modal isOpen={showEduForm} onClose={() => setShowEduForm(false)} title={editingEduId ? "শিক্ষাগত তথ্য সম্পাদনা" : "শিক্ষাগত তথ্য যোগ করুন"} size="md">
              <div className="space-y-3">
                {[
                  { key: "level", label: "পরীক্ষা", type: "select", options: ["SSC", "HSC", "Diploma", "Bachelor", "Masters", "Other"] },
                  { key: "school_type", label: "স্কুলের ধরন", type: "select", options: ["", "Elementary", "Junior High", "High School", "Technical", "Junior College", "University"] },
                  { key: "school_name", label: "প্রতিষ্ঠান", type: "text" },
                  { key: "entrance_year", label: "ভর্তির তারিখ (YYYY-MM)", type: "month" },
                  { key: "year", label: "পাসের তারিখ (YYYY-MM)", type: "month" },
                  { key: "board", label: "বোর্ড", type: "text" },
                  { key: "gpa", label: "জিপিএ / ফলাফল", type: "text" },
                  { key: "group_name", label: "গ্রুপ / বিভাগ", type: "text" },
                  { key: "address", label: "প্রতিষ্ঠানের ঠিকানা", type: "text" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label}</label>
                    {f.type === "select" ? (
                      <select value={eduForm[f.key] || ""} onChange={e => setEduForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type === "month" ? "month" : "text"} value={eduForm[f.key] || ""} onChange={e => setEduForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                        placeholder={f.type === "month" ? "YYYY-MM" : ""} />
                    )}
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                  <Button variant="ghost" size="sm" onClick={() => setShowEduForm(false)}>{tr("common.cancel")}</Button>
                  <Button size="sm" icon={Save} onClick={saveEducation}>{tr("common.save")}</Button>
                </div>
              </div>
            </Modal>
            {education.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {education.map((edu, idx) => (
                  <div key={edu.id || idx} className="p-3 rounded-lg" style={{ background: t.inputBg }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: t.cyan }}>
                        {edu.level || `পরীক্ষা ${idx + 1}`}
                      </p>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingEduId(edu.id); setEduForm({ level: edu.level || "", school_name: edu.school_name || "", year: edu.passing_year || edu.year || "", board: edu.board || "", gpa: edu.gpa || "", group_name: edu.group_name || "", school_type: edu.school_type || "", entrance_year: edu.entrance_year || "", address: edu.address || "" }); setShowEduForm(true); }}
                          className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: t.cyan }}>✏️</button>
                        <button onClick={async () => { try { await api.del(`/students/${student.id}/education/${edu.id}`); setEducation(prev => prev.filter(e => e.id !== edu.id)); toast.success("মুছে ফেলা হয়েছে"); } catch (err) { toast.error(err.message); } }}
                          className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: t.rose }}>🗑</button>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { label: "স্কুলের ধরন", value: edu.school_type },
                        { label: "প্রতিষ্ঠান", value: edu.school_name || edu.institution },
                        { label: "ভর্তির সন", value: edu.entrance_year },
                        { label: "পাসের সন", value: edu.passing_year || edu.year },
                        { label: "বোর্ড", value: edu.board },
                        { label: "জিপিএ / ফলাফল", value: edu.gpa || edu.result },
                        { label: "গ্রুপ / বিভাগ", value: edu.group_name || edu.department },
                        { label: "ঠিকানা", value: edu.address },
                      ].map(f => (
                        <div key={f.label} className="flex justify-between">
                          <span style={{ color: t.muted }}>{f.label}</span>
                          <span className="font-medium text-right">{f.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center py-4" style={{ color: t.muted }}>{tr("students.noEducation")}</p>
            )}
          </Card>

          {/* ── জাপানি ভাষা পরীক্ষা (JP Exams) ── */}
          <Card delay={200}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.muted }}>
                <BookOpen size={12} /> {tr("students.jpExams")}
              </h4>
              <Button variant="ghost" icon={Plus} size="xs" onClick={() => setShowJpExamForm(true)}>{tr("students.addExam")}</Button>
            </div>

            {/* JP Exam যোগ করার ইনলাইন ফর্ম */}
            {showJpExamForm && (
              <div className="mb-3 p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: t.muted }}>পরীক্ষার ধরন</label>
                    <select value={jpExamForm.exam_type} onChange={e => setJpExamForm(p => ({ ...p, exam_type: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                      style={{ background: t.card, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                      {["JLPT", "NAT-TEST", "JPT", "J-TEST", "TOP-J", "EJU", "Other"].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: t.muted }}>লেভেল</label>
                    {(jpExamForm.exam_type === "JPT" || jpExamForm.exam_type === "EJU") ? (
                      <input value={jpExamForm.level} onChange={e => setJpExamForm(p => ({ ...p, level: e.target.value }))}
                        className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                        style={{ background: t.card, border: `1px solid ${t.inputBorder}`, color: t.text }}
                        placeholder={jpExamForm.exam_type === "JPT" ? "Score (0-990)" : "Score (0-400)"} />
                    ) : (
                      <select value={jpExamForm.level} onChange={e => setJpExamForm(p => ({ ...p, level: e.target.value }))}
                        className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                        style={{ background: t.card, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                        <option value="">—</option>
                        {jpExamForm.exam_type === "J-TEST"
                          ? ["A-C (Advanced)", "D-E (Intermediate)", "F-G (Basic)"].map(o => <option key={o} value={o}>{o}</option>)
                          : jpExamForm.exam_type === "NAT-TEST"
                            ? ["5級", "4級", "3級", "2級", "1級"].map(o => <option key={o} value={o}>{o}</option>)
                            : ["N5", "N4", "N3", "N2", "N1"].map(o => <option key={o} value={o}>{o}</option>)
                        }
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: t.muted }}>স্কোর</label>
                    <input value={jpExamForm.score} onChange={e => setJpExamForm(p => ({ ...p, score: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" placeholder="যেমন: 120/180"
                      style={{ background: t.card, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: t.muted }}>ফলাফল</label>
                    <select value={jpExamForm.result} onChange={e => setJpExamForm(p => ({ ...p, result: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                      style={{ background: t.card, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                      <option value="">—</option>
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: t.muted }}>পরীক্ষার তারিখ</label>
                    <input type="date" value={jpExamForm.exam_date} onChange={e => setJpExamForm(p => ({ ...p, exam_date: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                      style={{ background: t.card, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="xs" onClick={() => setShowJpExamForm(false)}>{tr("common.cancel")}</Button>
                  <Button size="xs" icon={Save} onClick={addJpExam}>{tr("common.save")}</Button>
                </div>
              </div>
            )}

            {jpExams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      {["পরীক্ষা", "লেভেল", "স্কোর", "ফলাফল", "তারিখ", ""].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jpExams.map((e, i) => (
                      <tr key={e.id || i} style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={ev => ev.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                        <td className="py-2 px-3 font-medium">{e.exam_type || "—"}</td>
                        <td className="py-2 px-3">
                          {e.level ? <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: `${t.cyan}20`, color: t.cyan }}>{e.level}</span> : "—"}
                        </td>
                        <td className="py-2 px-3">{e.score || "—"}</td>
                        <td className="py-2 px-3">
                          {e.result === "Pass" ? <span style={{ color: t.emerald }}>Pass</span>
                            : e.result === "Fail" ? <span style={{ color: t.rose }}>Fail</span>
                            : e.result || "—"}
                        </td>
                        <td className="py-2 px-3" style={{ color: t.muted }}>{e.exam_date || "—"}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => {
                              setJpExamForm({ exam_type: e.exam_type || "JLPT", level: e.level || "", score: e.score || "", result: e.result || "", exam_date: e.exam_date?.slice(0, 10) || "" });
                              setEditingJpExamId(e.id);
                              setShowJpExamForm(true);
                            }} className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: t.cyan }}>✏️</button>
                            <button onClick={async () => { try { await api.del(`/students/${student.id}/jp-exams/${e.id}`); setJpExams(prev => prev.filter(x => x.id !== e.id)); toast.success(tr("success.deleted")); } catch (err) { toast.error(err.message); } }}
                              className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: t.rose }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-center py-4" style={{ color: t.muted }}>{tr("students.noExams")}</p>
            )}
          </Card>

          {/* ── কর্ম অভিজ্ঞতা (Work Experience) ── */}
          <Card delay={250}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.muted }}>
                <Briefcase size={12} /> কর্ম অভিজ্ঞতা
              </h4>
              <Button variant="ghost" icon={Plus} size="xs" onClick={() => {
                setShowWorkForm(true);
                setWorkForm({ company_name: "", address: "", start_date: "", end_date: "", position: "" });
              }}>যোগ করুন</Button>
            </div>

            {/* Work Experience যোগ করার Modal */}
            <Modal isOpen={showWorkForm} onClose={() => setShowWorkForm(false)} title="কর্ম অভিজ্ঞতা যোগ করুন" size="md">
              <div className="space-y-3">
                {[
                  { key: "company_name", label: "প্রতিষ্ঠানের নাম", type: "text" },
                  { key: "position", label: "পদবী", type: "text" },
                  { key: "address", label: "প্রতিষ্ঠানের ঠিকানা", type: "text" },
                  { key: "start_date", label: "শুরুর তারিখ", type: "date" },
                  { key: "end_date", label: "শেষের তারিখ", type: "date" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label}</label>
                    <input type={f.type === "date" ? "date" : "text"} value={workForm[f.key] || ""} onChange={e => setWorkForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                  <Button variant="ghost" size="sm" onClick={() => setShowWorkForm(false)}>{tr("common.cancel")}</Button>
                  <Button size="sm" icon={Save} onClick={saveWorkExperience}>{tr("common.save")}</Button>
                </div>
              </div>
            </Modal>

            {workExperience.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workExperience.map((we, idx) => (
                  <div key={we.id || idx} className="p-3 rounded-lg" style={{ background: t.inputBg }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: t.purple }}>
                        {we.company_name || `প্রতিষ্ঠান ${idx + 1}`}
                      </p>
                      <button onClick={() => deleteWorkExperience(we.id)}
                        className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: t.rose }}>🗑</button>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { label: "পদবী", value: we.position },
                        { label: "ঠিকানা", value: we.address },
                        { label: "শুরু", value: we.start_date },
                        { label: "শেষ", value: we.end_date || "চলমান" },
                      ].map(f => (
                        <div key={f.label} className="flex justify-between">
                          <span style={{ color: t.muted }}>{f.label}</span>
                          <span className="font-medium text-right">{f.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center py-4" style={{ color: t.muted }}>কোনো কর্ম অভিজ্ঞতা নেই</p>
            )}
          </Card>

          {/* ── জাপানি ভাষা শিক্ষা ইতিহাস (JP Study History) ── */}
          <Card delay={300}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.muted }}>
                <BookOpen size={12} /> জাপানি ভাষা শিক্ষা ইতিহাস
              </h4>
              <Button variant="ghost" icon={Plus} size="xs" onClick={() => {
                setShowJpStudyForm(true);
                setJpStudyForm({ institution: "", period: "", hours: "", level: "", description: "" });
              }}>যোগ করুন</Button>
            </div>

            {/* JP Study History যোগ করার Modal */}
            <Modal isOpen={showJpStudyForm} onClose={() => setShowJpStudyForm(false)} title="জাপানি ভাষা শিক্ষা ইতিহাস যোগ করুন" size="md">
              <div className="space-y-3">
                {[
                  { key: "institution", label: "প্রতিষ্ঠান", type: "text" },
                  { key: "period", label: "সময়কাল (যেমন: 2024-01 ~ 2024-06)", type: "text" },
                  { key: "hours", label: "মোট ঘণ্টা", type: "text" },
                  { key: "level", label: "লেভেল", type: "text" },
                  { key: "description", label: "বিবরণ", type: "text" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label}</label>
                    <input type="text" value={jpStudyForm[f.key] || ""} onChange={e => setJpStudyForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                  <Button variant="ghost" size="sm" onClick={() => setShowJpStudyForm(false)}>{tr("common.cancel")}</Button>
                  <Button size="sm" icon={Save} onClick={saveJpStudy}>{tr("common.save")}</Button>
                </div>
              </div>
            </Modal>

            {jpStudy.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      {["প্রতিষ্ঠান", "সময়কাল", "ঘণ্টা", "লেভেল", "বিবরণ", ""].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jpStudy.map((js, i) => (
                      <tr key={js.id || i} style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={ev => ev.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                        <td className="py-2 px-3 font-medium">{js.institution || "—"}</td>
                        <td className="py-2 px-3">{js.period || "—"}</td>
                        <td className="py-2 px-3">{js.hours || "—"}</td>
                        <td className="py-2 px-3">{js.level || "—"}</td>
                        <td className="py-2 px-3" style={{ color: t.muted }}>{js.description || "—"}</td>
                        <td className="py-2 px-3">
                          <button onClick={() => deleteJpStudy(js.id)}
                            className="text-[9px] px-1 py-0.5 rounded opacity-50 hover:opacity-100" style={{ color: t.rose }}>🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-center py-4" style={{ color: t.muted }}>কোনো জাপানি ভাষা শিক্ষা ইতিহাস নেই</p>
            )}
          </Card>

          {/* ── Study Plan (অধ্যয়ন পরিকল্পনা) ── */}
          <Card delay={350}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.muted }}>
                <BookOpen size={12} /> অধ্যয়ন পরিকল্পনা
              </h4>
              <button onClick={() => openSectionEdit("study_plan")}
                className="text-[10px] px-2 py-1 rounded-lg transition"
                style={{ color: t.cyan }}
                onMouseEnter={e => e.currentTarget.style.background = `${t.cyan}15`}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                ✏️ Edit
              </button>
            </div>
            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>জাপানে পড়ার কারণ</label>
                <div className="p-3 rounded-lg text-[11px] leading-relaxed whitespace-pre-wrap" style={{ background: t.inputBg, color: t.text }}>
                  {student.reason_for_study || "—"}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ভবিষ্যৎ পরিকল্পনা</label>
                <div className="p-3 rounded-lg text-[11px] leading-relaxed whitespace-pre-wrap" style={{ background: t.inputBg, color: t.text }}>
                  {student.future_plan || "—"}
                </div>
              </div>
              <ReadOnlyField label="অধ্যয়নের বিষয়" value={student.study_subject} />
            </div>
          </Card>

          {/* ── পরিবারের সদস্য (Family Members) ── */}
          {familyMembers.length > 0 && (
            <Card delay={250}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: t.muted }}>
                <Users size={12} /> {tr("students.familyMembers")}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      {["নাম", "সম্পর্ক", "পেশা", "ফোন", "NID"].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {familyMembers.map((fm, i) => (
                      <tr key={fm.id || i} style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={ev => ev.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                        <td className="py-2 px-3 font-medium">{fm.name || fm.name_en || "—"}</td>
                        <td className="py-2 px-3">{fm.relationship || "—"}</td>
                        <td className="py-2 px-3">{fm.occupation || "—"}</td>
                        <td className="py-2 px-3">{fm.phone || "—"}</td>
                        <td className="py-2 px-3" style={{ color: t.muted }}>{fm.nid || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── অভ্যন্তরীণ তথ্য (Internal Notes + Google Drive) ── */}
          <Card delay={300}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.muted }}>
                <StickyNote size={12} /> অভ্যন্তরীণ তথ্য
              </h4>
              <button onClick={() => openSectionEdit("internal")}
                className="text-[10px] px-2 py-1 rounded-lg transition"
                style={{ color: t.cyan }}
                onMouseEnter={e => e.currentTarget.style.background = `${t.cyan}15`}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                ✏️ Edit
              </button>
            </div>
            <div className="space-y-3 text-xs">
              {/* Google Drive */}
              <div className="flex justify-between items-center">
                <span style={{ color: t.muted }} className="flex items-center gap-1.5"><LinkIcon size={11} /> Google Drive</span>
                {student.gdrive_folder_url ? (
                  <a href={student.gdrive_folder_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 font-medium hover:underline"
                    style={{ color: t.cyan }}>
                    Drive ফোল্ডার খুলুন
                  </a>
                ) : <span style={{ color: t.muted }}>—</span>}
              </div>
              {/* Internal Notes */}
              <div>
                <span className="flex items-center gap-1.5 mb-1.5" style={{ color: t.muted }}><MessageSquare size={11} /> অভ্যন্তরীণ নোট</span>
                <div className="p-3 rounded-lg text-[11px] leading-relaxed whitespace-pre-wrap" style={{ background: t.inputBg, color: t.text }}>
                  {student.internal_notes || "কোনো নোট নেই"}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════
          TAB 3: FEES — ফি কাঠামো ও পেমেন্ট
      ══════════════════════════════════════ */}
      {activeTab === "fees" && (
        <>
          {/* Header with action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <CreditCard size={14} style={{ color: t.cyan }} /> {tr("students.feeStructure")}
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" icon={Plus} size="xs" onClick={() => { setShowFeeItemForm(true); }}>{tr("students.addFeeItem")}</Button>
              <Button icon={Plus} size="xs" onClick={() => { setShowPayForm(true); }}>{tr("students.addPayment")}</Button>
            </div>
          </div>

          {/* Summary row — 3 stat boxes */}
          <div className="grid grid-cols-3 gap-3">
            <Card delay={30}>
              <p className="text-[10px] mb-1" style={{ color: t.muted }}>{tr("students.totalFee")}</p>
              <p className="text-lg font-bold">{taka(totalFee)}</p>
            </Card>
            <Card delay={40}>
              <div className="p-0">
                <p className="text-[10px] mb-1" style={{ color: t.muted }}>{tr("students.collected")}</p>
                <p className="text-lg font-bold" style={{ color: t.emerald }}>{taka(totalPaid)}</p>
              </div>
            </Card>
            <Card delay={50}>
              <div className="p-0">
                <p className="text-[10px] mb-1" style={{ color: t.muted }}>{tr("students.balanceDue")}</p>
                <p className="text-lg font-bold" style={{ color: balance > 0 ? t.rose : t.emerald }}>{taka(Math.max(0, balance))}</p>
              </div>
            </Card>
          </div>

          {/* Overall progress bar */}
          <Card delay={60}>
            <div className="flex justify-between text-[10px] mb-2" style={{ color: t.muted }}>
              <span>সার্বিক পরিশোধ</span>
              <span>{Math.round(paidPercent)}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: t.inputBg }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${paidPercent}%`, background: paidPercent >= 100 ? t.emerald : paidPercent >= 50 ? t.cyan : t.amber }} />
            </div>
          </Card>

          {/* Fee Categories — per-category progress */}
          <Card delay={70}>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: t.muted }}>খাত অনুযায়ী ফি বিবরণ</p>
            {feeItems.length === 0 ? (
              <p className="text-xs py-3 text-center" style={{ color: t.muted }}>কোনো ফি খাত নির্ধারণ করা হয়নি — "ফি খাত" বাটনে ক্লিক করুন</p>
            ) : (
              <div className="space-y-2">
                {feeItems.map(item => {
                  const catCfg = CATEGORY_CONFIG[item.category] || {};
                  const paid = paidByCategory(item.category);
                  const due = item.amount - paid;
                  const pct = item.amount > 0 ? Math.min(100, (paid / item.amount) * 100) : 0;
                  return (
                    <div key={item.id} className="p-3 rounded-xl group" style={{ background: t.inputBg }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{catCfg.icon || "💰"}</span>
                        <span className="text-xs font-semibold flex-1">{item.label}</span>
                        <span className="text-xs font-bold">{taka(item.amount)}</span>
                        <button onClick={() => deleteFeeItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition"
                          style={{ color: t.rose }}
                          onMouseEnter={e => e.currentTarget.style.background = `${t.rose}15`}
                          onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; }}>
                          <X size={11} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]" style={{ color: t.muted }}>
                        <span style={{ color: t.emerald }}>কালেক্ট: {taka(paid)}</span>
                        <span style={{ color: due > 0 ? t.rose : t.emerald }}>বাকি: {taka(Math.max(0, due))}</span>
                        <div className="flex-1 h-1 rounded-full overflow-hidden ml-1" style={{ background: t.border }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: catCfg.color || t.cyan }} />
                        </div>
                        <span>{Math.round(pct)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Payment history */}
          <Card delay={80}>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: t.muted }}>{tr("students.paymentHistory")}</p>
            {payments.length === 0 ? (
              <p className="text-xs text-center py-3" style={{ color: t.muted }}>এখনো কোনো পেমেন্ট নেই</p>
            ) : (
              <div className="space-y-1.5">
                {[...payments].reverse().map((p) => {
                  const catCfg = CATEGORY_CONFIG[p.category] || {};
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs group"
                      style={{ background: t.inputBg }}>
                      <span className="text-base shrink-0">{catCfg.icon || "💰"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold" style={{ color: t.emerald }}>{taka(p.amount)}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: `${catCfg.color || t.cyan}20`, color: catCfg.color || t.cyan }}>{catCfg.label || p.category}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: t.border, color: t.muted }}>{p.method}</span>
                          {p.note && <span style={{ color: t.muted }}>{p.note}</span>}
                        </div>
                        <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: t.muted }}>
                          <Clock size={9} /> {p.date}
                        </p>
                      </div>
                      <button onClick={() => deletePayment(p.id)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 rounded"
                        style={{ color: t.rose }}
                        onMouseEnter={e => e.currentTarget.style.background = `${t.rose}15`}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; }}>
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════
          TAB 4: SPONSOR — Read-only + Edit Modal
      ══════════════════════════════════════ */}
      {activeTab === "sponsor" && (
        <>
          {/* Header with action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">👨‍👩‍👧</span>
              <h3 className="text-sm font-bold">{tr("students.sponsor")}</h3>
              {sponsor.name && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${t.emerald}15`, color: t.emerald }}>{sponsor.name} ({sponsor.relationship})</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" icon={Edit3} size="xs" onClick={() => { setSponsorForm({ ...sponsor }); setShowSponsorModal(true); }}>
                স্পনসর সম্পাদনা
              </Button>
              <Button variant="ghost" icon={Plus} size="xs" onClick={() => setShowAddBank(true)}>
                ব্যাংক যোগ
              </Button>
            </div>
          </div>

          {/* Basic Info — read-only */}
          <Card delay={50}>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: t.cyan }}>👤 মূল তথ্য</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2">
              {[
                { label: "নাম", key: "name" },
                { label: "সম্পর্ক", key: "relationship" },
                { label: "জন্ম তারিখ", key: "dob" },
                { label: "ফোন", key: "phone", isPhone: true },
                { label: "NID", key: "nid" },
                { label: "ঠিকানা", key: "address" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] uppercase tracking-wider block mb-0.5" style={{ color: t.muted }}>{f.label}</label>
                  <p className="text-xs font-medium py-1">{f.isPhone ? formatPhoneDisplay(sponsor[f.key]) : (sponsor[f.key] || "—")}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Business Info — read-only */}
          <Card delay={70}>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: t.purple }}>🏢 ব্যবসায়িক তথ্য</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2">
              {[
                { label: "প্রতিষ্ঠানের নাম", key: "company_name" },
                { label: "প্রতিষ্ঠানের ফোন", key: "company_phone", isPhone: true },
                { label: "প্রতিষ্ঠানের ঠিকানা", key: "company_address" },
                { label: "ট্রেড লাইসেন্স নম্বর", key: "trade_license_no" },
                { label: "ব্যবসায়িক ঠিকানা", key: "work_address" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] uppercase tracking-wider block mb-0.5" style={{ color: t.muted }}>{f.label}</label>
                  <p className="text-xs font-medium py-1">{f.isPhone ? formatPhoneDisplay(sponsor[f.key]) : (sponsor[f.key] || "—")}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Tax Info — read-only */}
          <Card delay={90}>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: t.amber }}>🧾 ট্যাক্স তথ্য</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-0.5" style={{ color: t.muted }}>TIN</label>
                <p className="text-xs font-medium py-1">{sponsor.tin || "—"}</p>
              </div>
              {["y1","y2","y3"].map(y => (
                <div key={y}>
                  <label className="text-[10px] uppercase tracking-wider block mb-0.5" style={{ color: t.muted }}>বার্ষিক আয় ({y === "y1" ? "১ম" : y === "y2" ? "২য়" : "৩য়"})</label>
                  <p className="text-xs font-medium py-1">{sponsor[`annual_income_${y}`] ? `৳${Number(sponsor[`annual_income_${y}`]).toLocaleString("en-IN")}` : "—"}</p>
                </div>
              ))}
              {["y1","y2","y3"].map(y => (
                <div key={`t${y}`}>
                  <label className="text-[10px] uppercase tracking-wider block mb-0.5" style={{ color: t.muted }}>কর প্রদান ({y === "y1" ? "১ম" : y === "y2" ? "২য়" : "৩য়"})</label>
                  <p className="text-xs font-medium py-1">{sponsor[`tax_${y}`] ? `৳${Number(sponsor[`tax_${y}`]).toLocaleString("en-IN")}` : "—"}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Bank Accounts — read-only list */}
          <Card delay={110}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: t.emerald }}>🏦 ব্যাংক অ্যাকাউন্ট</p>
            </div>
            <div className="space-y-2">
              {(sponsor.banks || []).length === 0 && <p className="text-xs py-2" style={{ color: t.muted }}>কোনো ব্যাংক অ্যাকাউন্ট নেই</p>}
              {(sponsor.banks || []).map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl group" style={{ background: t.inputBg }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{b.bank_name} — {b.branch}</p>
                    <p className="text-[10px]" style={{ color: t.muted }}>A/C: {b.account_no} | ব্যালেন্স: ৳{Number(b.balance || 0).toLocaleString("en-IN")} ({b.balance_date})</p>
                    <p className="text-[10px]" style={{ color: t.muted }}>{b.name_in_statement}</p>
                  </div>
                  <button onClick={() => removeBank(b.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded transition" style={{ color: t.rose }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Japan Expense — read-only */}
          <Card delay={130}>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: t.rose }}>🇯🇵 জাপান খরচ</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
              {[
                { label: "টিউশন ফি (JPY)", key: "tuition_jpy" },
                { label: "মাসিক জীবনযাত্রা (JPY)", key: "living_jpy_monthly" },
                { label: "বিনিময় হার (JPY→BDT)", key: "exchange_rate" },
                { label: "পেমেন্ট পদ্ধতি", key: "payment_method" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] uppercase tracking-wider block mb-0.5" style={{ color: t.muted }}>{f.label}</label>
                  <p className="text-xs font-medium py-1">{sponsor[f.key] || "—"}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* 経費支弁書 — Financial Sponsorship fields (read-only) */}
          <Card delay={150}>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: t.cyan }}>📋 経費支弁書 তথ্য</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-0.5" style={{ color: t.muted }}>স্পনসর বিবৃতি</label>
                <p className="text-xs font-medium py-1 whitespace-pre-wrap">{sponsor.statement || "—"}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-0.5" style={{ color: t.muted }}>স্বাক্ষরের তারিখ</label>
                <p className="text-xs font-medium py-1">{sponsor.sign_date || "—"}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-0.5" style={{ color: t.muted }}>ছাত্রের অ্যাকাউন্টে পেমেন্ট</label>
                <p className="text-xs font-medium py-1">{sponsor.payment_to_student ? "✅ হ্যাঁ" : "—"}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-0.5" style={{ color: t.muted }}>স্কুলের অ্যাকাউন্টে পেমেন্ট</label>
                <p className="text-xs font-medium py-1">{sponsor.payment_to_school ? "✅ হ্যাঁ" : "—"}</p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════
          TAB 5: TIMELINE — পূর্ণ combined timeline + note input
      ══════════════════════════════════════ */}
      {activeTab === "timeline" && (
        <>
          {/* Note input */}
          <Card delay={30}>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <MessageSquare size={14} style={{ color: t.cyan }} /> কার্যকলাপ লগ
            </h3>
            <div className="flex gap-2">
              <input
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addNote()}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                placeholder="নোট যোগ করুন... (Enter চাপুন)"
              />
              <button onClick={addNote}
                className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                style={{ background: `${t.cyan}20`, color: t.cyan }}
                onMouseEnter={e => e.currentTarget.style.background = `${t.cyan}30`}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = `${t.cyan}20`; }}>
                <Plus size={13} /> যোগ করুন
              </button>
            </div>
          </Card>

          {/* Full combined Timeline */}
          <Card delay={50}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">📅</span>
              <h3 className="text-sm font-bold">Timeline</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${t.cyan}15`, color: t.cyan }}>{activityLog.length + payments.length} ইভেন্ট</span>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-px" style={{ background: t.border }} />
              <div className="space-y-4">
                {buildTimeline().map((entry, i) => {
                  const color = TL_COLORS[entry.type] || t.muted;
                  return (
                    <div key={i} className="flex gap-4 relative pl-8">
                      <div className="absolute left-0 h-7 w-7 rounded-full flex items-center justify-center text-xs shrink-0"
                        style={{ background: `${color}15`, border: `2px solid ${color}40` }}>
                        {logIcon[entry.type] || "⚪"}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <p className="text-xs leading-snug" style={{ color: t.text }}>{entry.text}</p>
                        <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: t.muted }}>
                          <Clock size={9} /> {entry.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {buildTimeline().length === 0 && <p className="text-xs text-center py-3 pl-8" style={{ color: t.muted }}>কোনো ইভেন্ট নেই</p>}
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════
          MODALS — সব Modal এখানে একসাথে
      ══════════════════════════════════════ */}

      {/* ── Delete confirm Modal ── */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Student" size="sm">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${t.rose}10`, border: `1px solid ${t.rose}30` }}>
          <AlertTriangle size={20} style={{ color: t.rose }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: t.rose }}>স্টুডেন্ট ডিলিট করবেন?</p>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>{student.name_en} — এই অ্যাকশন undo করা যাবে না</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" size="xs" onClick={() => setShowDeleteConfirm(false)}>{tr("common.cancel")}</Button>
          <Button variant="danger" icon={Trash2} size="xs" onClick={() => { onDelete(student.id); onBack(); }}>{tr("common.confirm")} {tr("common.delete")}</Button>
        </div>
      </Modal>

      {/* ── Portal Access Modal ── */}
      <Modal isOpen={showPortalForm} onClose={() => setShowPortalForm(false)} title="Student Portal Access" size="md">
        <div className="space-y-3">
          {!portalAccess ? (
            <>
              <p className="text-xs" style={{ color: t.textSecondary }}>
                পোর্টাল চালু করলে স্টুডেন্ট <strong style={{ color: t.text }}>{student.phone}</strong> নম্বর দিয়ে লগইন করবে। একটি পাসওয়ার্ড সেট করুন:
              </p>
              <div className="flex items-center gap-3">
                <input type="text" value={portalPassword} onChange={e => setPortalPassword(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                  placeholder="পাসওয়ার্ড দিন (কমপক্ষে ৬ অক্ষর)" />
                <button onClick={async () => {
                  if (portalPassword.length < 6) { toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর"); return; }
                  try {
                    await api.post(`/students/${student.id}/portal-access`, { enabled: true, password: portalPassword });
                    setPortalAccess(true);
                    setShowPortalForm(false);
                    setPortalPassword("");
                    toast.success(`${student.name_en} — পোর্টাল চালু হয়েছে`);
                  } catch { toast.error("সার্ভার ত্রুটি"); }
                }} className="px-4 py-2 rounded-lg text-xs font-semibold text-white shrink-0"
                  style={{ background: t.emerald }}>
                  চালু করুন
                </button>
              </div>
              <p className="text-[10px]" style={{ color: t.muted }}>
                লগইন: ফোন <strong>{student.phone}</strong> + পাসওয়ার্ড → স্টুডেন্ট পোর্টাল
              </p>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-xs flex-1" style={{ color: t.textSecondary }}>
                পোর্টাল বন্ধ করলে স্টুডেন্ট আর লগইন করতে পারবে না। ডাটা মুছবে না।
              </p>
              <button onClick={async () => {
                try {
                  await api.post(`/students/${student.id}/portal-access`, { enabled: false });
                  setPortalAccess(false);
                  setShowPortalForm(false);
                  toast.success("পোর্টাল বন্ধ হয়েছে");
                } catch { toast.error("সার্ভার ত্রুটি"); }
              }} className="px-4 py-2 rounded-lg text-xs font-semibold text-white shrink-0"
                style={{ background: t.rose }}>
                নিশ্চিত — বন্ধ করুন
              </button>
              <button onClick={() => setShowPortalForm(false)}
                className="px-3 py-2 rounded-lg text-xs" style={{ color: t.muted }}>বাতিল</button>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Pause confirm Modal ── */}
      <Modal isOpen={showPauseConfirm} onClose={() => setShowPauseConfirm(false)} title="Pause Student" size="sm">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${t.amber}10`, border: `1px solid ${t.amber}30` }}>
          <span className="text-lg">⏸</span>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: t.amber }}>পাইপলাইন বিরতি দেবেন?</p>
            <p className="text-[10px]" style={{ color: t.muted }}>স্টুডেন্ট সাময়িক বিরতিতে যাবে — পরে Re-activate করা যাবে</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={() => setShowPauseConfirm(false)} className="text-xs px-2 py-1 rounded-lg" style={{ color: t.muted }}>না</button>
          <button onClick={() => { changeStatus("PAUSED", "পাইপলাইন বিরতি দেওয়া হয়েছে"); setShowPauseConfirm(false); }}
            className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: t.amber, color: "#fff" }}>বিরতি দিন</button>
        </div>
      </Modal>

      {/* ── Cancel confirm Modal ── */}
      <Modal isOpen={showCancelConfirm} onClose={() => setShowCancelConfirm(false)} title="Cancel Student" size="sm">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${t.rose}10`, border: `1px solid ${t.rose}30` }}>
          <AlertTriangle size={16} style={{ color: t.rose }} />
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: t.rose }}>পাইপলাইন বাতিল করবেন?</p>
            <p className="text-[10px]" style={{ color: t.muted }}>ভবিষ্যতে Re-activate করা যাবে</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={() => setShowCancelConfirm(false)} className="text-xs px-2 py-1 rounded-lg" style={{ color: t.muted }}>না</button>
          <button onClick={() => { changeStatus("CANCELLED", "পাইপলাইন বাতিল করা হয়েছে"); setShowCancelConfirm(false); }}
            className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: t.rose, color: "#fff" }}>বাতিল করুন</button>
        </div>
      </Modal>

      {/* ── সেকশন-ভিত্তিক Profile Edit Modal (md size) ── */}
      <Modal isOpen={!!editSection} onClose={() => setEditSection(null)}
        title={SECTION_TITLES[editSection] || "সম্পাদনা"}
        subtitle={`${student.name_en} — ${student.id}`} size="md">
        <div className="space-y-3">
          {/* Dynamic fields — editSection অনুযায়ী render */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getFields(editSection).map(f => {
              const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
              return (
                <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label}</label>
                  {f.type === "branch_select" ? (
                    <select value={sectionForm[f.key] || ""} onChange={e => setSectionForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is}>
                      <option value="">-- Select Branch --</option>
                      {branchOptions.map(b => <option key={b.id} value={b.name}>{b.name}{b.city ? ` (${b.city})` : ""}</option>)}
                    </select>
                  ) : f.type === "school_select" ? (
                    <select value={sectionForm[f.key] || ""} onChange={e => setSectionForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is}>
                      <option value="">-- Select School --</option>
                      {schoolOptions.map(s => <option key={s.id} value={s.name_en}>{s.name_en}{s.city ? ` (${s.city})` : ""}</option>)}
                    </select>
                  ) : f.type === "batch_select" ? (
                    <select value={sectionForm[f.key] || ""} onChange={e => setSectionForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is}>
                      <option value="">-- Select Batch --</option>
                      {batchOptions.map(b => <option key={b.id} value={b.name}>{b.name}{b.class_time ? ` (${b.class_time})` : ""}</option>)}
                    </select>
                  ) : f.type === "agent_select" ? (
                    <select value={sectionForm[f.key] || ""} onChange={e => setSectionForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is}>
                      <option value="">-- Select Agent --</option>
                      {agentOptions.map(a => <option key={a.id} value={a.id}>{a.name}{a.area ? ` (${a.area})` : ""}</option>)}
                    </select>
                  ) : f.type === "counselor_select" ? (
                    <select value={sectionForm[f.key] || ""} onChange={e => setSectionForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is}>
                      <option value="">-- Select Counselor --</option>
                      {staffOptions.map(u => <option key={u.id} value={u.name}>{u.name}{u.role ? ` (${u.role})` : ""}</option>)}
                    </select>
                  ) : f.type === "partner_select" ? (
                    <select value={sectionForm[f.key] || ""} onChange={e => setSectionForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is}>
                      <option value="">-- Select Partner Agency --</option>
                      {partnerOptions.map(p => <option key={p.id} value={p.id}>{p.name}{p.contact_person ? ` (${p.contact_person})` : ""}</option>)}
                    </select>
                  ) : f.type === "select" ? (
                    <select value={sectionForm[f.key] || ""} onChange={e => setSectionForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is}>
                      {(f.options || []).map(o => <option key={o} value={o}>{o || "—"}</option>)}
                    </select>
                  ) : f.type === "date" ? (
                    <input type="date" value={sectionForm[f.key] || ""} onChange={e => setSectionForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} />
                  ) : f.type === "textarea" ? (
                    <textarea value={sectionForm[f.key] || ""} onChange={e => setSectionForm(p => ({ ...p, [f.key]: e.target.value }))}
                      rows={3} className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-y" style={is}
                      placeholder={f.key === "gdrive_folder_url" ? "https://drive.google.com/drive/folders/..." : ""} />
                  ) : f.type === "phone" ? (
                    <PhoneInput value={sectionForm[f.key] || ""} onChange={v => setSectionForm(p => ({ ...p, [f.key]: v }))} size="sm" />
                  ) : (
                    <input type="text" value={sectionForm[f.key] || ""} onChange={e => setSectionForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} />
                  )}
                </div>
              );
            })}
          </div>
          {/* Save / Cancel buttons */}
          <div className="flex gap-2 justify-end pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <Button variant="ghost" size="sm" onClick={() => setEditSection(null)}>{tr("common.cancel")}</Button>
            <Button size="sm" icon={Save} onClick={handleSectionSave}>{tr("common.save")}</Button>
          </div>
        </div>
      </Modal>

      {/* ── Sponsor Edit Modal (xl size) ── */}
      <Modal isOpen={showSponsorModal} onClose={() => setShowSponsorModal(false)} title="স্পনসর সম্পাদনা" subtitle={sponsor.name || "নতুন স্পনসর"} size="xl">
        <div className="space-y-5">
          {/* Basic Info */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: t.cyan }}>👤 মূল তথ্য</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "নাম", key: "name" },
                { label: "সম্পর্ক", key: "relationship", type: "select", opts: ["Father","Mother","Brother","Sister","Uncle","Aunt","Other"] },
                { label: "জন্ম তারিখ", key: "dob", type: "date" },
                { label: "ফোন", key: "phone", type: "phone" },
                { label: "NID", key: "nid" },
                { label: "ঠিকানা", key: "address" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] block mb-1" style={{ color: t.muted }}>{f.label}</label>
                  {f.type === "select" ? (
                    <select value={sponsorForm[f.key] || ""} onChange={e => sf(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                      {f.opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : f.type === "date" ? (
                    <input type="date" value={sponsorForm[f.key] || ""} onChange={e => sf(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  ) : f.type === "phone" ? (
                    <PhoneInput value={sponsorForm[f.key] || ""} onChange={v => sf(f.key, v)} size="sm" />
                  ) : (
                    <input value={sponsorForm[f.key] || ""} onChange={e => sf(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Business */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: t.purple }}>🏢 ব্যবসায়িক তথ্য</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "প্রতিষ্ঠানের নাম", key: "company_name" },
                { label: "প্রতিষ্ঠানের ফোন", key: "company_phone", type: "phone" },
                { label: "প্রতিষ্ঠানের ঠিকানা", key: "company_address" },
                { label: "ট্রেড লাইসেন্স নম্বর", key: "trade_license_no" },
                { label: "ব্যবসায়িক ঠিকানা", key: "work_address" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] block mb-1" style={{ color: t.muted }}>{f.label}</label>
                  {f.type === "phone" ? (
                    <PhoneInput value={sponsorForm[f.key] || ""} onChange={v => sf(f.key, v)} size="sm" />
                  ) : (
                    <input value={sponsorForm[f.key] || ""} onChange={e => sf(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tax */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: t.amber }}>🧾 ট্যাক্স তথ্য</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] block mb-1" style={{ color: t.muted }}>TIN</label>
                <input value={sponsorForm.tin || ""} onChange={e => sf("tin", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
              </div>
              {["y1","y2","y3"].map(y => (
                <div key={y}>
                  <label className="text-[10px] block mb-1" style={{ color: t.muted }}>বার্ষিক আয় ({y === "y1" ? "১ম" : y === "y2" ? "২য়" : "৩য়"})</label>
                  <input type="number" value={sponsorForm[`annual_income_${y}`] || ""} onChange={e => sf(`annual_income_${y}`, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} placeholder="৳" />
                </div>
              ))}
              {["y1","y2","y3"].map(y => (
                <div key={`t${y}`}>
                  <label className="text-[10px] block mb-1" style={{ color: t.muted }}>কর প্রদান ({y === "y1" ? "১ম" : y === "y2" ? "২য়" : "৩য়"})</label>
                  <input type="number" value={sponsorForm[`tax_${y}`] || ""} onChange={e => sf(`tax_${y}`, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} placeholder="৳" />
                </div>
              ))}
            </div>
          </div>

          {/* Japan Expense */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: t.rose }}>🇯🇵 জাপান খরচ</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "টিউশন ফি (JPY)", key: "tuition_jpy" },
                { label: "মাসিক জীবনযাত্রা (JPY)", key: "living_jpy_monthly" },
                { label: "বিনিময় হার (JPY→BDT)", key: "exchange_rate" },
                { label: "পেমেন্ট পদ্ধতি", key: "payment_method", type: "select", opts: ["Bank Transfer","Wire Transfer","Cheque","Cash","Other"] },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] block mb-1" style={{ color: t.muted }}>{f.label}</label>
                  {f.type === "select" ? (
                    <select value={sponsorForm[f.key] || ""} onChange={e => sf(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                      {f.opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type="number" value={sponsorForm[f.key] || ""} onChange={e => sf(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 経費支弁書 — Financial Sponsorship Document fields */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: t.cyan }}>📋 経費支弁書 তথ্য</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-[10px] block mb-1" style={{ color: t.muted }}>স্পনসর বিবৃতি</label>
                <textarea value={sponsorForm.statement || ""} onChange={e => sf("statement", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-y"
                  rows={3} placeholder="কেন স্পনসর করছেন, সম্পর্ক বিবরণ..."
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
              </div>
              <div>
                <label className="text-[10px] block mb-1" style={{ color: t.muted }}>স্বাক্ষরের তারিখ</label>
                <input type="date" value={sponsorForm.sign_date || ""} onChange={e => sf("sign_date", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
              </div>
              <div className="flex items-center gap-6 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!sponsorForm.payment_to_student} onChange={e => sf("payment_to_student", e.target.checked)}
                    className="w-4 h-4 rounded accent-cyan-500" />
                  <span className="text-xs" style={{ color: t.text }}>ছাত্রের অ্যাকাউন্টে পেমেন্ট</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!sponsorForm.payment_to_school} onChange={e => sf("payment_to_school", e.target.checked)}
                    className="w-4 h-4 rounded accent-cyan-500" />
                  <span className="text-xs" style={{ color: t.text }}>স্কুলের অ্যাকাউন্টে পেমেন্ট</span>
                </label>
              </div>
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-2 justify-end pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <Button variant="ghost" size="xs" onClick={() => setShowSponsorModal(false)}>বাতিল</Button>
            <Button icon={Save} size="xs" onClick={saveSponsor}>সংরক্ষণ</Button>
          </div>
        </div>
      </Modal>

      {/* ── Fee Item Form Modal ── */}
      <Modal isOpen={showFeeItemForm} onClose={() => setShowFeeItemForm(false)} title="Add Fee Item" size="md">
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] block mb-1" style={{ color: t.muted }}>ফি ক্যাটাগরি <span className="req-star">*</span></label>
              <select value={feeItemForm.category}
                onChange={e => { const cat = FEE_CATEGORIES.find(c => c.id === e.target.value); setFeeItemForm(f => ({ ...f, category: e.target.value, label: cat?.label || "" })); }}
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                {FEE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: t.muted }}>পরিমাণ (৳) <span className="req-star">*</span></label>
              <input type="number" value={feeItemForm.amount}
                onChange={e => setFeeItemForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="যেমন: 30000"
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
            </div>
          </div>
          <div>
            <label className="text-[10px] block mb-1" style={{ color: t.muted }}>কাস্টম লেবেল (ঐচ্ছিক)</label>
            <input value={feeItemForm.label}
              onChange={e => setFeeItemForm(f => ({ ...f, label: e.target.value }))}
              placeholder="যেমন: কোর্স ফি — ব্যাচ April 2026"
              className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowFeeItemForm(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: t.muted }}>বাতিল</button>
            <button onClick={addFeeItem} className="text-xs px-4 py-1.5 rounded-lg font-bold" style={{ background: t.purple, color: "#fff" }}>যোগ করুন</button>
          </div>
        </div>
      </Modal>

      {/* ── Payment Form Modal ── */}
      <Modal isOpen={showPayForm} onClose={() => setShowPayForm(false)} title="Record Payment" size="md">
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] block mb-1" style={{ color: t.muted }}>ফি খাত <span className="req-star">*</span></label>
              <select value={payForm.category}
                onChange={e => setPayForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: t.inputBg, border: `1px solid ${!payForm.category ? t.rose : t.inputBorder}`, color: t.text }}>
                <option value="">— খাত বেছে নিন —</option>
                {feeItems.length > 0
                  ? feeItems.map(fi => <option key={fi.id} value={fi.category}>{CATEGORY_CONFIG[fi.category]?.icon} {fi.label}</option>)
                  : FEE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)
                }
              </select>
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: t.muted }}>পরিমাণ (৳) <span className="req-star">*</span></label>
              <input type="number" value={payForm.amount}
                onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="20000"
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] block mb-1" style={{ color: t.muted }}>পদ্ধতি</label>
              <select value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                {["Cash", "bKash", "Nagad", "Bank Transfer", "Rocket", "Card"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: t.muted }}>নোট (ঐচ্ছিক)</label>
              <input value={payForm.note}
                onChange={e => setPayForm(p => ({ ...p, note: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addPayment()}
                placeholder="যেমন: ১ম কিস্তি..."
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowPayForm(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: t.muted }}>বাতিল</button>
            <button onClick={addPayment} className="text-xs px-4 py-1.5 rounded-lg font-bold" style={{ background: t.cyan, color: "#fff" }}>সংরক্ষণ</button>
          </div>
        </div>
      </Modal>

      {/* ── Add Bank Account Modal ── */}
      <Modal isOpen={showAddBank} onClose={() => setShowAddBank(false)} title="Add Bank Account" size="md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
          {[
            { label: "ব্যাংকের নাম", key: "bank_name" }, { label: "শাখা", key: "branch" },
            { label: "অ্যাকাউন্ট নম্বর", key: "account_no" }, { label: "ব্যালেন্স", key: "balance" },
            { label: "ব্যালেন্স তারিখ", key: "balance_date", type: "date" },
            { label: "স্টেটমেন্টে নাম", key: "name_in_statement" },
            { label: "স্টেটমেন্টে ঠিকানা", key: "address_in_statement" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] block mb-1" style={{ color: t.muted }}>{f.label}</label>
              <input type={f.type || "text"} value={bankForm[f.key] || ""} onChange={e => setBankForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-2 py-1.5 rounded text-xs outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setShowAddBank(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: t.muted }}>বাতিল</button>
          <button onClick={addBank} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: t.emerald, color: "#fff" }}>যোগ করুন</button>
        </div>
      </Modal>
    </div>
  );
}
