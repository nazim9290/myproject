import { useState, useEffect, useRef } from "react";
import { Building, DollarSign, Eye, Globe, Download, Plus, CheckCircle, Layers, Save, X, Trash2, Type, Palette, Shield, Bell, Database, Settings as SettingsIcon, Users, GitBranch, FileText, Edit3, RotateCcw } from "lucide-react";
import { useTheme, useLabelSettings } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { api } from "../../hooks/useAPI";
import { API_URL } from "../../lib/api";
import { PIPELINE_STATUSES } from "../../data/students";
import { DEFAULT_STEPS_META } from "../../data/pipelineSteps";

// ── Administration ট্যাব কনফিগ ──
const ADMIN_TABS = [
  { key: "agency", label: "এজেন্সি তথ্য", icon: Building },
  { key: "appearance", label: "ডিজাইন ও থিম", icon: Palette },
  { key: "doc_types", label: "ডকুমেন্ট টাইপ", icon: FileText },
  { key: "pipeline", label: "পাইপলাইন সেটিংস", icon: GitBranch },
  { key: "branches", label: "ব্রাঞ্চ ম্যানেজমেন্ট", icon: Globe },
  { key: "notifications", label: "নোটিফিকেশন", icon: Bell },
  { key: "custom_fields", label: "কাস্টম ফিল্ড", icon: Layers },
  { key: "backup", label: "ডাটা ব্যাকআপ", icon: Database },
];

