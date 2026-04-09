import { useState, useEffect, useRef } from "react";
import { Building, DollarSign, Eye, Globe, Download, Plus, CheckCircle, Layers, Save, X, Trash2, Type, Palette, Shield, Bell, Database, Settings as SettingsIcon, Users, GitBranch, FileText, Edit3, RotateCcw, List, Calendar, RefreshCw, Paintbrush } from "lucide-react";
import { useTheme, useLabelSettings } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PhoneInput, { formatPhoneDisplay } from "../../components/ui/PhoneInput";
import { api } from "../../hooks/useAPI";
import { API_URL } from "../../lib/api";
import { PIPELINE_STATUSES } from "../../data/students";
import { DEFAULT_STEPS_META } from "../../data/pipelineSteps";
import ConditionalFormatRules from "../../components/ui/ConditionalFormatRules";
import DateInput, { formatDateDisplay } from "../../components/ui/DateInput";

// ── Administration ট্যাব কনফিগ — i18nKey দিয়ে translation ──
const ADMIN_TABS = [
  { key: "agency", i18nKey: "settings.agencyInfo", label: "এজেন্সি তথ্য", icon: Building },
  { key: "appearance", i18nKey: "settings.appearance", label: "ডিজাইন ও থিম", icon: Palette },
  { key: "doc_types", i18nKey: "settings.docTypes", label: "ডকুমেন্ট টাইপ", icon: FileText },
  { key: "pipeline", i18nKey: "settings.pipeline", label: "পাইপলাইন সেটিংস", icon: GitBranch },
  { key: "branches", i18nKey: "settings.branches", label: "ব্রাঞ্চ ম্যানেজমেন্ট", icon: Globe },
  { key: "notifications", i18nKey: "settings.notifications", label: "নোটিফিকেশন", icon: Bell },
  { key: "custom_fields", i18nKey: "settings.customFields", label: "কাস্টম ফিল্ড", icon: Layers },
  { key: "holidays", i18nKey: "settings.holidays", label: "ছুটির তালিকা", icon: Calendar },
  { key: "conditional_format", i18nKey: "settings.conditionalFormat", label: "কন্ডিশনাল ফরম্যাটিং", icon: Paintbrush },
  { key: "backup", i18nKey: "settings.dataBackup", label: "ডাটা ব্যাকআপ", icon: Database },
];

// ── স্টুডেন্ট ফিল্ড — কন্ডিশনাল ফরম্যাটিংয়ে ব্যবহৃত ──
const STUDENT_FIELDS = [
  { key: "status", label: "Status" },
  { key: "name_en", label: "Name" },
  { key: "country", label: "Country" },
  { key: "school", label: "School" },
  { key: "batch", label: "Batch" },
  { key: "branch", label: "Branch" },
  { key: "source", label: "Source" },
  { key: "counselor", label: "Counselor" },
  { key: "student_type", label: "Type" },
  { key: "visa_type", label: "Visa Type" },
  { key: "gender", label: "Gender" },
  { key: "created", label: "Enrollment Date" },
  { key: "next_follow_up", label: "Next Follow-up" },
];

// ── ভিজিটর ফিল্ড — কন্ডিশনাল ফরম্যাটিংয়ে ব্যবহৃত ──
const VISITOR_FIELDS = [
  { key: "status", label: "Status" },
  { key: "name", label: "Name" },
  { key: "source", label: "Source" },
  { key: "branch", label: "Branch" },
  { key: "counselor", label: "Counselor" },
  { key: "interested_countries", label: "Countries" },
  { key: "interested_intake", label: "Intake" },
  { key: "budget_concern", label: "Budget Concern" },
  { key: "next_follow_up", label: "Next Follow-up" },
  { key: "date", label: "Visit Date" },
];

export default function SettingsPage({ isDark, setIsDark, students, visitors, stepConfigs, updateStepConfigs, currentUser }) {
  const t = useTheme();
  const toast = useToast();
  const { t: tr, lang, setLang, languages } = useLanguage();
  const { labelSettings, updateLabelSettings } = useLabelSettings();
  const isSuperAdmin = currentUser?.role === "owner" || currentUser?.role === "super_admin";
  const visibleTabs = ADMIN_TABS.filter(tab => tab.key !== "backup" || isSuperAdmin);
  const [activeTab, setActiveTab] = useState("agency");
  const [agencyName, setAgencyName] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [agencyEmail, setAgencyEmail] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [tradeLicense, setTradeLicense] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [agencyId, setAgencyId] = useState(null);

  // ── API থেকে নিজের agency data load ──
  useEffect(() => {
    api.get("/agency/me").then(data => {
      if (data) {
        setAgencyId(data.id);
        setAgencyName(data.name || "");
        setAgencyPhone(data.phone || "");
        setAgencyEmail(data.email || "");
        setAgencyAddress(data.address || "");
        setAgencyLogo(data.logo_url || "");
        setBranch(data.branch || "");
      }
    }).catch((err) => { console.error("[Settings Load]", err); toast.error(tr("settings.loadError")); });
  }, []);

  // ── এজেন্সি লোগো আপলোড ──
  const logoRef = useRef(null);
  const [agencyLogo, setAgencyLogo] = useState("");
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error(tr("settings.logoMaxSize")); return; }
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const token = localStorage.getItem("agencyos_token");
      const res = await fetch(`${API_URL}/auth/upload-logo`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await res.json();
      if (res.ok && data.logo_url) { setAgencyLogo(data.logo_url); toast.success(tr("settings.logoUploaded")); }
      else { toast.error(data.error || tr("settings.uploadFailed")); }
    } catch { toast.error(tr("settings.uploadError")); }
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
    if (!newItemText.trim()) { toast.error(tr("settings.enterItemText")); return; }
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
    toast.success(`${editingStep} — ${tr("settings.checklistSaved")}`);
    setEditingStep(null);
  };

  // সব কিছু ডিফল্টে রিসেট
  const resetToDefaults = () => {
    if (!updateStepConfigs) return;
    updateStepConfigs(DEFAULT_STEPS_META);
    toast.success(tr("settings.resetToDefaultsDone"));
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
    api.get("/branches").then(data => { if (Array.isArray(data)) setBranches(data); }).catch((err) => { console.error("[Branches Load]", err); toast.error(tr("settings.branchLoadError")); });
  }, []);

  // Branch save (create/update)
  const saveBranch = async () => {
    if (!branchForm.name.trim()) { toast.error(tr("settings.enterBranchName")); return; }
    try {
      if (editingBranchId) {
        const updated = await api.patch(`/branches/${editingBranchId}`, branchForm);
        setBranches(prev => prev.map(b => b.id === editingBranchId ? updated : b));
        toast.updated(tr("settings.branch"));
      } else {
        const created = await api.post("/branches", branchForm);
        setBranches(prev => [...prev, created]);
        toast.success(tr("settings.branchAdded"));
      }
      setBranchForm(EMPTY_BRANCH);
      setShowBranchForm(false);
      setEditingBranchId(null);
    } catch (err) { toast.error(err.message || tr("errors.saveFailed")); }
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
      toast.success(tr("settings.branchDeleted"));
    } catch (err) { toast.error(err.message); }
  };

  // ── Holiday management — সরকারি ছুটি (API connected) ──
  const [holidays, setHolidays] = useState([]);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ date: "", name: "", name_bn: "", recurring: false });
  const EMPTY_HOLIDAY = { date: "", name: "", name_bn: "", recurring: false };
  const [deletingHolidayId, setDeletingHolidayId] = useState(null);

  // API থেকে holiday লোড
  useEffect(() => {
    api.get("/holidays").then(data => { if (Array.isArray(data)) setHolidays(data); }).catch(() => {});
  }, []);

  // Holiday save (create)
  const saveHoliday = async () => {
    if (!holidayForm.date) { toast.error(tr("settings.enterDate")); return; }
    if (!holidayForm.name.trim()) { toast.error(tr("settings.enterHolidayName")); return; }
    try {
      const created = await api.post("/holidays", holidayForm);
      setHolidays(prev => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
      toast.success(tr("settings.holidayAdded"));
      setHolidayForm(EMPTY_HOLIDAY);
      setShowHolidayForm(false);
    } catch (err) { toast.error(err.message || tr("errors.saveFailed")); }
  };

  // Holiday delete
  const deleteHoliday = async (id) => {
    try {
      await api.del(`/holidays/${id}`);
      setHolidays(prev => prev.filter(h => h.id !== id));
      setDeletingHolidayId(null);
      toast.success(tr("settings.holidayDeleted"));
    } catch (err) { toast.error(err.message || tr("errors.deleteFailed")); }
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

  // ── Variables Viewer — doc type-এর সব placeholder দেখায় ──
  const [variablesDocType, setVariablesDocType] = useState(null);

  const copyVariable = (key) => {
    navigator.clipboard.writeText(`{{${key}}}`);
    toast.success(`${tr("settings.copied")} {{${key}}}`);
  };

  const copyAllVariables = (dt) => {
    const keys = (dt.fields || [])
      .filter(f => f.type !== "section_header" && f.type !== "repeatable")
      .map(f => `{{${f.key}}}`).join("\n");
    navigator.clipboard.writeText(keys);
    toast.success(`${dt.name} — ${tr("settings.allVarsCopied")}`);
  };

  // ── Field Editor state — doc type-এর fields add/remove/reorder ──
  const [fieldEditorDocType, setFieldEditorDocType] = useState(null);
  const [fieldEditorFields, setFieldEditorFields] = useState([]);
  const [savingFields, setSavingFields] = useState(false);
  const [newField, setNewField] = useState({ key: "", label_en: "", type: "text", required: false });

  const openFieldEditor = (dt) => {
    setFieldEditorDocType(dt);
    setFieldEditorFields(JSON.parse(JSON.stringify(dt.fields || [])));
    setSubjectEditorDocType(null); // close subject editor
  };

  const addNewField = () => {
    if (!newField.key.trim() || !newField.label_en.trim()) { toast.error(tr("settings.keyLabelRequired")); return; }
    const keyExists = fieldEditorFields.some(f => f.key === newField.key.trim());
    if (keyExists) { toast.error(tr("settings.fieldKeyExists")); return; }
    setFieldEditorFields(prev => [...prev, { ...newField, key: newField.key.trim(), label_en: newField.label_en.trim() }]);
    setNewField({ key: "", label_en: "", type: "text", required: false });
  };

  const removeField = (idx) => setFieldEditorFields(prev => prev.filter((_, i) => i !== idx));

  const moveField = (idx, dir) => {
    setFieldEditorFields(prev => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const saveFieldEditor = async () => {
    setSavingFields(true);
    try {
      await api.patch(`/docdata/types/${fieldEditorDocType.id}`, { fields: fieldEditorFields });
      setDocTypes(prev => prev.map(dt => dt.id === fieldEditorDocType.id ? { ...dt, fields: fieldEditorFields } : dt));
      toast.success(tr("settings.fieldsUpdated"));
      setFieldEditorDocType(null);
    } catch (err) { toast.error(err.message); }
    setSavingFields(false);
  };

  // ── Subject List Editor state — conditional_options সম্পাদনা ──
  const [subjectEditorDocType, setSubjectEditorDocType] = useState(null); // যে doc type edit হচ্ছে
  const [subjectEditorFields, setSubjectEditorFields] = useState(null);   // edited fields (deep copy)
  const [newSubjectInputs, setNewSubjectInputs] = useState({});           // { "Science": "", "Commerce": "" }
  const [savingSubjects, setSavingSubjects] = useState(false);

  // doc type-এ conditional_options আছে কিনা চেক করো
  const hasConditionalOptions = (dt) => {
    if (!dt?.fields) return false;
    return dt.fields.some(f => f.type === "repeatable" &&
      (f.subfields || []).some(sf => sf.conditional_options?.values));
  };

  // conditional_options সহ repeatable field ও subfield খুঁজে বের করো
  const getConditionalInfo = (fields) => {
    if (!fields) return null;
    for (const f of fields) {
      if (f.type === "repeatable") {
        for (const sf of (f.subfields || [])) {
          if (sf.conditional_options?.values) {
            return { repeatableKey: f.key, subfieldKey: sf.key, groups: sf.conditional_options.values, defaultList: sf.conditional_options.default || [] };
          }
        }
      }
    }
    return null;
  };

  // Subject Editor খোলো
  const openSubjectEditor = (dt) => {
    setSubjectEditorDocType(dt);
    setSubjectEditorFields(JSON.parse(JSON.stringify(dt.fields || [])));
    setNewSubjectInputs({});
  };

  // Subject Editor বন্ধ করো
  const closeSubjectEditor = () => {
    setSubjectEditorDocType(null);
    setSubjectEditorFields(null);
    setNewSubjectInputs({});
  };

  // একটি group-এ নতুন subject যোগ করো
  const addSubjectToGroup = (group) => {
    const val = (newSubjectInputs[group] || "").trim();
    if (!val) { toast.error(tr("settings.enterSubjectName")); return; }
    setSubjectEditorFields(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      for (const f of updated) {
        if (f.type === "repeatable") {
          for (const sf of (f.subfields || [])) {
            if (sf.conditional_options?.values?.[group]) {
              if (sf.conditional_options.values[group].includes(val)) { toast.error(`"${val}" ${tr("settings.alreadyExists")}`); return prev; }
              sf.conditional_options.values[group].push(val);
            }
          }
        }
      }
      return updated;
    });
    setNewSubjectInputs(prev => ({ ...prev, [group]: "" }));
  };

  // একটি group থেকে subject সরাও
  const removeSubjectFromGroup = (group, subject) => {
    setSubjectEditorFields(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      for (const f of updated) {
        if (f.type === "repeatable") {
          for (const sf of (f.subfields || [])) {
            if (sf.conditional_options?.values?.[group]) {
              sf.conditional_options.values[group] = sf.conditional_options.values[group].filter(s => s !== subject);
            }
          }
        }
      }
      return updated;
    });
  };

  // default list-এ subject যোগ/সরাও
  const addSubjectToDefault = () => {
    const val = (newSubjectInputs["__default__"] || "").trim();
    if (!val) { toast.error(tr("settings.enterSubjectName")); return; }
    setSubjectEditorFields(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      for (const f of updated) {
        if (f.type === "repeatable") {
          for (const sf of (f.subfields || [])) {
            if (sf.conditional_options) {
              if (!sf.conditional_options.default) sf.conditional_options.default = [];
              if (sf.conditional_options.default.includes(val)) { toast.error(`"${val}" ${tr("settings.alreadyExists")}`); return prev; }
              sf.conditional_options.default.push(val);
            }
          }
        }
      }
      return updated;
    });
    setNewSubjectInputs(prev => ({ ...prev, "__default__": "" }));
  };

  const removeSubjectFromDefault = (subject) => {
    setSubjectEditorFields(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      for (const f of updated) {
        if (f.type === "repeatable") {
          for (const sf of (f.subfields || [])) {
            if (sf.conditional_options?.default) {
              sf.conditional_options.default = sf.conditional_options.default.filter(s => s !== subject);
            }
          }
        }
      }
      return updated;
    });
  };

  // Subject changes সংরক্ষণ করো
  const saveSubjectChanges = async () => {
    if (!subjectEditorDocType || !subjectEditorFields) return;
    setSavingSubjects(true);
    try {
      const updated = await api.patch(`/docdata/types/${subjectEditorDocType.id}`, { fields: subjectEditorFields });
      setDocTypes(prev => prev.map(d => d.id === subjectEditorDocType.id ? updated : d));
      setSubjectEditorDocType(updated);
      setSubjectEditorFields(JSON.parse(JSON.stringify(updated.fields || [])));
      toast.success(`${subjectEditorDocType.name} — ${tr("settings.subjectListUpdated")}`);
    } catch (err) {
      toast.error(err.message || tr("errors.saveFailed"));
    } finally {
      setSavingSubjects(false);
    }
  };

  useEffect(() => {
    // Settings-এ সব doc types লোড (active + inactive) — Admin management-এর জন্য
    api.get("/docdata/types/all").then(data => { if (Array.isArray(data)) setDocTypes(data); }).catch((err) => { console.error("[DocTypes Load]", err); });
  }, []);

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  return (
    <div className="space-y-5 anim-fade">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><SettingsIcon size={20} /> {tr("settings.title")}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{tr("settings.subtitle")}</p>
        </div>
      </div>

      {/* ── ট্যাব Navigation ── */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {visibleTabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab === tab.key ? t.cardSolid : "transparent",
              color: activeTab === tab.key ? t.cyan : t.muted,
              boxShadow: activeTab === tab.key ? `0 1px 3px rgba(0,0,0,0.2)` : "none",
            }}>
            <tab.icon size={13} />
            {tab.i18nKey ? tr(tab.i18nKey) : tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ TAB CONTENT ═══════════════════ */}

      {/* ── এজেন্সি তথ্য ── */}
      {activeTab === "agency" && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay={50}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Building size={14} /> {tr("settings.agencyInfo")}</h3>
            <Button icon={Save} size="xs" onClick={async () => {
              try {
                await api.patch("/agency/me", { name: agencyName, branch, phone: agencyPhone, email: agencyEmail, address: agencyAddress });
                toast.success(tr("settings.agencyInfoSaved"));
              } catch { toast.error(tr("errors.saveFailed")); }
            }}>{tr("common.save")}</Button>
          </div>
          <div className="space-y-3">
            {[
              { label: tr("settings.agencyName"), value: agencyName, onChange: setAgencyName, placeholder: "Your Agency Name" },
              { label: tr("settings.branch"), value: branch, onChange: setBranch, placeholder: "Branch Name" },
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
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.agencyLogo")}</label>
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
                  {tr("settings.changeLogo")}
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><DollarSign size={14} /> {tr("settings.financeSettings")}</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.taxRate")}</label>
              <input value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                type="number" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.currency")}</label>
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
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Eye size={14} /> {tr("settings.appearance")}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.inputBg }}>
              <div>
                <p className="text-sm font-medium">{tr("settings.darkMode")}</p>
                <p className="text-[10px]" style={{ color: t.muted }}>{tr("settings.darkModeDesc")}</p>
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
                <p className="text-sm font-medium">{tr("settings.language")}</p>
                <p className="text-[10px]" style={{ color: t.muted }}>{tr("settings.languageDesc")}</p>
              </div>
              <select value={lang} onChange={e => setLang(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0", color: t.text }}>
                {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Card delay={200}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Globe size={14} /> {tr("settings.countryConfig")}</h3>
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
              <Plus size={12} /> {tr("settings.addCountry")}
            </button>
          </div>
        </Card>

        {isSuperAdmin && <Card delay={250}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Download size={14} /> {tr("settings.dataBackupExport")}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.inputBg }}>
              <div>
                <p className="text-sm font-medium">{tr("settings.autoBackup")}</p>
                <p className="text-[10px]" style={{ color: t.muted }}>{tr("settings.autoBackupDesc")}</p>
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
                    <p className="text-xs font-medium" style={{ color: t.emerald }}>{tr("settings.lastBackupSuccess")}</p>
                    <p className="text-[10px]" style={{ color: t.muted }}>২২ মার্চ ২০২৬, ০২:০০ AM — ১২.৫ MB</p>
                  </div>
                </div>
                <Badge color={t.emerald} size="xs">✓ {tr("settings.successful")}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{tr("settings.manualBackup")}</p>
              {[
                { icon: "📊", label: tr("settings.fullDbBackup"), sub: tr("settings.fullDbBackupDesc"), color: t.cyan,
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
                { icon: "🎓", label: tr("settings.studentsExportCsv"), sub: tr("settings.studentsExportCsvDesc"), color: t.purple,
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
                { icon: "🚶", label: tr("settings.visitorsExportCsv"), sub: tr("settings.visitorsExportCsvDesc"), color: t.amber,
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
                { icon: "💰", label: tr("settings.financialExport"), sub: tr("settings.financialExportDesc"), color: t.emerald,
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
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.muted }}>{tr("settings.backupSchedule")}</p>
              <div className="flex gap-2">
                {[tr("settings.daily"), tr("settings.weekly"), tr("settings.monthly")].map((opt, i) => (
                  <button key={opt} className="flex-1 py-2 rounded-lg text-xs font-medium transition"
                    style={{ background: i === 0 ? `${t.cyan}20` : t.inputBg, color: i === 0 ? t.cyan : t.muted, border: `1px solid ${i === 0 ? `${t.cyan}40` : t.inputBorder}` }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2" style={{ borderTop: `1px solid ${t.border}` }}>
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.muted }}>{tr("settings.recentBackups")}</p>
              {[
                { date: "২২ মার্চ ২০২৬, ০২:০০", size: "12.5 MB" },
                { date: "২১ মার্চ ২০২৬, ০২:০০", size: "12.3 MB" },
                { date: "২০ মার্চ ২০২৬, ০২:০০", size: "12.1 MB" },
              ].map((b, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={10} style={{ color: t.emerald }} />
                    <span style={{ color: t.textSecondary }}>{formatDateDisplay(b.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: t.muted }}>{b.size}</span>
                    <button className="text-[10px] font-medium" style={{ color: t.cyan }}>{tr("common.download")}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>}

      </div>}

      {/* ── ডিজাইন ও থিম ── */}
      {activeTab === "appearance" && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay={50}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Type size={14} /> {tr("settings.labelDesign")}</h3>
            <Button icon={Save} size="xs" onClick={() => toast.success(tr("settings.labelSettingsSaved"))}>{tr("common.save")}</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.labelFontSize")}</label>
              <select value={labelSettings.labelSize} onChange={e => updateLabelSettings({ labelSize: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                <option value="9px">{tr("settings.fontSize9")}</option>
                <option value="10px">{tr("settings.fontSize10")}</option>
                <option value="11px">{tr("settings.fontSize11")}</option>
                <option value="12px">{tr("settings.fontSize12")}</option>
                <option value="13px">{tr("settings.fontSize13")}</option>
                <option value="14px">{tr("settings.fontSize14")}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.labelFontColor")}</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: tr("settings.colorDefault"), value: "", color: t.muted },
                  { label: tr("settings.colorWhite"), value: "#e2e8f0", color: "#e2e8f0" },
                  { label: tr("settings.colorCyan"), value: "#06b6d4", color: "#06b6d4" },
                  { label: tr("settings.colorPurple"), value: "#a855f7", color: "#a855f7" },
                  { label: tr("settings.colorGreen"), value: "#22c55e", color: "#22c55e" },
                  { label: tr("settings.colorYellow"), value: "#eab308", color: "#eab308" },
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
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: t.muted }}>{tr("settings.preview")}</p>
            <label style={{ fontSize: labelSettings.labelSize, color: labelSettings.labelColor || t.muted }} className="uppercase tracking-wider font-medium">
              {tr("settings.previewStudentName")} <span className="req-star">*</span>
            </label>
          </div>
        </Card>

        {/* ── Dark/Light Mode Toggle ── */}
        <Card delay={80}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Eye size={14} /> {tr("settings.themeMode")}</h3>
          <div className="flex gap-3">
            {[
              { label: tr("settings.darkModeLabel"), value: true, icon: "🌙" },
              { label: tr("settings.lightModeLabel"), value: false, icon: "☀️" },
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
            <h3 className="text-sm font-semibold flex items-center gap-2"><FileText size={14} /> {tr("settings.docTypeList")}</h3>
            <Button icon={Plus} size="xs" onClick={() => { setShowDocTypeForm(true); setEditingDocTypeId(null); setDocTypeForm({ name: "", name_bn: "", category: "personal" }); setDocTypeFields([]); }}>{tr("settings.newDocType")}</Button>
          </div>

          {/* Add/Edit Form — Modal */}

          {/* List */}
          <div className="space-y-2">
            {docTypes.map(dt => (
              <div key={dt.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: t.inputBg, opacity: dt.is_active === false ? 0.6 : 1 }}>
                <div className="flex items-center gap-3">
                  <FileText size={14} style={{ color: dt.category === "personal" ? t.cyan : dt.category === "academic" ? t.purple : t.amber }} />
                  <div>
                    <p className="text-xs font-semibold">{dt.name_bn || dt.name} <span className="font-normal" style={{ color: t.muted }}>({dt.name})</span></p>
                    <p className="text-[10px]" style={{ color: t.muted }}>{(dt.fields || []).length} fields • {dt.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Active toggle — সক্রিয়/নিষ্ক্রিয় সুইচ */}
                  <button onClick={async () => {
                    const newActive = !(dt.is_active !== false);
                    try {
                      await api.patch(`/docdata/types/${dt.id}`, { is_active: newActive });
                      setDocTypes(prev => prev.map(d => d.id === dt.id ? { ...d, is_active: newActive } : d));
                      toast.success(newActive ? tr("settings.activated") : tr("settings.deactivated"));
                    } catch (err) { toast.error(err.message); }
                  }}
                    className="relative w-9 h-5 rounded-full transition-all shrink-0"
                    style={{ background: dt.is_active !== false ? t.emerald : `${t.muted}40` }}
                    title={dt.is_active !== false ? tr("common.active") : tr("common.inactive")}>
                    <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
                      style={{ left: dt.is_active !== false ? "18px" : "2px" }} />
                  </button>

                  {/* Student fillable toggle — Student portal থেকে পূরণযোগ্য কিনা */}
                  <button onClick={async () => {
                    const newVal = !dt.student_fillable;
                    try {
                      await api.patch(`/docdata/types/${dt.id}`, { student_fillable: newVal });
                      setDocTypes(prev => prev.map(d => d.id === dt.id ? { ...d, student_fillable: newVal } : d));
                      toast.success(newVal ? tr("settings.studentCanFill") : tr("settings.studentCannotFill"));
                    } catch (err) { toast.error(err.message); }
                  }}
                    className="text-[9px] px-1.5 py-0.5 rounded transition shrink-0"
                    style={{ background: dt.student_fillable ? `${t.purple}15` : `${t.muted}10`, color: dt.student_fillable ? t.purple : t.muted }}
                    title={dt.student_fillable ? tr("settings.studentFillableTitle") : tr("settings.staffOnlyTitle")}>
                    {dt.student_fillable ? `👨‍🎓 ${tr("settings.studentCanFillShort")}` : `🔒 ${tr("settings.staffOnlyShort")}`}
                  </button>

                  <div className="flex items-center gap-1">
                  <button onClick={() => setVariablesDocType(variablesDocType?.id === dt.id ? null : dt)}
                    className="text-[10px] px-2 py-1 rounded-lg flex items-center gap-1"
                    style={{ color: t.cyan, background: variablesDocType?.id === dt.id ? `${t.cyan}18` : "transparent" }}>
                    {"{{}}"}
                  </button>
                  <button onClick={() => openFieldEditor(dt)}
                    className="text-[10px] px-2 py-1 rounded-lg flex items-center gap-1"
                    style={{ color: t.emerald, background: fieldEditorDocType?.id === dt.id ? `${t.emerald}18` : "transparent" }}>
                    Fields
                  </button>
                  {hasConditionalOptions(dt) && (
                    <button onClick={() => openSubjectEditor(dt)}
                      className="text-[10px] px-2 py-1 rounded-lg flex items-center gap-1"
                      style={{ color: t.purple, background: subjectEditorDocType?.id === dt.id ? `${t.purple}18` : "transparent" }}>
                      <List size={11} /> Subjects
                    </button>
                  )}
                  <button onClick={() => {
                    setEditingDocTypeId(dt.id);
                    setDocTypeForm({ name: dt.name, name_bn: dt.name_bn || "", category: dt.category || "personal" });
                    setDocTypeFields(dt.fields || []);
                    setShowDocTypeForm(true);
                  }} className="text-[10px] px-2 py-1 rounded-lg" style={{ color: t.cyan }}>{tr("common.edit")}</button>
                  {deleteDocTypeId === dt.id ? (
                    <div className="flex gap-1">
                      <button onClick={async () => {
                        try { await api.del(`/docdata/types/${dt.id}`); setDocTypes(prev => prev.filter(d => d.id !== dt.id)); toast.success(tr("success.deleted")); } catch (err) { toast.error(err.message); }
                        setDeleteDocTypeId(null);
                      }} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: t.rose, color: "#fff" }}>{tr("common.delete")}</button>
                      <button onClick={() => setDeleteDocTypeId(null)} className="text-[10px] px-2 py-1" style={{ color: t.muted }}>{tr("common.no")}</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteDocTypeId(dt.id)} style={{ color: t.muted }}><Trash2 size={13} /></button>
                  )}
                  </div>
                </div>
              </div>
            ))}
            {docTypes.length === 0 && <p className="text-xs text-center py-4" style={{ color: t.muted }}>{tr("settings.noDocTypes")}</p>}
          </div>
        </Card>

        {/* ── Variables Viewer Modal ── */}
        <Modal isOpen={!!variablesDocType} onClose={() => setVariablesDocType(null)}
          title={variablesDocType ? `${variablesDocType.name} — ${tr("settings.templateVariables")}` : ""} subtitle={tr("settings.templateVariablesDesc")} size="lg">
          {variablesDocType && (
            <>
              <div className="flex justify-end mb-3">
                <button onClick={() => copyAllVariables(variablesDocType)} className="text-[10px] px-2 py-1 rounded-lg"
                  style={{ background: `${t.cyan}15`, color: t.cyan }}>{tr("settings.copyAll")}</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(variablesDocType.fields || []).filter(f => f.type !== "section_header").map(f => (
                  f.type === "repeatable" ? (
                    (f.subfields || []).map(sf => (
                      <button key={`${f.key}_${sf.key}`} onClick={() => copyVariable(`Member1_${sf.key}`)}
                        className="px-2 py-1 rounded-lg text-[10px] font-mono transition-all"
                        style={{ background: `${t.amber}12`, color: t.amber, border: `1px solid ${t.amber}25` }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${t.amber}25`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${t.amber}12`; }}>
                        {"{{"}Member1_{sf.key}{"}}"}
                      </button>
                    ))
                  ) : (
                    <button key={f.key} onClick={() => copyVariable(f.key)}
                      className="px-2 py-1 rounded-lg text-[10px] font-mono transition-all"
                      style={{ background: `${t.cyan}12`, color: t.cyan, border: `1px solid ${t.cyan}25` }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${t.cyan}25`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${t.cyan}12`; }}>
                      {`{{${f.key}}}`}
                    </button>
                  )
                ))}
              </div>

              {/* Syntax Guide */}
              <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${t.border}` }}>
                <h4 className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: t.purple }}>{tr("settings.syntaxGuide")}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                  <div className="p-3 rounded-lg" style={{ background: t.inputBg }}>
                    <p className="font-semibold mb-1.5" style={{ color: t.emerald }}>{tr("settings.dateFormats")}</p>
                    <div className="space-y-0.5 font-mono" style={{ color: t.textSecondary }}>
                      <p>{"{{dob:jp}}"} → 2000年11月13日</p>
                      <p>{"{{dob:slash}}"} → 2000/11/13</p>
                      <p>{"{{dob:dot}}"} → 13.11.2000</p>
                      <p>{"{{dob:dmy}}"} → 13/11/2000</p>
                      <p>{"{{dob:year}}"} → 2000</p>
                      <p>{"{{dob:month}}"} → 11</p>
                      <p>{"{{dob:day}}"} → 13</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: t.inputBg }}>
                    <p className="font-semibold mb-1.5" style={{ color: t.amber }}>{tr("settings.jpTranslation")}</p>
                    <div className="space-y-0.5 font-mono" style={{ color: t.textSecondary }}>
                      <p>{"{{gender:jp}}"} → Male=男, Female=女</p>
                      <p>{"{{nationality:jp}}"} → バングラデシュ</p>
                      <p>{"{{marital_status:jp}}"} → 未婚/既婚</p>
                      <p>{"{{blood_group:jp}}"} → A型(Rh+)</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: t.inputBg }}>
                    <p className="font-semibold mb-1.5" style={{ color: t.rose }}>{tr("settings.customMapping")}</p>
                    <div className="space-y-0.5 font-mono" style={{ color: t.textSecondary }}>
                      <p>{"{{field:map(A=X,B=Y)}}"}</p>
                      <p>{"{{gender:map(Male=男,Female=女)}}"}</p>
                      <p>{"{{country:map(Japan=日本)}}"}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: t.inputBg }}>
                    <p className="font-semibold mb-1.5" style={{ color: t.cyan }}>{tr("settings.nameParts")}</p>
                    <div className="space-y-0.5 font-mono" style={{ color: t.textSecondary }}>
                      <p>{"{{name_en:first}}"} → first word</p>
                      <p>{"{{name_en:last}}"} → rest</p>
                      <p>{"{{today}}"} → 2026-04-02</p>
                      <p>{"{{today_jp}}"} → 2026年4月2日</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Modal>

        {/* ── Field Editor Modal ── */}
        <Modal isOpen={!!fieldEditorDocType} onClose={() => setFieldEditorDocType(null)}
          title={fieldEditorDocType ? `${fieldEditorDocType.name} — ${tr("settings.fields")}` : ""} subtitle={tr("settings.fieldsSubtitle")} size="xl">
          {fieldEditorDocType && (
            <>
              {/* Field list */}
              <div className="space-y-1.5 mb-4">
                {fieldEditorFields.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ background: t.inputBg, border: `1px solid ${t.border}` }}>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveField(idx, -1)} disabled={idx === 0} className="text-[10px] px-1 rounded" style={{ color: idx === 0 ? t.muted : t.cyan }}>▲</button>
                      <button onClick={() => moveField(idx, 1)} disabled={idx === fieldEditorFields.length - 1} className="text-[10px] px-1 rounded" style={{ color: idx === fieldEditorFields.length - 1 ? t.muted : t.cyan }}>▼</button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold">{f.label_en || f.label || f.key}</span>
                      <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${t.purple}15`, color: t.purple }}>{f.type}</span>
                      {f.required && <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${t.rose}15`, color: t.rose }}>required</span>}
                      <span className="ml-2 text-[9px]" style={{ color: t.muted }}>key: {f.key}</span>
                    </div>
                    <button onClick={() => removeField(idx)} className="p-1 rounded" style={{ color: t.muted }}
                      onMouseEnter={e => e.currentTarget.style.color = t.rose} onMouseLeave={e => e.currentTarget.style.color = t.muted}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new field */}
              <div className="p-3 rounded-xl mb-4" style={{ background: `${t.emerald}06`, border: `1px solid ${t.emerald}20` }}>
                <p className="text-[10px] font-semibold mb-2" style={{ color: t.emerald }}>+ {tr("settings.addCustomField")}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <input value={newField.key} onChange={e => setNewField(p => ({ ...p, key: e.target.value.replace(/\s/g, "_") }))}
                    className="px-2 py-1.5 rounded-lg text-xs outline-none" style={is} placeholder="field_key" />
                  <input value={newField.label_en} onChange={e => setNewField(p => ({ ...p, label_en: e.target.value }))}
                    className="px-2 py-1.5 rounded-lg text-xs outline-none" style={is} placeholder="Label (English)" />
                  <select value={newField.type} onChange={e => setNewField(p => ({ ...p, type: e.target.value }))}
                    className="px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                    <option value="text">Text</option>
                    <option value="date">Date</option>
                    <option value="select">Select</option>
                    <option value="section_header">Section Header</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[10px]" style={{ color: t.muted }}>
                      <input type="checkbox" checked={newField.required} onChange={e => setNewField(p => ({ ...p, required: e.target.checked }))} /> Required
                    </label>
                    <button onClick={addNewField} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: t.emerald, color: "#fff" }}>{tr("common.add")}</button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button icon={Save} size="sm" onClick={saveFieldEditor} disabled={savingFields}>
                  {savingFields ? tr("common.saving") : tr("settings.saveFields")}
                </Button>
              </div>
            </>
          )}
        </Modal>

        {/* ── Subject List Editor Modal ── */}
        <Modal isOpen={!!(subjectEditorDocType && subjectEditorFields)} onClose={closeSubjectEditor}
          title={subjectEditorDocType ? `${subjectEditorDocType.name_bn || subjectEditorDocType.name} — ${tr("settings.subjectLists")}` : ""}
          subtitle={tr("settings.subjectListsDesc")} size="xl">
          {subjectEditorDocType && subjectEditorFields && (() => {
            const info = getConditionalInfo(subjectEditorFields);
            if (!info) return null;
            const groups = Object.entries(info.groups);
            const defaultList = (() => {
              for (const f of subjectEditorFields) {
                if (f.type === "repeatable") {
                  for (const sf of (f.subfields || [])) {
                    if (sf.conditional_options?.default) return sf.conditional_options.default;
                  }
                }
              }
              return [];
            })();

            return (
              <>
                <div className="space-y-4">
                  {/* ── প্রতিটি Group (Science, Commerce, Arts/Humanities ইত্যাদি) ── */}
                  {groups.map(([groupName, subjects]) => (
                    <div key={groupName} className="p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.border}` }}>
                      <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: t.purple }} />
                        {groupName}
                        <span className="font-normal" style={{ color: t.muted }}>({subjects.length} subjects)</span>
                      </p>

                      {/* বিদ্যমান subjects তালিকা */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {subjects.map(sub => (
                          <span key={sub} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px]"
                            style={{ background: `${t.purple}12`, color: t.text, border: `1px solid ${t.purple}25` }}>
                            {sub}
                            <button onClick={() => removeSubjectFromGroup(groupName, sub)}
                              className="ml-0.5 hover:opacity-80" style={{ color: t.rose }}>
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                        {subjects.length === 0 && <p className="text-[10px]" style={{ color: t.muted }}>{tr("settings.noSubjects")}</p>}
                      </div>

                      {/* নতুন subject যোগ করার input */}
                      <div className="flex items-center gap-2">
                        <input
                          value={newSubjectInputs[groupName] || ""}
                          onChange={e => setNewSubjectInputs(prev => ({ ...prev, [groupName]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") addSubjectToGroup(groupName); }}
                          className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none"
                          style={{ background: t.card, border: `1px solid ${t.inputBorder}`, color: t.text }}
                          placeholder={`${tr("settings.addSubjectPlaceholder")} (${groupName})...`}
                        />
                        <button onClick={() => addSubjectToGroup(groupName)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium"
                          style={{ background: `${t.purple}18`, color: t.purple, border: `1px solid ${t.purple}30` }}>
                          <Plus size={11} /> {tr("common.add")}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* ── Default Subject List (যখন কোনো group select না থাকে) ── */}
                  <div className="p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.border}` }}>
                    <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: t.amber }} />
                      {tr("settings.defaultSubjects")}
                      <span className="font-normal" style={{ color: t.muted }}>({tr("settings.defaultSubjectsDesc")})</span>
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {defaultList.map(sub => (
                        <span key={sub} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px]"
                          style={{ background: `${t.amber}12`, color: t.text, border: `1px solid ${t.amber}25` }}>
                          {sub}
                          <button onClick={() => removeSubjectFromDefault(sub)}
                            className="ml-0.5 hover:opacity-80" style={{ color: t.rose }}>
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                      {defaultList.length === 0 && <p className="text-[10px]" style={{ color: t.muted }}>{tr("settings.noDefaultSubjects")}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        value={newSubjectInputs["__default__"] || ""}
                        onChange={e => setNewSubjectInputs(prev => ({ ...prev, "__default__": e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") addSubjectToDefault(); }}
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none"
                        style={{ background: t.card, border: `1px solid ${t.inputBorder}`, color: t.text }}
                        placeholder={tr("settings.addDefaultSubjectPlaceholder")}
                      />
                      <button onClick={addSubjectToDefault}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium"
                        style={{ background: `${t.amber}18`, color: t.amber, border: `1px solid ${t.amber}30` }}>
                        <Plus size={11} /> {tr("common.add")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── সংরক্ষণ বাটন ── */}
                <div className="flex justify-end mt-4">
                  <Button icon={Save} size="sm" onClick={saveSubjectChanges} disabled={savingSubjects}>
                    {savingSubjects ? tr("common.saving") : tr("settings.saveChanges")}
                  </Button>
                </div>
              </>
            );
          })()}
        </Modal>

        {/* ── Doc Type Add/Edit Form Modal ── */}
        <Modal isOpen={showDocTypeForm} onClose={() => setShowDocTypeForm(false)}
          title={editingDocTypeId ? tr("settings.editDocType") : tr("settings.addDocType")} size="md">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.nameEn")} <span className="req-star">*</span></label>
                <input value={docTypeForm.name} onChange={e => setDocTypeForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Birth Certificate" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.nameBn")}</label>
                <input value={docTypeForm.name_bn} onChange={e => setDocTypeForm(p => ({ ...p, name_bn: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="জন্ম সনদ" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("common.category")}</label>
                <select value={docTypeForm.category} onChange={e => setDocTypeForm(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                  <option value="personal">{tr("settings.catPersonal")}</option>
                  <option value="academic">{tr("settings.catAcademic")}</option>
                  <option value="financial">{tr("settings.catFinancial")}</option>
                  <option value="other">{tr("settings.catOther")}</option>
                </select>
              </div>
            </div>

            {/* Fields */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>Custom Fields ({docTypeFields.length})</label>
                <button onClick={() => setDocTypeFields(prev => [...prev, { key: "", label: "", label_en: "", type: "text" }])}
                  className="text-[10px] px-2 py-1 rounded-lg" style={{ color: t.cyan, background: `${t.cyan}10` }}>+ {tr("settings.addField")}</button>
              </div>
              <div className="space-y-2">
                {docTypeFields.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={f.key} onChange={e => { const u = [...docTypeFields]; u[i] = { ...u[i], key: e.target.value }; setDocTypeFields(u); }}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={is} placeholder="key (e.g. BirthRegNo)" />
                    <input value={f.label} onChange={e => { const u = [...docTypeFields]; u[i] = { ...u[i], label: e.target.value }; setDocTypeFields(u); }}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={is} placeholder={tr("settings.labelBn")} />
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
              <Button variant="ghost" size="xs" icon={X} onClick={() => setShowDocTypeForm(false)}>{tr("common.cancel")}</Button>
              <Button size="xs" icon={Save} onClick={async () => {
                if (!docTypeForm.name.trim()) { toast.error(tr("settings.enterName")); return; }
                try {
                  if (editingDocTypeId) {
                    const updated = await api.patch(`/docdata/types/${editingDocTypeId}`, { ...docTypeForm, fields: docTypeFields });
                    setDocTypes(prev => prev.map(d => d.id === editingDocTypeId ? updated : d));
                    toast.updated(docTypeForm.name);
                  } else {
                    const saved = await api.post("/docdata/types", { ...docTypeForm, fields: docTypeFields });
                    setDocTypes(prev => [...prev, saved]);
                    toast.success(`${docTypeForm.name} — ${tr("success.created")}`);
                  }
                  setShowDocTypeForm(false);
                } catch (err) { toast.error(err.message); }
              }}>{tr("common.save")}</Button>
            </div>
          </div>
        </Modal>
      </div>}

      {/* ── পাইপলাইন সেটিংস — Dynamic Checklist Admin ── */}
      {activeTab === "pipeline" && <div className="space-y-5">
        {/* ── ধাপ তালিকা ── */}
        <Card delay={50}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2"><GitBranch size={14} /> {tr("settings.pipelineStepsChecklist")}</h3>
              <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{tr("settings.pipelineStepsDesc")}</p>
            </div>
            <Button variant="ghost" size="xs" icon={RotateCcw} onClick={resetToDefaults}>{tr("settings.resetDefaults")}</Button>
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
                    <p className="text-[10px]" style={{ color: t.textSecondary }}>{itemCount} {tr("settings.items")}</p>
                    <p className="text-[9px]" style={{ color: t.muted }}>{reqCount} {tr("settings.required")}</p>
                  </div>
                  <Edit3 size={13} style={{ color: t.muted }} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── ধাপ Edit Modal ── */}
        <Modal isOpen={!!editingStep} onClose={() => setEditingStep(null)}
          title={editingStep ? `${(() => { const ps = PIPELINE_STATUSES.find(p => p.code === editingStep); return ps?.label || editingStep; })()} — ${tr("settings.editChecklist")}` : ""}
          subtitle={editingStep ? `${tr("settings.step")}: ${editingStep}` : ""} size="xl">
          {editingStep && (
            <>
              {/* ── Step meta fields ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.iconEmoji")}</label>
                  <input value={editStepIcon} onChange={e => setEditStepIcon(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                    placeholder="🚶" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.nextStepBtnText")}</label>
                  <input value={editStepNextLabel} onChange={e => setEditStepNextLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                    placeholder={tr("settings.nextStepPlaceholder")} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.stepHint")}</label>
                  <input value={editStepHint} onChange={e => setEditStepHint(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                    placeholder={tr("settings.stepHintPlaceholder")} />
                </div>
              </div>

              {/* ── চেকলিস্ট আইটেম তালিকা ── */}
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.cyan }}>
                  {tr("settings.checklistItems")} ({editChecklist.length} {tr("settings.pcs")})
                </p>

                <div className="space-y-1">
                  {editChecklist.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 px-3 py-2 rounded-lg group"
                      style={{ background: t.inputBg }}>
                      <span className="text-[10px] font-mono w-5 text-center shrink-0" style={{ color: t.muted }}>{idx + 1}</span>

                      {/* Required toggle */}
                      <button onClick={() => toggleItemReq(item.id)} className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold transition"
                        style={{ background: item.req ? `${t.rose}15` : `${t.muted}15`, color: item.req ? t.rose : t.muted }}
                        title={item.req ? tr("settings.requiredClickOptional") : tr("settings.optionalClickRequired")}>
                        {item.req ? tr("settings.requiredLabel") : tr("settings.optionalLabel")}
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
                            style={{ color: t.cyan }} title={tr("common.edit")}><Edit3 size={12} /></button>
                          <button onClick={() => removeChecklistItem(item.id)} className="p-1 rounded transition"
                            style={{ color: t.rose }} title={tr("common.delete")}><Trash2 size={12} /></button>
                        </div>
                      )}
                    </div>
                  ))}

                  {editChecklist.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: t.muted }}>{tr("settings.noItems")}</p>
                  )}
                </div>
              </div>

              {/* ── নতুন আইটেম যোগ ── */}
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: `${t.cyan}06`, border: `1px solid ${t.cyan}15` }}>
                <Plus size={14} style={{ color: t.cyan }} />
                <input value={newItemText} onChange={e => setNewItemText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addChecklistItem(); }}
                  className="flex-1 bg-transparent text-xs outline-none" style={{ color: t.text }}
                  placeholder={tr("settings.newChecklistPlaceholder")} />
                <button onClick={() => setNewItemReq(!newItemReq)} className="shrink-0 px-2 py-1 rounded text-[9px] font-bold transition"
                  style={{ background: newItemReq ? `${t.rose}15` : `${t.muted}15`, color: newItemReq ? t.rose : t.muted }}>
                  {newItemReq ? tr("settings.requiredLabel") : tr("settings.optionalLabel")}
                </button>
                <Button size="xs" onClick={addChecklistItem}>{tr("common.add")}</Button>
              </div>

              {/* ── Bottom actions ── */}
              <div className="flex items-center justify-between pt-3 mt-4" style={{ borderTop: `1px solid ${t.border}` }}>
                <Button variant="ghost" size="xs" onClick={() => setEditingStep(null)}>{tr("common.cancel")}</Button>
                <Button icon={Save} size="xs" onClick={saveStepConfig}>{tr("common.save")}</Button>
              </div>
            </>
          )}
        </Modal>
      </div>}

      {/* ── ব্রাঞ্চ ম্যানেজমেন্ট — ঠিকানা, ফোন, ম্যানেজার সহ ── */}
      {activeTab === "branches" && <div className="space-y-5">
        <Card delay={50}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Globe size={14} /> {tr("settings.branchList")}</h3>
            <Button icon={Plus} size="xs" onClick={() => { setBranchForm(EMPTY_BRANCH); setEditingBranchId(null); setShowBranchForm(true); }}>{tr("settings.newBranch")}</Button>
          </div>

          {/* ── ব্রাঞ্চ ফর্ম — Modal-এ সরানো হয়েছে ── */}

          {/* ── ব্রাঞ্চ তালিকা ── */}
          {branches.length === 0 ? (
            <p className="text-center py-6 text-xs" style={{ color: t.muted }}>{tr("settings.noBranches")}</p>
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
                    {b.phone && <p>📞 {formatPhoneDisplay(b.phone)}</p>}
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
          <h3 className="text-xs font-semibold mb-2" style={{ color: t.cyan }}>💡 {tr("settings.branchExcelTip")}</h3>
          <p className="text-[10px]" style={{ color: t.muted }}>
            {tr("settings.branchExcelTipDesc1")} <span className="font-mono px-1 rounded" style={{ background: `${t.cyan}15` }}>{"{{sys_branch_address}}"}</span> {tr("settings.branchExcelTipDesc2")}
            <span className="font-mono px-1 rounded" style={{ background: `${t.cyan}15` }}>{"{{sys_branch_phone}}"}</span>,
            <span className="font-mono px-1 rounded" style={{ background: `${t.cyan}15` }}>{"{{sys_branch_manager}}"}</span>
          </p>
        </Card>

        {/* ── ব্রাঞ্চ ফর্ম Modal ── */}
        <Modal isOpen={showBranchForm} onClose={() => { setShowBranchForm(false); setEditingBranchId(null); }}
          title={editingBranchId ? tr("settings.editBranch") : tr("settings.addBranch")} size="md">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.branchNameEn")} *</label>
                <input value={branchForm.name} onChange={e => setBranchForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="Dhaka (HQ)" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.nameBn")}</label>
                <input value={branchForm.name_bn} onChange={e => setBranchForm(p => ({ ...p, name_bn: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="ঢাকা (HQ)" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.city")}</label>
                <input value={branchForm.city} onChange={e => setBranchForm(p => ({ ...p, city: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="ঢাকা" />
              </div>
              <div className="md:col-span-3">
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.addressEn")} — Excel {"{{sys_branch_address}}"}</label>
                <input value={branchForm.address} onChange={e => setBranchForm(p => ({ ...p, address: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="House 12, Road 4, Dhanmondi, Dhaka-1205" />
              </div>
              <div className="md:col-span-3">
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.addressBn")}</label>
                <input value={branchForm.address_bn} onChange={e => setBranchForm(p => ({ ...p, address_bn: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="বাড়ি ১২, রোড ৪, ধানমন্ডি, ঢাকা-১২০৫" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("common.phone")}</label>
                <PhoneInput value={branchForm.phone} onChange={v => setBranchForm(p => ({ ...p, phone: v }))} size="sm" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("common.email")}</label>
                <input value={branchForm.email} onChange={e => setBranchForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="dhaka@agency.com" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.manager")}</label>
                <input value={branchForm.manager} onChange={e => setBranchForm(p => ({ ...p, manager: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="Branch Manager নাম" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={branchForm.is_hq} onChange={e => setBranchForm(p => ({ ...p, is_hq: e.target.checked }))} className="rounded" style={{ accentColor: t.cyan }} />
                <span className="text-xs" style={{ color: t.text }}>{tr("settings.headquarters")}</span>
              </label>
              <div className="flex gap-2">
                <Button variant="ghost" size="xs" icon={X} onClick={() => { setShowBranchForm(false); setEditingBranchId(null); }}>{tr("common.cancel")}</Button>
                <Button size="xs" icon={Save} onClick={saveBranch}>{tr("common.save")}</Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>}

      {/* ── নোটিফিকেশন ── */}
      {activeTab === "notifications" && <div className="space-y-5">
        <Card delay={50}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Bell size={14} /> {tr("settings.notificationSettings")}</h3>
          <div className="space-y-3">
            {[
              { key: "followUpReminder", label: tr("settings.notifFollowUp"), desc: tr("settings.notifFollowUpDesc") },
              { key: "visaExpiry", label: tr("settings.notifVisaExpiry"), desc: tr("settings.notifVisaExpiryDesc") },
              { key: "passportExpiry", label: tr("settings.notifPassportExpiry"), desc: tr("settings.notifPassportExpiryDesc") },
              { key: "paymentDue", label: tr("settings.notifPaymentDue"), desc: tr("settings.notifPaymentDueDesc") },
              { key: "batchStart", label: tr("settings.notifBatchStart"), desc: tr("settings.notifBatchStartDesc") },
              { key: "documentPending", label: tr("settings.notifDocPending"), desc: tr("settings.notifDocPendingDesc") },
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
            <Button icon={Plus} size="xs" onClick={() => setShowFieldForm(true)}>{tr("settings.newField")}</Button>
          </div>

          {showFieldForm && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.fieldName")} <span className="req-star">*</span></label>
                  <input value={fieldForm.name} onChange={e => setFieldForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="যেমন: Emergency Contact" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("common.type")}</label>
                  <select value={fieldForm.type} onChange={e => setFieldForm(p => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="select">Select (Dropdown)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.module")}</label>
                  <select value={fieldForm.module} onChange={e => setFieldForm(p => ({ ...p, module: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option value="students">Students</option><option value="visitors">Visitors</option><option value="agents">Agents</option>
                  </select>
                </div>
                {fieldForm.type === "select" && (
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("settings.optionsCommaSep")}</label>
                    <input value={fieldForm.options} onChange={e => setFieldForm(p => ({ ...p, options: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Option 1, Option 2, Option 3" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={fieldForm.required} onChange={e => setFieldForm(p => ({ ...p, required: e.target.checked }))} />
                  <span style={{ color: t.textSecondary }}>{tr("settings.requiredField")}</span>
                </label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="xs" icon={X} onClick={() => setShowFieldForm(false)}>{tr("common.cancel")}</Button>
                  <Button icon={Save} size="xs" onClick={() => {
                    if (!fieldForm.name.trim()) { toast.error(tr("settings.enterFieldName")); return; }
                    setCustomFields(prev => [...prev, { id: `cf-${Date.now()}`, ...fieldForm }]);
                    setShowFieldForm(false);
                    setFieldForm({ name: "", type: "text", module: "students", required: false, options: "" });
                    toast.success(tr("settings.customFieldAdded"));
                  }}>{tr("common.save")}</Button>
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
            {customFields.length === 0 && <p className="text-xs text-center py-4" style={{ color: t.muted }}>{tr("settings.noCustomFields")}</p>}
          </div>
        </Card>
      </div>}

      {/* ── ছুটির তালিকা — সরকারি ছুটি ম্যানেজমেন্ট ── */}
      {activeTab === "holidays" && <div className="space-y-5">
        <Card delay={50}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2"><Calendar size={14} /> {tr("settings.holidays")}</h3>
              <p className="text-[10px] mt-1" style={{ color: t.muted }}>{tr("settings.holidaysDesc")}</p>
            </div>
            <Button icon={Plus} size="xs" onClick={() => { setHolidayForm(EMPTY_HOLIDAY); setShowHolidayForm(true); }}>{tr("settings.newHoliday")}</Button>
          </div>

          {/* ── ছুটি তালিকা ── */}
          {holidays.length === 0 && (
            <p className="text-xs text-center py-8" style={{ color: t.muted }}>{tr("settings.noHolidays")}</p>
          )}
          <div className="space-y-2">
            {holidays.map(h => (
              <div key={h.id}>
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.border}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `${t.cyan}15`, color: t.cyan }}>
                      {new Date(h.date + "T00:00:00").getDate()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: t.text }}>{h.name_bn || h.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px]" style={{ color: t.muted }}>{formatDateDisplay(h.date)}</p>
                        {h.name_bn && h.name && <p className="text-[10px]" style={{ color: t.muted }}>({h.name})</p>}
                        {h.recurring && (
                          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${t.purple}15`, color: t.purple }}>
                            <RefreshCw size={8} /> {tr("settings.recurring")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setDeletingHolidayId(deletingHolidayId === h.id ? null : h.id)}
                    className="p-1.5 rounded-lg transition"
                    style={{ color: t.rose }}
                    onMouseEnter={e => e.currentTarget.style.background = `${t.rose}15`}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Trash2 size={14} />
                  </button>
                </div>
                {/* ── Inline delete confirmation ── */}
                {deletingHolidayId === h.id && (
                  <div className="flex items-center gap-3 p-3 mt-1 rounded-xl" style={{ background: `${t.rose}10`, border: `1px solid ${t.rose}30` }}>
                    <div className="flex-1">
                      <p className="text-xs font-semibold" style={{ color: t.rose }}>{tr("settings.confirmDelete")}</p>
                      <p className="text-[10px]" style={{ color: t.muted }}>{tr("settings.cannotUndo")}</p>
                    </div>
                    <button onClick={() => setDeletingHolidayId(null)} className="text-xs px-2 py-1 rounded-lg" style={{ color: t.muted }}>{tr("common.no")}</button>
                    <button onClick={() => deleteHoliday(h.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ background: t.rose, color: "#fff" }}>{tr("settings.yesDelete")}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* ── নতুন ছুটি ফর্ম — Modal ── */}
        <Modal isOpen={showHolidayForm} onClose={() => setShowHolidayForm(false)} title={tr("settings.addHoliday")} size="sm">
          <div className="space-y-4">
            {/* তারিখ */}
            <div>
              <label className="text-[10px] font-medium mb-1 block" style={{ color: t.muted }}>{tr("common.date")} *</label>
              <DateInput value={holidayForm.date} onChange={v => setHolidayForm(prev => ({ ...prev, date: v }))} size="sm" error={!holidayForm.date} />
            </div>
            {/* নাম (English) */}
            <div>
              <label className="text-[10px] font-medium mb-1 block" style={{ color: t.muted }}>{tr("settings.holidayNameEn")} *</label>
              <input type="text" value={holidayForm.name} placeholder="e.g. Independence Day"
                onChange={e => setHolidayForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                style={{ background: t.inputBg, border: `1px solid ${!holidayForm.name ? t.rose : t.inputBorder}`, color: t.text }} />
            </div>
            {/* নাম (বাংলা) */}
            <div>
              <label className="text-[10px] font-medium mb-1 block" style={{ color: t.muted }}>{tr("settings.holidayNameBn")}</label>
              <input type="text" value={holidayForm.name_bn} placeholder="যেমন: স্বাধীনতা দিবস"
                onChange={e => setHolidayForm(prev => ({ ...prev, name_bn: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
            </div>
            {/* প্রতিবছর পুনরাবৃত্তি */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={holidayForm.recurring}
                onChange={e => setHolidayForm(prev => ({ ...prev, recurring: e.target.checked }))}
                className="rounded" />
              <span className="text-xs" style={{ color: t.text }}>{tr("settings.recurringYearly")}</span>
              <span className="text-[10px]" style={{ color: t.muted }}>({tr("settings.recurringExample")})</span>
            </label>
            {/* Save বাটন */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="xs" onClick={() => setShowHolidayForm(false)}>{tr("common.cancel")}</Button>
              <Button icon={Save} size="xs" onClick={saveHoliday}>{tr("common.add")}</Button>
            </div>
          </div>
        </Modal>
      </div>}

      {/* ── কন্ডিশনাল ফরম্যাটিং — স্টুডেন্ট ও ভিজিটর তালিকায় শর্তসাপেক্ষ সারি রং ── */}
      {activeTab === "conditional_format" && <div className="space-y-5">
        <Card delay={50}>
          <div className="flex items-center gap-2 mb-1">
            <Paintbrush size={15} style={{ color: t.cyan }} />
            <h3 className="text-sm font-semibold" style={{ color: t.text }}>{tr("settings.conditionalFormat")}</h3>
          </div>
          <p className="text-[10px] mb-5" style={{ color: t.muted }}>
            {tr("settings.conditionalFormatDesc")}
          </p>

          <div className="space-y-6">
            {/* ── স্টুডেন্ট কন্ডিশনাল ফরম্যাটিং ── */}
            <div>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: t.text }}>
                <Users size={13} style={{ color: t.purple }} /> {tr("settings.studentList")}
              </h4>
              <ConditionalFormatRules module="students" fields={STUDENT_FIELDS} />
            </div>

            {/* ── ভিজিটর কন্ডিশনাল ফরম্যাটিং ── */}
            <div>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: t.text }}>
                <Eye size={13} style={{ color: t.amber }} /> {tr("settings.visitorList")}
              </h4>
              <ConditionalFormatRules module="visitors" fields={VISITOR_FIELDS} />
            </div>
          </div>
        </Card>
      </div>}

      {/* ── ডাটা ব্যাকআপ ── */}
      {activeTab === "backup" && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay={50}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Database size={14} /> {tr("settings.dataExport")}</h3>
          <div className="space-y-3">
            {[
              { icon: "📦", label: tr("settings.fullBackupJson"), sub: tr("settings.fullBackupJsonDesc"), color: t.cyan,
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
              { icon: "🎓", label: tr("settings.studentsCsv"), sub: tr("settings.studentsCsvDesc"), color: t.purple,
                onClick: () => {
                  const headers = "ID,Name,Phone,Status,Country,School,Batch";
                  const rows = (students || []).map(s => `${s.id},"${s.name_en}",${s.phone},${s.status},${s.country},${s.school},${s.batch}`);
                  const blob = new Blob(["\uFEFF" + headers + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
                  Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `Students_${new Date().toISOString().slice(0, 10)}.csv` }).click();
                  toast.exported("Students CSV");
                }
              },
              { icon: "🚶", label: tr("settings.visitorsCsv"), sub: tr("settings.visitorsCsvDesc"), color: t.amber,
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