export default function SettingsPage({ isDark, setIsDark, students, visitors, stepConfigs, updateStepConfigs }) {
  const t = useTheme();
  const toast = useToast();
  const { labelSettings, updateLabelSettings } = useLabelSettings();
  const [activeTab, setActiveTab] = useState("agency");
  const [agencyName, setAgencyName] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [agencyEmail, setAgencyEmail] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [tradeLicense, setTradeLicense] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [agencyId, setAgencyId] = useState(null);

  // ── API থেকে agency data load ──
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("agencyos_user") || "{}");
    if (user.agency_id) {
      api.get(`/super-admin/agencies/${user.agency_id}`).then(data => {
        if (data) {
          setAgencyId(data.id);
          setAgencyName(data.name || "");
          setAgencyPhone(data.phone || "");
          setAgencyEmail(data.email || "");
          setAgencyAddress(data.address || "");
          setAgencyLogo(data.logo_url || "");
        }
      }).catch(() => {
        // Super admin API না থাকলে fallback
        setAgencyName(user.name || "AgencyBook");
      });
    }
  }, []);

  // ── এজেন্সি লোগো আপলোড ──
  const logoRef = useRef(null);
  const [agencyLogo, setAgencyLogo] = useState("");
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("ফাইল সাইজ সর্বোচ্চ 2MB"); return; }
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const token = localStorage.getItem("agencyos_token");
      const res = await fetch(`${API_URL}/auth/upload-logo`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await res.json();
      if (res.ok && data.logo_url) { setAgencyLogo(data.logo_url); toast.success("লোগো আপলোড হয়েছে!"); }
      else { toast.error(data.error || "আপলোড ব্যর্থ"); }
    } catch { toast.error("আপলোড করতে সমস্যা"); }
  };
  const [taxRate, setTaxRate] = useState("15");
  const [currency, setCurrency] = useState("BDT");
  const [customFields, setCustomFields] = useState([
    { id: "cf1", name: "Alternative Phone", type: "text", module: "students", required: false },
    { id: "cf2", name: "Referral Name", type: "text", module: "visitors", required: false },
  ]);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [fieldForm, setFieldForm] = useState({ name: "", type: "text", module: "students", required: false, options: "" });

  // ── Pipeline status customization ──
  const [pipelineStatuses, setPipelineStatuses] = useState([
    "VISITOR", "FOLLOW_UP", "ENROLLED", "IN_COURSE", "EXAM_PASSED", "DOC_COLLECTION",
    "SCHOOL_INTERVIEW", "DOC_SUBMITTED", "COE_RECEIVED", "VISA_GRANTED", "ARRIVED", "COMPLETED"
  ]);

  // ── Pipeline step checklist editing ──
  const [editingStep, setEditingStep] = useState(null);           // কোন step edit হচ্ছে
  const [editStepHint, setEditStepHint] = useState("");            // step hint text
  const [editStepNextLabel, setEditStepNextLabel] = useState("");   // next button label
  const [editStepIcon, setEditStepIcon] = useState("");             // step icon
  const [editChecklist, setEditChecklist] = useState([]);           // checklist items
  const [newItemText, setNewItemText] = useState("");               // নতুন item add করার text
  const [newItemReq, setNewItemReq] = useState(true);               // নতুন item required?
  const [editingItemId, setEditingItemId] = useState(null);         // কোন item inline edit হচ্ছে
  const [editItemText, setEditItemText] = useState("");             // edit করা item text

  // step edit শুরু করো
  const openStepEdit = (stepCode) => {
    const conf = stepConfigs?.[stepCode] || {};
    setEditingStep(stepCode);
    setEditStepHint(conf.hint || "");
    setEditStepNextLabel(conf.nextLabel || "");
    setEditStepIcon(conf.icon || "");
    setEditChecklist([...(conf.checklist || [])]);
    setNewItemText("");
    setEditingItemId(null);
  };

  // checklist-এ নতুন item add
  const addChecklistItem = () => {
    if (!newItemText.trim()) { toast.error("আইটেম টেক্সট দিন"); return; }
    const id = `${editingStep.toLowerCase()}_${Date.now()}`;
    setEditChecklist(prev => [...prev, { id, text: newItemText.trim(), req: newItemReq }]);
    setNewItemText("");
    setNewItemReq(true);
  };

  // checklist item delete
  const removeChecklistItem = (itemId) => {
    setEditChecklist(prev => prev.filter(i => i.id !== itemId));
  };

  // checklist item required toggle
  const toggleItemReq = (itemId) => {
    setEditChecklist(prev => prev.map(i => i.id === itemId ? { ...i, req: !i.req } : i));
  };

  // inline edit save
  const saveItemEdit = (itemId) => {
    if (!editItemText.trim()) return;
    setEditChecklist(prev => prev.map(i => i.id === itemId ? { ...i, text: editItemText.trim() } : i));
    setEditingItemId(null);
  };

  // সব পরিবর্তন save করো
  const saveStepConfig = () => {
    if (!editingStep || !updateStepConfigs) return;
    const updated = { ...stepConfigs };
    updated[editingStep] = {
      ...updated[editingStep],
      icon: editStepIcon,
      hint: editStepHint,
      nextLabel: editStepNextLabel,
      checklist: editChecklist,
    };
    updateStepConfigs(updated);
    toast.success(`${editingStep} — চেকলিস্ট সংরক্ষিত হয়েছে`);
    setEditingStep(null);
  };

  // সব কিছু ডিফল্টে রিসেট
  const resetToDefaults = () => {
    if (!updateStepConfigs) return;
    updateStepConfigs(DEFAULT_STEPS_META);
    toast.success("সব ধাপ ডিফল্ট ডেমো ডাটায় রিসেট হয়েছে");
    setEditingStep(null);
  };

  // ── Branch management — API connected ──
  const [branches, setBranches] = useState([]);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [branchForm, setBranchForm] = useState({ name: "", name_bn: "", city: "", address: "", address_bn: "", phone: "", email: "", manager: "", is_hq: false });
  const EMPTY_BRANCH = { name: "", name_bn: "", city: "", address: "", address_bn: "", phone: "", email: "", manager: "", is_hq: false };

  // API থেকে branch লোড
  useEffect(() => {
    api.get("/branches").then(data => { if (Array.isArray(data)) setBranches(data); }).catch(() => {});
  }, []);

  // Branch save (create/update)
  const saveBranch = async () => {
    if (!branchForm.name.trim()) { toast.error("ব্রাঞ্চ নাম দিন"); return; }
    try {
      if (editingBranchId) {
        const updated = await api.patch(`/branches/${editingBranchId}`, branchForm);
        setBranches(prev => prev.map(b => b.id === editingBranchId ? updated : b));
        toast.updated("ব্রাঞ্চ");
      } else {
        const created = await api.post("/branches", branchForm);
        setBranches(prev => [...prev, created]);
        toast.success("ব্রাঞ্চ যোগ হয়েছে");
      }
      setBranchForm(EMPTY_BRANCH);
      setShowBranchForm(false);
      setEditingBranchId(null);
    } catch (err) { toast.error(err.message || "সমস্যা হয়েছে"); }
  };

  const editBranch = (b) => {
    setBranchForm({ name: b.name, name_bn: b.name_bn || "", city: b.city || "", address: b.address || "", address_bn: b.address_bn || "", phone: b.phone || "", email: b.email || "", manager: b.manager || "", is_hq: b.is_hq || false });
    setEditingBranchId(b.id);
    setShowBranchForm(true);
  };

  const deleteBranch = async (id) => {
    try {
      await api.delete(`/branches/${id}`);
      setBranches(prev => prev.filter(b => b.id !== id));
      toast.success("ব্রাঞ্চ মুছে ফেলা হয়েছে");
    } catch (err) { toast.error(err.message); }
  };

  // ── Notification settings ──
  const [notifications, setNotifications] = useState({
    followUpReminder: true,
    visaExpiry: true,
    passportExpiry: true,
    paymentDue: true,
    batchStart: true,
    documentPending: false,
  });

  // ── Document Types management ──
  const [docTypes, setDocTypes] = useState([]);
  const [showDocTypeForm, setShowDocTypeForm] = useState(false);
  const [docTypeForm, setDocTypeForm] = useState({ name: "", name_bn: "", category: "personal" });
  const [docTypeFields, setDocTypeFields] = useState([]); // [{key, label, label_en, type}]
  const [editingDocTypeId, setEditingDocTypeId] = useState(null);
  const [deleteDocTypeId, setDeleteDocTypeId] = useState(null);

  useEffect(() => {
    api.get("/docdata/types").then(data => { if (Array.isArray(data)) setDocTypes(data); }).catch(() => {});
  }, []);

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  return (
    <div className="space-y-5 anim-fade">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><SettingsIcon size={20} /> Administration</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>এজেন্সি সেটিংস, ডিজাইন, ব্রাঞ্চ ও কনফিগারেশন — সব এখান থেকে পরিবর্তন করুন</p>
        </div>
      </div>

      {/* ── ট্যাব Navigation ── */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {ADMIN_TABS.map(tab => (
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

      {/* ═══════════════════ TAB CONTENT ═══════════════════ */}

      {/* ── এজেন্সি তথ্য ── */}
      {activeTab === "agency" && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay={50}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Building size={14} /> এজেন্সি তথ্য</h3>
            <Button icon={Save} size="xs" onClick={async () => {
              try {
                const token = localStorage.getItem("agencyos_token");
                const user = JSON.parse(localStorage.getItem("agencyos_user") || "{}");
                const res = await fetch(`${API_URL}/super-admin/agencies/${user.agency_id}`, {
                  method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ name: agencyName, phone: agencyPhone, email: agencyEmail, address: agencyAddress }),
                });
                if (res.ok) toast.success("এজেন্সি তথ্য সংরক্ষণ হয়েছে!");
                else toast.error("সংরক্ষণ ব্যর্থ");
              } catch { toast.error("সার্ভার ত্রুটি"); }
            }}>সংরক্ষণ</Button>
          </div>
          <div className="space-y-3">
            {[
              { label: "এজেন্সি নাম", value: agencyName, onChange: setAgencyName, placeholder: "Your Agency Name" },
              { label: "ব্রাঞ্চ", value: branch, onChange: setBranch, placeholder: "Branch Name" },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label}</label>
                <input value={f.value} onChange={(e) => f.onChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                  placeholder={f.placeholder} />
              </div>
            ))}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>এজেন্সি লোগো</label>
              <div className="flex items-center gap-3">
                {agencyLogo ? (
                  <img src={agencyLogo.startsWith("http") ? agencyLogo : `${API_URL.replace("/api", "")}${agencyLogo}`}
                    alt="Logo" className="h-14 w-14 rounded-xl object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-xl flex items-center justify-center text-2xl" style={{ background: `linear-gradient(135deg, ${t.cyan}, ${t.purple})` }}>
                    🎓
                  </div>
                )}
                <input ref={logoRef} type="file" accept=".jpg,.jpeg,.png,.webp,.svg" onChange={handleLogoUpload} className="hidden" />
                <button onClick={() => logoRef.current?.click()} className="px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textSecondary }}>
                  লোগো পরিবর্তন
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><DollarSign size={14} /> ফাইন্যান্স সেটিংস</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ট্যাক্স রেট (%)</label>
              <input value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                type="number" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>কারেন্সি</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                <option value="BDT">BDT (৳)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="EUR">EUR (€)</option>
                <option value="KRW">KRW (₩)</option>
              </select>
            </div>
          </div>
        </Card>

        <Card delay={150}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Eye size={14} /> অ্যাপিয়ারেন্স</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.inputBg }}>
              <div>
                <p className="text-sm font-medium">ডার্ক মোড</p>
                <p className="text-[10px]" style={{ color: t.muted }}>UI থিম পরিবর্তন করুন</p>
              </div>
              <button onClick={() => setIsDark(!isDark)}
                className="relative w-11 h-6 rounded-full transition-all duration-300"
                style={{ background: isDark ? t.cyan : `${t.muted}40` }}>
                <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300"
                  style={{ left: isDark ? "22px" : "2px" }} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.inputBg }}>
              <div>
                <p className="text-sm font-medium">ভাষা</p>
                <p className="text-[10px]" style={{ color: t.muted }}>ইন্টারফেস ভাষা</p>
              </div>
              <select className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0", color: t.text }}>
                <option>বাংলা + English</option>
                <option>English Only</option>
                <option>বাংলা Only</option>
              </select>
            </div>
          </div>
        </Card>

        <Card delay={200}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Globe size={14} /> দেশ কনফিগারেশন</h3>
          <div className="space-y-2">
            {[
              { country: "Japan 🇯🇵", pipeline: "20 steps", docs: "11 base + conditional", status: "active" },
              { country: "Germany 🇩🇪", pipeline: "15 steps", docs: "9 base + conditional", status: "active" },
              { country: "Korea 🇰🇷", pipeline: "18 steps", docs: "10 base + conditional", status: "active" },
            ].map((c) => (
              <div key={c.country} className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.inputBg }}>
                <div>
                  <p className="text-sm font-medium">{c.country}</p>
                  <p className="text-[10px]" style={{ color: t.muted }}>{c.pipeline} • {c.docs}</p>
                </div>
                <Badge color={t.emerald} size="xs">{c.status}</Badge>
              </div>
            ))}
            <button className="w-full py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              style={{ background: `${t.cyan}10`, color: t.cyan }}>
              <Plus size={12} /> নতুন দেশ যোগ করুন
            </button>
          </div>
        </Card>

        <Card delay={250}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Download size={14} /> ডেটা ব্যাকআপ ও এক্সপোর্ট</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.inputBg }}>
              <div>
                <p className="text-sm font-medium">অটো ব্যাকআপ</p>
                <p className="text-[10px]" style={{ color: t.muted }}>প্রতিদিন রাত ২:০০ AM এ সব ডেটা auto backup</p>
              </div>
              <button className="relative w-11 h-6 rounded-full transition-all duration-300" style={{ background: t.cyan }}>
                <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300" style={{ left: "22px" }} />
              </button>
            </div>

            <div className="p-3 rounded-xl" style={{ background: `${t.emerald}08`, border: `1px solid ${t.emerald}20` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} style={{ color: t.emerald }} />
                  <div>
                    <p className="text-xs font-medium" style={{ color: t.emerald }}>সর্বশেষ ব্যাকআপ সফল</p>
                    <p className="text-[10px]" style={{ color: t.muted }}>২২ মার্চ ২০২৬, ০২:০০ AM — ১২.৫ MB</p>
                  </div>
                </div>
                <Badge color={t.emerald} size="xs">✓ সফল</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>ম্যানুয়াল ব্যাকআপ</p>
              {[
                { icon: "📊", label: "সম্পূর্ণ ডেটাবেস ব্যাকআপ", sub: "সব টেবিলের সব ডেটা — JSON format", color: t.cyan,
                  onClick: () => {
                    const allData = { students, visitors, exportDate: new Date().toISOString(), version: "1.0" };
                    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url;
                    a.download = `AgencyBook_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click(); URL.revokeObjectURL(url);
                    toast.exported("Full Database Backup");
                  }
                },
                { icon: "🎓", label: "Students Export (CSV)", sub: "সব student data — CSV format", color: t.purple,
                  onClick: () => {
                    const headers = "ID,Name EN,Name BN,Phone,DOB,Gender,Passport,Status,Country,School,Batch,Source,Type,Created";
                    const rows = (students || []).map((s) => `${s.id},${s.name_en},${s.name_bn},${s.phone},${s.dob},${s.gender},${s.passport},${s.status},${s.country},${s.school},${s.batch},${s.source},${s.type},${s.created}`);
                    const csv = headers + "\n" + rows.join("\n");
                    const blob = new Blob([String.fromCharCode(0xFEFF) + csv], { type: "text/csv;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url;
                    a.download = `Students_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click(); URL.revokeObjectURL(url);
                    toast.exported(`Students CSV (${(students || []).length} records)`);
                  }
                },
                { icon: "🚶", label: "Visitors Export (CSV)", sub: "সব visitor data — CSV format", color: t.amber,
                  onClick: () => {
                    const headers = "ID,Name,Phone,Country,Source,Counselor,Status,Date,Notes";
                    const rows = (visitors || []).map((v) => `${v.id},"${v.name}",${v.phone},${v.country},${v.source},${v.counselor},${v.status},${v.date},"${v.notes || ''}"`);
                    const csv = headers + "\n" + rows.join("\n");
                    const blob = new Blob([String.fromCharCode(0xFEFF) + csv], { type: "text/csv;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url;
                    a.download = `Visitors_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click(); URL.revokeObjectURL(url);
                    toast.exported(`Visitors CSV (${(visitors || []).length} records)`);
                  }
                },
                { icon: "💰", label: "Financial Report Export", sub: "আয়-ব্যয় রিপোর্ট — CSV format", color: t.emerald,
                  onClick: () => {
                    const csv = "Date,Type,Category,Description,Amount\n" + new Date().toISOString().slice(0,10) + ",Income,course_fee,Sample Income,50000\n" + new Date().toISOString().slice(0,10) + ",Expense,salary,Sample Expense,30000";
                    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
                    Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `Financial_Report_${new Date().toISOString().slice(0,10)}.csv` }).click();
                    toast.exported("Financial Report");
                  }
                },
              ].map((item, i) => (
                <button key={i} onClick={item.onClick}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition"
                  style={{ background: "transparent", border: `1px solid ${t.border}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hoverBg; e.currentTarget.style.borderColor = item.color + "40"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = t.border; }}>
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{item.label}</p>
                    <p className="text-[10px]" style={{ color: t.muted }}>{item.sub}</p>
                  </div>
                  <Download size={14} style={{ color: item.color }} />
                </button>
              ))}
            </div>

            <div className="pt-2" style={{ borderTop: `1px solid ${t.border}` }}>
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.muted }}>ব্যাকআপ শিডিউল</p>
              <div className="flex gap-2">
                {["প্রতিদিন", "সাপ্তাহিক", "মাসিক"].map((opt, i) => (
                  <button key={opt} className="flex-1 py-2 rounded-lg text-xs font-medium transition"
                    style={{ background: i === 0 ? `${t.cyan}20` : t.inputBg, color: i === 0 ? t.cyan : t.muted, border: `1px solid ${i === 0 ? `${t.cyan}40` : t.inputBorder}` }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2" style={{ borderTop: `1px solid ${t.border}` }}>
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.muted }}>সাম্প্রতিক ব্যাকআপ</p>
              {[
                { date: "২২ মার্চ ২০২৬, ০২:০০", size: "12.5 MB" },
                { date: "২১ মার্চ ২০২৬, ০২:০০", size: "12.3 MB" },
                { date: "২০ মার্চ ২০২৬, ০২:০০", size: "12.1 MB" },
              ].map((b, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={10} style={{ color: t.emerald }} />
                    <span style={{ color: t.textSecondary }}>{b.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: t.muted }}>{b.size}</span>
                    <button className="text-[10px] font-medium" style={{ color: t.cyan }}>Download</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

      </div>}

      {/* ── ডিজাইন ও থিম ── */}
      {activeTab === "appearance" && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay={50}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Type size={14} /> লেবেল ডিজাইন সেটিংস</h3>
            <Button icon={Save} size="xs" onClick={() => toast.success("লেবেল সেটিংস সংরক্ষণ হয়েছে!")}>সংরক্ষণ</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>লেবেল ফন্ট সাইজ</label>
              <select value={labelSettings.labelSize} onChange={e => updateLabelSettings({ labelSize: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                <option value="9px">৯px (ছোট)</option>
                <option value="10px">১০px (ডিফল্ট)</option>
                <option value="11px">১১px</option>
                <option value="12px">১২px (মাঝারি)</option>
                <option value="13px">১৩px</option>
                <option value="14px">১৪px (বড়)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>লেবেল ফন্ট কালার</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "ডিফল্ট", value: "", color: t.muted },
                  { label: "সাদা", value: "#e2e8f0", color: "#e2e8f0" },
                  { label: "সায়ান", value: "#06b6d4", color: "#06b6d4" },
                  { label: "বেগুনি", value: "#a855f7", color: "#a855f7" },
                  { label: "সবুজ", value: "#22c55e", color: "#22c55e" },
                  { label: "হলুদ", value: "#eab308", color: "#eab308" },
                ].map(c => (
                  <button key={c.label} onClick={() => updateLabelSettings({ labelColor: c.value })}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] transition"
                    style={{
                      background: labelSettings.labelColor === c.value ? `${c.color}20` : "transparent",
                      border: `1px solid ${labelSettings.labelColor === c.value ? c.color : t.border}`,
                      color: c.color,
                    }}>
                    <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-lg" style={{ background: t.inputBg }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: t.muted }}>প্রিভিউ</p>
            <label style={{ fontSize: labelSettings.labelSize, color: labelSettings.labelColor || t.muted }} className="uppercase tracking-wider font-medium">
              স্টুডেন্টের নাম <span className="req-star">*</span>
            </label>
          </div>
        </Card>

        {/* ── Dark/Light Mode Toggle ── */}
        <Card delay={80}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Eye size={14} /> থিম মোড</h3>
          <div className="flex gap-3">
            {[
              { label: "ডার্ক মোড", value: true, icon: "🌙" },
              { label: "লাইট মোড", value: false, icon: "☀️" },
            ].map(opt => (
              <button key={opt.label} onClick={() => setIsDark(opt.value)}
                className="flex-1 py-3 rounded-xl text-xs font-medium transition flex items-center justify-center gap-2"
                style={{
                  background: isDark === opt.value ? `${t.cyan}15` : t.inputBg,
                  border: `1px solid ${isDark === opt.value ? t.cyan : t.inputBorder}`,
                  color: isDark === opt.value ? t.cyan : t.muted,
                }}>
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </Card>
      </div>}

      {/* ── ডকুমেন্ট টাইপ ম্যানেজমেন্ট ── */}
      {activeTab === "doc_types" && <div className="space-y-5">
        <Card delay={50}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><FileText size={14} /> ডকুমেন্ট টাইপ তালিকা</h3>
            <Button icon={Plus} size="xs" onClick={() => { setShowDocTypeForm(true); setEditingDocTypeId(null); setDocTypeForm({ name: "", name_bn: "", category: "personal" }); setDocTypeFields([]); }}>নতুন টাইপ</Button>
          </div>

          {/* Add/Edit Form */}
          {showDocTypeForm && (
            <div className="mb-4 p-4 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নাম (English) <span className="req-star">*</span></label>
                  <input value={docTypeForm.name} onChange={e => setDocTypeForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Birth Certificate" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নাম (বাংলা)</label>
                  <input value={docTypeForm.name_bn} onChange={e => setDocTypeForm(p => ({ ...p, name_bn: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="জন্ম সনদ" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ক্যাটাগরি</label>
                  <select value={docTypeForm.category} onChange={e => setDocTypeForm(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option value="personal">ব্যক্তিগত</option>
                    <option value="academic">একাডেমিক</option>
                    <option value="financial">আর্থিক</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </div>
              </div>

              {/* Fields */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>Custom Fields ({docTypeFields.length})</label>
                  <button onClick={() => setDocTypeFields(prev => [...prev, { key: "", label: "", label_en: "", type: "text" }])}
                    className="text-[10px] px-2 py-1 rounded-lg" style={{ color: t.cyan, background: `${t.cyan}10` }}>+ Field যোগ</button>
                </div>
                <div className="space-y-2">
                  {docTypeFields.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={f.key} onChange={e => { const u = [...docTypeFields]; u[i] = { ...u[i], key: e.target.value }; setDocTypeFields(u); }}
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={is} placeholder="key (e.g. BirthRegNo)" />
                      <input value={f.label} onChange={e => { const u = [...docTypeFields]; u[i] = { ...u[i], label: e.target.value }; setDocTypeFields(u); }}
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={is} placeholder="লেবেল (বাংলা)" />
                      <input value={f.label_en} onChange={e => { const u = [...docTypeFields]; u[i] = { ...u[i], label_en: e.target.value }; setDocTypeFields(u); }}
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={is} placeholder="Label (English)" />
                      <select value={f.type} onChange={e => { const u = [...docTypeFields]; u[i] = { ...u[i], type: e.target.value }; setDocTypeFields(u); }}
                        className="px-2 py-1.5 rounded-lg text-xs outline-none w-20" style={is}>
                        <option value="text">Text</option><option value="date">Date</option><option value="select">Select</option>
                      </select>
                      <button onClick={() => setDocTypeFields(prev => prev.filter((_, j) => j !== i))} style={{ color: t.muted }}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="xs" icon={X} onClick={() => setShowDocTypeForm(false)}>বাতিল</Button>
                <Button size="xs" icon={Save} onClick={async () => {
                  if (!docTypeForm.name.trim()) { toast.error("নাম দিন"); return; }
                  try {
                    if (editingDocTypeId) {
                      const updated = await api.patch(`/docdata/types/${editingDocTypeId}`, { ...docTypeForm, fields: docTypeFields });
                      setDocTypes(prev => prev.map(d => d.id === editingDocTypeId ? updated : d));
                      toast.updated(docTypeForm.name);
                    } else {
                      const saved = await api.post("/docdata/types", { ...docTypeForm, fields: docTypeFields });
                      setDocTypes(prev => [...prev, saved]);
                      toast.success(`${docTypeForm.name} — যোগ হয়েছে`);
                    }
                    setShowDocTypeForm(false);
                  } catch (err) { toast.error(err.message); }
                }}>সংরক্ষণ</Button>
              </div>
            </div>
          )}

          {/* List */}
          <div className="space-y-2">
            {docTypes.map(dt => (
              <div key={dt.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: t.inputBg }}>
                <div className="flex items-center gap-3">
                  <FileText size={14} style={{ color: dt.category === "personal" ? t.cyan : dt.category === "academic" ? t.purple : t.amber }} />
                  <div>
                    <p className="text-xs font-semibold">{dt.name_bn || dt.name} <span className="font-normal" style={{ color: t.muted }}>({dt.name})</span></p>
                    <p className="text-[10px]" style={{ color: t.muted }}>{(dt.fields || []).length} fields • {dt.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => {
                    setEditingDocTypeId(dt.id);
                    setDocTypeForm({ name: dt.name, name_bn: dt.name_bn || "", category: dt.category || "personal" });
                    setDocTypeFields(dt.fields || []);
                    setShowDocTypeForm(true);
                  }} className="text-[10px] px-2 py-1 rounded-lg" style={{ color: t.cyan }}>Edit</button>
                  {deleteDocTypeId === dt.id ? (
                    <div className="flex gap-1">
                      <button onClick={async () => {
                        try { await api.del(`/docdata/types/${dt.id}`); setDocTypes(prev => prev.filter(d => d.id !== dt.id)); toast.success("মুছে ফেলা হয়েছে"); } catch (err) { toast.error(err.message); }
                        setDeleteDocTypeId(null);
                      }} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: t.rose, color: "#fff" }}>মুছুন</button>
                      <button onClick={() => setDeleteDocTypeId(null)} className="text-[10px] px-2 py-1" style={{ color: t.muted }}>না</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteDocTypeId(dt.id)} style={{ color: t.muted }}><Trash2 size={13} /></button>
                  )}
                </div>
              </div>
            ))}
            {docTypes.length === 0 && <p className="text-xs text-center py-4" style={{ color: t.muted }}>কোনো document type নেই</p>}
          </div>
        </Card>
      </div>}

      {/* ── পাইপলাইন সেটিংস — Dynamic Checklist Admin ── */}
      {activeTab === "pipeline" && <div className="space-y-5">
        {/* ── ধাপ তালিকা ── */}
        {!editingStep && (
          <Card delay={50}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2"><GitBranch size={14} /> পাইপলাইন ধাপ ও চেকলিস্ট</h3>
                <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>প্রতিটি ধাপে ক্লিক করে চেকলিস্ট আইটেম add/edit/delete করুন</p>
              </div>
              <Button variant="ghost" size="xs" icon={RotateCcw} onClick={resetToDefaults}>ডিফল্ট রিসেট</Button>
            </div>
            <div className="space-y-1.5">
              {pipelineStatuses.map((s, i) => {
                const ps = PIPELINE_STATUSES.find(p => p.code === s);
                const conf = stepConfigs?.[s] || {};
                const itemCount = (conf.checklist || []).length;
                const reqCount = (conf.checklist || []).filter(c => c.req).length;
                return (
                  <div key={s} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                    style={{ background: t.inputBg }}
                    onClick={() => openStepEdit(s)}
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = t.inputBg}>
                    <span className="text-[10px] font-mono w-6 text-center" style={{ color: t.muted }}>{i + 1}</span>
                    <span className="text-base">{conf.icon || "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{ps?.label || s}</span>
                        <span className="text-[9px] font-mono" style={{ color: t.muted }}>{s}</span>
                      </div>
                      <p className="text-[10px] truncate" style={{ color: t.muted }}>{conf.hint || "—"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px]" style={{ color: t.textSecondary }}>{itemCount} আইটেম</p>
                      <p className="text-[9px]" style={{ color: t.muted }}>{reqCount} আবশ্যক</p>
                    </div>
                    <Edit3 size={13} style={{ color: t.muted }} />
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── ধাপ Edit UI ── */}
        {editingStep && (() => {
          const ps = PIPELINE_STATUSES.find(p => p.code === editingStep);
          return (
            <div className="space-y-4">
              <Card delay={0}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditingStep(null)} className="p-1.5 rounded-lg transition" style={{ background: t.inputBg }}
                      onMouseEnter={e => e.currentTarget.style.background = t.hoverBg} onMouseLeave={e => e.currentTarget.style.background = t.inputBg}>
                      <X size={14} />
                    </button>
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <span className="text-base">{editStepIcon}</span>
                        {ps?.label || editingStep} — চেকলিস্ট সম্পাদনা
                      </h3>
                      <p className="text-[10px]" style={{ color: t.muted }}>ধাপ: {editingStep}</p>
                    </div>
                  </div>
                  <Button icon={Save} size="xs" onClick={saveStepConfig}>সংরক্ষণ</Button>
                </div>

                {/* ── Step meta fields ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>আইকন (Emoji)</label>
                    <input value={editStepIcon} onChange={e => setEditStepIcon(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                      placeholder="🚶" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পরবর্তী ধাপের বাটন টেক্সট</label>
                    <input value={editStepNextLabel} onChange={e => setEditStepNextLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                      placeholder="পরবর্তী ধাপে যান" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ধাপের বিবরণ / Hint</label>
                    <input value={editStepHint} onChange={e => setEditStepHint(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                      placeholder="এই ধাপে কী করতে হবে..." />
                  </div>
                </div>

                {/* ── চেকলিস্ট আইটেম তালিকা ── */}
                <div className="mb-3">
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.cyan }}>
                    চেকলিস্ট আইটেম ({editChecklist.length} টি)
                  </p>

                  <div className="space-y-1">
                    {editChecklist.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2 px-3 py-2 rounded-lg group"
                        style={{ background: t.inputBg }}>
                        <span className="text-[10px] font-mono w-5 text-center shrink-0" style={{ color: t.muted }}>{idx + 1}</span>

                        {/* Required toggle */}
                        <button onClick={() => toggleItemReq(item.id)} className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold transition"
                          style={{ background: item.req ? `${t.rose}15` : `${t.muted}15`, color: item.req ? t.rose : t.muted }}
                          title={item.req ? "আবশ্যক — ক্লিক করে ঐচ্ছিক করুন" : "ঐচ্ছিক — ক্লিক করে আবশ্যক করুন"}>
                          {item.req ? "আবশ্যক" : "ঐচ্ছিক"}
                        </button>

                        {/* Item text (inline edit) */}
                        {editingItemId === item.id ? (
                          <div className="flex-1 flex items-center gap-1">
                            <input value={editItemText} onChange={e => setEditItemText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveItemEdit(item.id); if (e.key === "Escape") setEditingItemId(null); }}
                              className="flex-1 px-2 py-1 rounded text-xs outline-none" autoFocus
                              style={{ background: t.card, border: `1px solid ${t.cyan}`, color: t.text }} />
                            <button onClick={() => saveItemEdit(item.id)} className="p-1 rounded" style={{ color: t.emerald }}><CheckCircle size={14} /></button>
                            <button onClick={() => setEditingItemId(null)} className="p-1 rounded" style={{ color: t.muted }}><X size={12} /></button>
                          </div>
                        ) : (
                          <span className="flex-1 text-xs cursor-pointer" style={{ color: t.text }}
                            onClick={() => { setEditingItemId(item.id); setEditItemText(item.text); }}>
                            {item.text}
                          </span>
                        )}

                        {/* Edit & Delete buttons */}
                        {editingItemId !== item.id && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                            <button onClick={() => { setEditingItemId(item.id); setEditItemText(item.text); }} className="p-1 rounded transition"
                              style={{ color: t.cyan }} title="এডিট করুন"><Edit3 size={12} /></button>
                            <button onClick={() => removeChecklistItem(item.id)} className="p-1 rounded transition"
                              style={{ color: t.rose }} title="মুছে ফেলুন"><Trash2 size={12} /></button>
                          </div>
                        )}
                      </div>
                    ))}

                    {editChecklist.length === 0 && (
                      <p className="text-xs text-center py-4" style={{ color: t.muted }}>কোনো আইটেম নেই — নিচে নতুন আইটেম যোগ করুন</p>
                    )}
                  </div>
                </div>

                {/* ── নতুন আইটেম যোগ ── */}
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: `${t.cyan}06`, border: `1px solid ${t.cyan}15` }}>
                  <Plus size={14} style={{ color: t.cyan }} />
                  <input value={newItemText} onChange={e => setNewItemText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addChecklistItem(); }}
                    className="flex-1 bg-transparent text-xs outline-none" style={{ color: t.text }}
                    placeholder="নতুন চেকলিস্ট আইটেম লিখুন..." />
                  <button onClick={() => setNewItemReq(!newItemReq)} className="shrink-0 px-2 py-1 rounded text-[9px] font-bold transition"
                    style={{ background: newItemReq ? `${t.rose}15` : `${t.muted}15`, color: newItemReq ? t.rose : t.muted }}>
                    {newItemReq ? "আবশ্যক" : "ঐচ্ছিক"}
                  </button>
                  <Button size="xs" onClick={addChecklistItem}>যোগ করুন</Button>
                </div>

                {/* ── Bottom actions ── */}
                <div className="flex items-center justify-between pt-3 mt-4" style={{ borderTop: `1px solid ${t.border}` }}>
                  <Button variant="ghost" size="xs" onClick={() => setEditingStep(null)}>বাতিল</Button>
                  <Button icon={Save} size="xs" onClick={saveStepConfig}>সংরক্ষণ করুন</Button>
                </div>
              </Card>
            </div>
          );
        })()}
      </div>}

      {/* ── ব্রাঞ্চ ম্যানেজমেন্ট — ঠিকানা, ফোন, ম্যানেজার সহ ── */}
      {activeTab === "branches" && <div className="space-y-5">
        <Card delay={50}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Globe size={14} /> ব্রাঞ্চ তালিকা</h3>
            <Button icon={Plus} size="xs" onClick={() => { setBranchForm(EMPTY_BRANCH); setEditingBranchId(null); setShowBranchForm(true); }}>নতুন ব্রাঞ্চ</Button>
          </div>

          {/* ── ব্রাঞ্চ ফর্ম (create/edit) ── */}
          {showBranchForm && (
            <div className="mb-4 p-4 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <p className="text-xs font-semibold mb-3">{editingBranchId ? "ব্রাঞ্চ সম্পাদনা" : "নতুন ব্রাঞ্চ যোগ"}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ব্রাঞ্চ নাম (EN) *</label>
                  <input value={branchForm.name} onChange={e => setBranchForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="Dhaka (HQ)" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নাম (বাংলা)</label>
                  <input value={branchForm.name_bn} onChange={e => setBranchForm(p => ({ ...p, name_bn: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="ঢাকা (HQ)" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>শহর</label>
                  <input value={branchForm.city} onChange={e => setBranchForm(p => ({ ...p, city: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="ঢাকা" />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ঠিকানা (EN) — Excel {{sys_branch_address}}-এ যাবে</label>
                  <input value={branchForm.address} onChange={e => setBranchForm(p => ({ ...p, address: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="House 12, Road 4, Dhanmondi, Dhaka-1205" />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ঠিকানা (বাংলা)</label>
                  <input value={branchForm.address_bn} onChange={e => setBranchForm(p => ({ ...p, address_bn: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="বাড়ি ১২, রোড ৪, ধানমন্ডি, ঢাকা-১২০৫" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ফোন</label>
                  <input value={branchForm.phone} onChange={e => setBranchForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="02-9876543" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ইমেইল</label>
                  <input value={branchForm.email} onChange={e => setBranchForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="dhaka@agency.com" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ম্যানেজার</label>
                  <input value={branchForm.manager} onChange={e => setBranchForm(p => ({ ...p, manager: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="Branch Manager নাম" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={branchForm.is_hq} onChange={e => setBranchForm(p => ({ ...p, is_hq: e.target.checked }))} className="rounded" style={{ accentColor: t.cyan }} />
                  <span className="text-xs" style={{ color: t.text }}>প্রধান কার্যালয় (HQ)</span>
                </label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="xs" icon={X} onClick={() => { setShowBranchForm(false); setEditingBranchId(null); }}>বাতিল</Button>
                  <Button size="xs" icon={Save} onClick={saveBranch}>সংরক্ষণ</Button>
                </div>
              </div>
            </div>
          )}

          {/* ── ব্রাঞ্চ তালিকা ── */}
          {branches.length === 0 ? (
            <p className="text-center py-6 text-xs" style={{ color: t.muted }}>কোনো ব্রাঞ্চ নেই — উপরের বাটন থেকে যোগ করুন</p>
          ) : (
            <div className="space-y-3">
              {branches.map(b => (
                <div key={b.id} className="p-3 rounded-xl" style={{ background: `${t.cyan}06`, border: `1px solid ${t.border}` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: b.is_hq ? `${t.cyan}20` : `${t.muted}15`, color: b.is_hq ? t.cyan : t.muted }}>
                        {b.is_hq ? "HQ" : (b.city || b.name || "?").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-xs font-bold flex items-center gap-1.5">
                          {b.name_bn || b.name}
                          {b.is_hq && <Badge color={t.cyan} size="xs">HQ</Badge>}
                        </p>
                        {b.city && <p className="text-[10px]" style={{ color: t.muted }}>{b.city}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => editBranch(b)} className="p-1.5 rounded-lg" style={{ color: t.muted }}
                        onMouseEnter={e => e.currentTarget.style.color = t.cyan} onMouseLeave={e => e.currentTarget.style.color = t.muted}>
                        <Edit3 size={12} />
                      </button>
                      <button onClick={() => deleteBranch(b.id)} className="p-1.5 rounded-lg" style={{ color: t.muted }}
                        onMouseEnter={e => e.currentTarget.style.color = "#ef4444"} onMouseLeave={e => e.currentTarget.style.color = t.muted}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {/* ঠিকানা ও বিস্তারিত */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[10px]" style={{ color: t.textSecondary }}>
                    {b.address && <p>📍 {b.address}</p>}
                    {b.address_bn && <p>📍 {b.address_bn}</p>}
                    {b.phone && <p>📞 {b.phone}</p>}
                    {b.email && <p>✉️ {b.email}</p>}
                    {b.manager && <p>👤 {b.manager}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── সিস্টেম ভ্যারিয়েবল টিপ ── */}
        <Card delay={100}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: t.cyan }}>💡 Excel-এ ব্রাঞ্চ তথ্য ব্যবহার</h3>
          <p className="text-[10px]" style={{ color: t.muted }}>
            Excel template-এ <span className="font-mono px-1 rounded" style={{ background: `${t.cyan}15` }}>{"{{sys_branch_address}}"}</span> লিখলে
            স্টুডেন্টের ব্রাঞ্চের ঠিকানা auto-fill হবে।
            একইভাবে <span className="font-mono px-1 rounded" style={{ background: `${t.cyan}15` }}>{"{{sys_branch_phone}}"}</span>,
            <span className="font-mono px-1 rounded" style={{ background: `${t.cyan}15` }}>{"{{sys_branch_manager}}"}</span> ব্যবহার করুন।
          </p>
        </Card>
      </div>}

      {/* ── নোটিফিকেশন ── */}
      {activeTab === "notifications" && <div className="space-y-5">
        <Card delay={50}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Bell size={14} /> নোটিফিকেশন সেটিংস</h3>
          <div className="space-y-3">
            {[
              { key: "followUpReminder", label: "Follow-up রিমাইন্ডার", desc: "ভিজিটরের follow-up date হলে নোটিফিকেশন" },
              { key: "visaExpiry", label: "ভিসা মেয়াদ সতর্কতা", desc: "ভিসা মেয়াদ শেষ হওয়ার ৩০ দিন আগে" },
              { key: "passportExpiry", label: "পাসপোর্ট মেয়াদ সতর্কতা", desc: "পাসপোর্ট মেয়াদ শেষ হওয়ার ৬০ দিন আগে" },
              { key: "paymentDue", label: "পেমেন্ট বাকি আছে", desc: "ফি পেমেন্ট due date পার হলে" },
              { key: "batchStart", label: "ব্যাচ শুরুর তারিখ", desc: "নতুন ব্যাচ শুরু হওয়ার ৭ দিন আগে" },
              { key: "documentPending", label: "ডকুমেন্ট বাকি আছে", desc: "স্টুডেন্টের ডকুমেন্ট pending থাকলে" },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between p-3 rounded-lg" style={{ background: t.inputBg }}>
                <div>
                  <p className="text-xs font-semibold">{n.label}</p>
                  <p className="text-[10px]" style={{ color: t.muted }}>{n.desc}</p>
                </div>
                <button onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                  className="w-10 h-5 rounded-full transition-all relative"
                  style={{ background: notifications[n.key] ? t.cyan : t.inputBorder }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: notifications[n.key] ? 22 : 2 }} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>}

      {/* ── কাস্টম ফিল্ড ── */}
      {activeTab === "custom_fields" && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay={50}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Layers size={14} /> Custom Fields</h3>
            <Button icon={Plus} size="xs" onClick={() => setShowFieldForm(true)}>নতুন Field</Button>
          </div>

          {showFieldForm && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Field নাম <span className="req-star">*</span></label>
                  <input value={fieldForm.name} onChange={e => setFieldForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="যেমন: Emergency Contact" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ধরন</label>
                  <select value={fieldForm.type} onChange={e => setFieldForm(p => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="select">Select (Dropdown)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Module</label>
                  <select value={fieldForm.module} onChange={e => setFieldForm(p => ({ ...p, module: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option value="students">Students</option><option value="visitors">Visitors</option><option value="agents">Agents</option>
                  </select>
                </div>
                {fieldForm.type === "select" && (
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Options (comma separated)</label>
                    <input value={fieldForm.options} onChange={e => setFieldForm(p => ({ ...p, options: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Option 1, Option 2, Option 3" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={fieldForm.required} onChange={e => setFieldForm(p => ({ ...p, required: e.target.checked }))} />
                  <span style={{ color: t.textSecondary }}>Required field</span>
                </label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="xs" icon={X} onClick={() => setShowFieldForm(false)}>বাতিল</Button>
                  <Button icon={Save} size="xs" onClick={() => {
                    if (!fieldForm.name.trim()) { toast.error("Field নাম দিন"); return; }
                    setCustomFields(prev => [...prev, { id: `cf-${Date.now()}`, ...fieldForm }]);
                    setShowFieldForm(false);
                    setFieldForm({ name: "", type: "text", module: "students", required: false, options: "" });
                    toast.success("Custom field যোগ হয়েছে!");
                  }}>সংরক্ষণ</Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {customFields.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.inputBg }}>
                <div>
                  <p className="text-xs font-semibold">{f.name}</p>
                  <p className="text-[10px]" style={{ color: t.muted }}>{f.type} • {f.module}{f.required ? " • Required" : ""}</p>
                </div>
                <button onClick={() => { setCustomFields(prev => prev.filter(x => x.id !== f.id)); toast.deleted("Custom field"); }}
                  className="p-1.5 rounded-lg transition" style={{ color: t.muted }}
                  onMouseEnter={e => e.currentTarget.style.color = t.rose} onMouseLeave={e => e.currentTarget.style.color = t.muted}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {customFields.length === 0 && <p className="text-xs text-center py-4" style={{ color: t.muted }}>কোনো custom field নেই — উপরে "নতুন Field" বাটন চাপুন</p>}
          </div>
        </Card>
      </div>}

      {/* ── ডাটা ব্যাকআপ ── */}
      {activeTab === "backup" && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay={50}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Database size={14} /> ডাটা এক্সপোর্ট</h3>
          <div className="space-y-3">
            {[
              { icon: "📦", label: "Full Backup (JSON)", sub: "সব data — students, visitors, payments সহ", color: t.cyan,
                onClick: () => {
                  const allData = { students: students || [], visitors: visitors || [], exportDate: new Date().toISOString() };
                  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url;
                  a.download = `AgencyBook_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`;
                  a.click(); URL.revokeObjectURL(url);
                  toast.exported("Full Backup");
                }
              },
              { icon: "🎓", label: "Students (CSV)", sub: "সব student data", color: t.purple,
                onClick: () => {
                  const headers = "ID,Name,Phone,Status,Country,School,Batch";
                  const rows = (students || []).map(s => `${s.id},"${s.name_en}",${s.phone},${s.status},${s.country},${s.school},${s.batch}`);
                  const blob = new Blob(["\uFEFF" + headers + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
                  Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `Students_${new Date().toISOString().slice(0, 10)}.csv` }).click();
                  toast.exported("Students CSV");
                }
              },
              { icon: "🚶", label: "Visitors (CSV)", sub: "সব visitor data", color: t.amber,
                onClick: () => {
                  const headers = "ID,Name,Phone,Source,Status";
                  const rows = (visitors || []).map(v => `${v.id},"${v.name || v.name_en}",${v.phone},${v.source},${v.status}`);
                  const blob = new Blob(["\uFEFF" + headers + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
                  Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `Visitors_${new Date().toISOString().slice(0, 10)}.csv` }).click();
                  toast.exported("Visitors CSV");
                }
              },
            ].map((item, i) => (
              <button key={i} onClick={item.onClick}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition"
                style={{ background: "transparent", border: `1px solid ${t.border}` }}
                onMouseEnter={e => { e.currentTarget.style.background = t.hoverBg; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-[10px]" style={{ color: t.muted }}>{item.sub}</p>
                </div>
                <Download size={14} style={{ color: item.color }} />
              </button>
            ))}
          </div>
        </Card>
      </div>}
    </div>
  );
}
