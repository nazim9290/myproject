import React, { useState, useEffect } from "react";
import { Building, Plus, Users, GraduationCap, TrendingUp, Edit3, Trash2, Save, X, Eye, Shield, Globe, Check, AlertTriangle, FileSpreadsheet, Upload, Power, Download, Settings } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import PhoneInput from "../../components/ui/PhoneInput";
import { API_URL } from "../../lib/api";
import FieldMapperTable, { SYSTEM_FIELDS } from "../../components/ui/FieldMapper";

// AI Resume Builder — system fields flat list
const SYSTEM_FIELDS_FLAT = SYSTEM_FIELDS.flatMap(g => g.fields);
import { formatDateDisplay } from "../../components/ui/DateInput";

/**
 * SuperAdminPage — Platform-level agency management
 * শুধুমাত্র super_admin role দেখতে পাবে
 * Agency তৈরি, ম্যানেজ, plan পরিবর্তন, stats দেখা
 */

const PLANS = [
  { id: "standard", label: "Standard", color: "#22d3ee", limit: "Per-student billing" },
  { id: "dedicated", label: "Dedicated", color: "#a855f7", limit: "Fixed pricing" },
];

export default function SuperAdminPage() {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
  const token = localStorage.getItem("agencyos_token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [agencies, setAgencies] = useState([]);
  const [stats, setStats] = useState(null);
  const [pricing, setPricing] = useState({ per_student_fee: 3000, trial_days: 14 });
  const [loading, setLoading] = useState(true);
  const [docTypeGroups, setDocTypeGroups] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPricingForm, setShowPricingForm] = useState(false);
  // ── ট্যাব navigation ──
  const [activeTab, setActiveTab] = useState("agencies");
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [detailAgency, setDetailAgency] = useState(null);
  const [switchConfirmId, setSwitchConfirmId] = useState(null);

  const [form, setForm] = useState({
    name: "", name_bn: "", subdomain: "", phone: "", email: "", address: "", prefix: "",
    plan: "standard", admin_name: "", admin_email: "", admin_password: "", dedicated: false,
  });

  // ── OCR Credit management state ──
  const [creditAgencyId, setCreditAgencyId] = useState(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");

  // ── ডিফল্ট টেমপ্লেট state ──
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState(null);
  const [tplForm, setTplForm] = useState({
    name: "", name_bn: "", description: "", category: "excel", sub_category: "", country: "Japan", file: null,
  });

  // ── অ্যানালিটিক্স state ──
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ── ম্যাপিং Modal state ──
  const [mappingTemplate, setMappingTemplate] = useState(null);
  const [templateMappings, setTemplateMappings] = useState({});
  const [templateModifiers, setTemplateModifiers] = useState({});
  const [mappingSaving, setMappingSaving] = useState(false);

  // ── টেমপ্লেট ক্যাটেগরি ম্যাপ ──
  const TEMPLATE_CATEGORIES = [
    { id: "excel", label: "Excel Template", color: "#22c55e" },
    { id: "docgen", label: "Doc Generator", color: "#a855f7" },
    { id: "doc_type", label: "Document Type", color: "#f59e0b" },
  ];
  const TEMPLATE_COUNTRIES = ["Japan", "Germany", "Korea", "All"];

  // ── ডাটা লোড ──
  const loadData = async () => {
    const token = localStorage.getItem("agencyos_token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    try {
      const [agRes, stRes, prRes, tplRes, dtRes] = await Promise.all([
        fetch(`${API_URL}/super-admin/agencies`, { headers }),
        fetch(`${API_URL}/super-admin/stats`, { headers }),
        fetch(`${API_URL}/super-admin/pricing`, { headers }),
        fetch(`${API_URL}/super-admin/default-templates`, { headers }),
        fetch(`${API_URL}/docdata/types`, { headers }).catch(() => ({ ok: false })),
      ]);
      if (agRes.ok) setAgencies(await agRes.json());
      if (stRes.ok) setStats(await stRes.json());
      if (prRes.ok) setPricing(await prRes.json());
      if (tplRes.ok) setTemplates(await tplRes.json());
      // Doc type fields → mapping dropdown-এ extra groups
      if (dtRes.ok) {
        const docTypes = await dtRes.json();
        const groups = (docTypes || []).map(dt => ({
          group: `📄 ${dt.name}`,
          color: "purple",
          fields: (dt.fields || []).filter(f => f.type !== "section_header" && f.type !== "repeatable")
            .map(f => ({ key: f.key, label: `${f.label_en || f.label} (${dt.name})` })),
        })).filter(g => g.fields.length > 0);
        setDocTypeGroups(groups);
      }
    } catch (err) { console.error("[SuperAdmin Load]", err); toast.error(tr("errors.loadFailed")); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // ── অ্যানালিটিক্স ডাটা লোড ──
  const loadAnalytics = async (days) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API_URL}/analytics/summary?days=${days}`, { headers });
      if (res.ok) {
        const d = await res.json();
        // Backend → Frontend field mapping + safe defaults
        const pageViews = Array.isArray(d.pageViews) ? d.pageViews : [];
        const peakHours = Array.isArray(d.peakHours) ? d.peakHours : [];
        const peakEntry = peakHours.reduce((max, h) => (h.count > (max?.count || 0) ? h : max), null);
        setAnalyticsData({
          totalPageViews: d.totalViews || 0,
          activeUsers: Array.isArray(d.activeUsers) ? d.activeUsers.length : 0,
          mostUsedFeature: pageViews[0]?.page || "—",
          peakHour: peakEntry?.hour ?? null,
          featureUsage: pageViews.map(p => ({ name: p.page, count: p.count })),
          activeUsersList: (Array.isArray(d.activeUsers) ? d.activeUsers : []).map(u => ({
            name: u.user_name || "—", role: u.user_role || "—", pageViews: u.count || 0,
          })),
          hourlyData: peakHours,
          dailyTrend: Array.isArray(d.dailyTrend) ? d.dailyTrend : [],
        });
      } else {
        toast.error(tr("superAdmin.analyticsLoadFailed"));
      }
    } catch (err) {
      console.error("[Analytics Load]", err);
      toast.error(tr("superAdmin.analyticsLoadError"));
    }
    setAnalyticsLoading(false);
  };

  // অ্যানালিটিক্স ট্যাবে গেলে ডাটা ফেচ
  useEffect(() => {
    if (activeTab === "analytics") loadAnalytics(analyticsDays);
  }, [activeTab, analyticsDays]);

  // ── Agency তৈরি ──
  const createAgency = async () => {
    if (!form.name.trim()) { toast.error(tr("superAdmin.errAgencyName")); return; }
    if (!form.subdomain.trim()) { toast.error(tr("superAdmin.errSubdomain")); return; }
    if (!form.admin_email.trim()) { toast.error(tr("superAdmin.errAdminEmail")); return; }
    if (!form.admin_password || form.admin_password.length < 6) { toast.error(tr("superAdmin.errAdminPassword")); return; }

    try {
      const res = await fetch(`${API_URL}/super-admin/agencies`, {
        method: "POST", headers, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || tr("superAdmin.createFailed")); return; }
      toast.success(`${form.name} — ${tr("superAdmin.agencyCreated")}`);
      setShowCreateForm(false);
      setForm({ name: "", name_bn: "", subdomain: "", phone: "", email: "", address: "", prefix: "", plan: "standard", admin_name: "", admin_email: "", admin_password: "", dedicated: false });
      loadData();
    } catch { toast.error(tr("superAdmin.serverError")); }
  };

  // ── Agency update ──
  const updateAgency = async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/super-admin/agencies/${id}`, {
        method: "PATCH", headers, body: JSON.stringify(updates),
      });
      if (res.ok) { toast.success(tr("success.updated")); loadData(); setEditingId(null); }
      else { const d = await res.json(); toast.error(d.error || tr("errors.saveFailed")); }
    } catch { toast.error(tr("superAdmin.serverError")); }
  };

  // ── Agency delete ──
  const deleteAgency = async (id) => {
    try {
      const res = await fetch(`${API_URL}/super-admin/agencies/${id}`, { method: "DELETE", headers });
      if (res.ok) { toast.success(tr("success.deleted")); loadData(); setDeleteConfirmId(null); }
      else { const d = await res.json(); toast.error(d.error || tr("errors.saveFailed")); }
    } catch { toast.error(tr("superAdmin.serverError")); }
  };

  // ── এজেন্সিতে সুইচ করুন — agency_id localStorage-এ save + reload ──
  const switchToAgency = (agency) => {
    localStorage.setItem("agencyos_switch_agency_id", agency.id);
    localStorage.setItem("agencyos_switch_agency_name", agency.name);
    toast.success(`${agency.name} ${tr("superAdmin.switchingTo")}`);
    setSwitchConfirmId(null);
    setTimeout(() => window.location.reload(), 500);
  };

  // ── টেমপ্লেট তৈরি / আপডেট ──
  const saveTemplate = async () => {
    if (!tplForm.name.trim()) { toast.error(tr("superAdmin.errTemplateName")); return; }

    const formData = new FormData();
    formData.append("name", tplForm.name);
    formData.append("name_bn", tplForm.name_bn || "");
    formData.append("description", tplForm.description || "");
    formData.append("category", tplForm.category || "excel");
    formData.append("sub_category", tplForm.sub_category || "");
    formData.append("country", tplForm.country || "Japan");
    if (tplForm.file) formData.append("file", tplForm.file);

    try {
      if (editingTemplate) {
        // PATCH — file সহ বা ছাড়া দুটোই FormData দিয়ে (placeholder auto-detect)
        const res = await fetch(`${API_URL}/super-admin/default-templates/${editingTemplate.id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (res.ok) { toast.success(tplForm.file ? tr("superAdmin.templateUpdatedRedetect") : tr("superAdmin.templateUpdated")); }
        else { const d = await res.json(); toast.error(d.error || tr("superAdmin.updateFailed")); return; }
      } else {
        // নতুন তৈরি — FormData দিয়ে (file সহ)
        const res = await fetch(`${API_URL}/super-admin/default-templates`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (res.ok) { toast.success(tr("superAdmin.templateAdded")); }
        else { const d = await res.json(); toast.error(d.error || tr("superAdmin.createFailed")); return; }
      }
      setShowTemplateModal(false);
      setEditingTemplate(null);
      setTplForm({ name: "", name_bn: "", description: "", category: "excel", sub_category: "", country: "Japan", file: null });
      loadData();
    } catch { toast.error(tr("superAdmin.serverError")); }
  };

  // ── টেমপ্লেট মুছে ফেলা ──
  const deleteTemplate = async (id) => {
    try {
      const res = await fetch(`${API_URL}/super-admin/default-templates/${id}`, { method: "DELETE", headers });
      if (res.ok) { toast.success(tr("superAdmin.templateDeleted")); loadData(); setDeleteTemplateId(null); }
      else { const d = await res.json(); toast.error(d.error || tr("errors.saveFailed")); }
    } catch { toast.error(tr("superAdmin.serverError")); }
  };

  // ── টেমপ্লেট active/inactive toggle ──
  const toggleTemplateActive = async (tpl) => {
    try {
      const res = await fetch(`${API_URL}/super-admin/default-templates/${tpl.id}`, {
        method: "PATCH", headers, body: JSON.stringify({ is_active: !tpl.is_active }),
      });
      if (res.ok) { toast.success(tpl.is_active ? tr("superAdmin.deactivated") : tr("superAdmin.activated")); loadData(); }
    } catch { toast.error(tr("superAdmin.serverError")); }
  };

  // ── ম্যাপিং modal খোলা — template_data থেকে existing mapping load ──
  const openMappingModal = (tpl) => {
    setMappingTemplate(tpl);
    const existingData = typeof tpl.template_data === "string" ? JSON.parse(tpl.template_data) : tpl.template_data;
    const placeholders = existingData?.placeholders || [];
    // Existing mapping load — field থেকে base key + modifier আলাদা করা
    const maps = {};
    const mods = {};
    placeholders.forEach(p => {
      if (p.field) {
        // field format: "dob:jp" → base="dob", mod=":jp"
        const colonIdx = p.field.indexOf(":");
        if (colonIdx > 0) {
          maps[p.key] = p.field.slice(0, colonIdx);
          mods[p.key] = p.field.slice(colonIdx);
        } else {
          maps[p.key] = p.field;
        }
      }
    });
    setTemplateMappings(maps);
    setTemplateModifiers(mods);
  };

  // ── ম্যাপিং সংরক্ষণ — PATCH /default-templates/:id/mapping ──
  const saveMappings = async () => {
    if (!mappingTemplate) return;
    setMappingSaving(true);
    let existingData = null;
    try {
      existingData = typeof mappingTemplate.template_data === "string" && mappingTemplate.template_data
        ? JSON.parse(mappingTemplate.template_data)
        : mappingTemplate.template_data;
    } catch { existingData = null; }
    const placeholders = (existingData?.placeholders || []).map(p => {
      const baseField = templateMappings[p.key] || "";
      const mod = templateModifiers[p.key] || "";
      return { ...p, field: baseField ? baseField + mod : "" };
    });
    try {
      const res = await fetch(`${API_URL}/super-admin/default-templates/${mappingTemplate.id}/mapping`, {
        method: "PATCH", headers, body: JSON.stringify({ placeholders }),
      });
      if (res.ok) {
        toast.success(tr("superAdmin.mappingSaved"));
        setMappingTemplate(null);
        setTemplateMappings({});
        setTemplateModifiers({});
        loadData();
      } else {
        const d = await res.json();
        toast.error(d.error || tr("superAdmin.mappingSaveFailed"));
      }
    } catch { toast.error(tr("superAdmin.serverError")); }
    setMappingSaving(false);
  };

  // ── টেমপ্লেট সম্পাদনা modal খোলা ──
  const openEditTemplate = (tpl) => {
    setEditingTemplate(tpl);
    setTplForm({
      name: tpl.name || "", name_bn: tpl.name_bn || "", description: tpl.description || "",
      category: tpl.category || "excel", sub_category: tpl.sub_category || "",
      country: tpl.country || "Japan", file: null,
    });
    setShowTemplateModal(true);
  };

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  if (loading) return <div className="text-center py-20 text-xs" style={{ color: t.muted }}>{tr("common.loading")}...</div>;

  return (
    <div className="space-y-5 anim-fade">
      {/* ── হেডার ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield size={20} style={{ color: t.purple }} /> {tr("superAdmin.title")}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{tr("superAdmin.subtitle")}</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateForm(!showCreateForm)}>{tr("superAdmin.newAgency")}</Button>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {[
          { key: "agencies", label: tr("superAdmin.tabAgencies"), icon: "🏢" },
          { key: "credits", label: tr("superAdmin.tabCredits"), icon: "🔍" },
          { key: "templates", label: tr("superAdmin.tabTemplates"), icon: "📄" },
          { key: "settings", label: tr("superAdmin.tabSettings"), icon: "⚙️" },
          { key: "analytics", label: tr("superAdmin.tabAnalytics"), icon: "📊" },
          { key: "ai-resume", label: "AI Resume Builder", icon: "🤖" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab === tab.key ? t.card : "transparent",
              color: activeTab === tab.key ? t.cyan : t.muted,
              boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
            }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: AGENCIES ══ */}
      {activeTab === "agencies" && <>

      {/* ── Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: tr("superAdmin.totalAgencies"), value: stats.totalAgencies, color: t.cyan, icon: Building },
            { label: tr("common.active"), value: stats.activeAgencies, color: t.emerald, icon: Check },
            { label: tr("superAdmin.totalStudents"), value: stats.totalStudents, color: t.purple, icon: GraduationCap },
            { label: tr("superAdmin.totalUsers"), value: stats.totalUsers, color: t.amber, icon: Users },
          ].map((kpi, i) => (
            <Card key={i} delay={i * 40}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                </div>
                <kpi.icon size={20} style={{ color: `${kpi.color}40` }} />
              </div>
            </Card>
          ))}
        </div>
      )}

      </>}

      {/* ══ TAB: SETTINGS ══ */}
      {activeTab === "settings" && <>

      {/* ── Pricing Config ── */}
      <Card delay={100}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">💰 {tr("superAdmin.pricingConfig")}</h3>
            <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>
              {tr("superAdmin.perStudent")}: <strong style={{ color: t.emerald }}>৳{Number(pricing.per_student_fee || 0).toLocaleString("en-IN")}</strong>
              {" "}• Trial: <strong>{pricing.trial_days} {tr("superAdmin.days")}</strong>
              {" "}• OCR Credit: <strong style={{ color: t.cyan }}>৳{pricing.ocr_credit_price || 5}/scan</strong>
            </p>
          </div>
          <Button variant="ghost" size="xs" icon={Edit3} onClick={() => setShowPricingForm(!showPricingForm)}>
            {tr("superAdmin.change")}
          </Button>
        </div>

        {showPricingForm && (
          <div className="mt-4 pt-4 flex items-end gap-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.perStudentFee")}</label>
              <input type="number" value={pricing.per_student_fee} onChange={e => setPricing(p => ({ ...p, per_student_fee: Number(e.target.value) }))}
                className="w-32 px-3 py-2 rounded-lg text-sm outline-none" style={is} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.freeTrialDays")}</label>
              <input type="number" value={pricing.trial_days} onChange={e => setPricing(p => ({ ...p, trial_days: Number(e.target.value) }))}
                className="w-24 px-3 py-2 rounded-lg text-sm outline-none" style={is} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.ocrCreditPrice")}</label>
              <input type="number" value={pricing.ocr_credit_price || 5} onChange={e => setPricing(p => ({ ...p, ocr_credit_price: Number(e.target.value) }))}
                className="w-24 px-3 py-2 rounded-lg text-sm outline-none" style={is} />
            </div>
            <Button size="xs" icon={Save} onClick={async () => {
              try {
                const res = await fetch(`${API_URL}/super-admin/pricing`, { method: "PATCH", headers, body: JSON.stringify(pricing) });
                if (res.ok) { toast.success(tr("superAdmin.pricingUpdated")); setShowPricingForm(false); }
              } catch { toast.error(tr("errors.saveFailed")); }
            }}>{tr("common.save")}</Button>
          </div>
        )}
      </Card>

      </>}

      {/* ══ TAB: CREDITS ══ */}
      {activeTab === "credits" && <>

      {/* ── OCR Credits ── */}
      <Card delay={50}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">🔍 {tr("superAdmin.ocrCreditMgmt")}</h3>
            <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{tr("superAdmin.ocrCreditDesc")}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                {[tr("superAdmin.agency"), "Balance", "Scans Left", tr("common.actions")].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(agencies || []).filter(a => a.status !== "deleted").map(agency => {
                const bal = agency.ocr_credits || 0;
                const scansLeft = Math.floor(bal / 5);
                return (
                <tr key={agency.id} style={{ borderBottom: `1px solid ${t.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td className="py-3 px-3">
                    <span className="font-medium">{agency.name}</span>
                    <span className="text-[9px] font-mono ml-1.5" style={{ color: t.muted }}>{agency.subdomain}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-base" style={{ color: bal > 0 ? t.emerald : t.rose }}>{bal}</span>
                    <span className="text-[9px] ml-1" style={{ color: t.muted }}>credits</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs" style={{ color: scansLeft > 0 ? t.text : t.muted }}>{scansLeft > 0 ? `${scansLeft} scans` : "—"}</span>
                  </td>
                  <td className="py-3 px-3">
                    {creditAgencyId === agency.id ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                          placeholder="Credit" min="1"
                          className="w-24 px-2 py-1.5 rounded-lg text-xs outline-none"
                          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                        <input value={creditNote} onChange={e => setCreditNote(e.target.value)}
                          placeholder="Note"
                          className="w-36 px-2 py-1.5 rounded-lg text-xs outline-none"
                          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                        {/* যোগ বাটন */}
                        <button onClick={async () => {
                          if (!creditAmount || +creditAmount <= 0) { toast.error(tr("superAdmin.errValidAmount")); return; }
                          try {
                            const res = await fetch(`${API_URL}/super-admin/agencies/${agency.id}/credits`, {
                              method: "POST", headers, body: JSON.stringify({ amount: +creditAmount, description: creditNote || `Credit topup: ${creditAmount}` }),
                            });
                            if (res.ok) {
                              const d = await res.json();
                              setAgencies(prev => prev.map(a => a.id === agency.id ? { ...a, ocr_credits: d.credits } : a));
                              toast.success(`${agency.name} — ${creditAmount} ${tr("superAdmin.creditAdded")}`);
                              setCreditAgencyId(null); setCreditAmount(""); setCreditNote("");
                            }
                          } catch { toast.error(tr("errors.saveFailed")); }
                        }} className="px-3 py-1.5 rounded-lg text-[10px] font-medium"
                          style={{ background: t.emerald, color: "#fff" }}>+ {tr("superAdmin.add")}</button>
                        {/* সেট বাটন — exact balance set করতে */}
                        <button onClick={async () => {
                          const setVal = +creditAmount;
                          if (isNaN(setVal) || setVal < 0) { toast.error(tr("superAdmin.errValidAmount")); return; }
                          try {
                            await fetch(`${API_URL}/super-admin/agencies/${agency.id}/credits`, {
                              method: "POST", headers, body: JSON.stringify({ amount: setVal - bal, description: creditNote || `Credit set to: ${setVal}` }),
                            });
                            setAgencies(prev => prev.map(a => a.id === agency.id ? { ...a, ocr_credits: setVal } : a));
                            toast.success(`${agency.name} — Balance: ${setVal} credits`);
                            setCreditAgencyId(null); setCreditAmount(""); setCreditNote("");
                          } catch { toast.error(tr("errors.saveFailed")); }
                        }} className="px-3 py-1.5 rounded-lg text-[10px] font-medium"
                          style={{ background: `${t.amber}20`, color: t.amber }}>= {tr("superAdmin.set")}</button>
                        <button onClick={() => setCreditAgencyId(null)} className="text-xs px-1" style={{ color: t.muted }}>✕</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setCreditAgencyId(agency.id); setCreditAmount(""); setCreditNote(""); }}
                          className="text-[10px] px-2.5 py-1 rounded-lg transition font-medium"
                          style={{ background: `${t.cyan}15`, color: t.cyan }}>
                          + Credit
                        </button>
                        {bal > 0 && (
                          <button onClick={() => { setCreditAgencyId(agency.id); setCreditAmount("0"); setCreditNote(""); }}
                            className="text-[10px] px-2 py-1 rounded-lg transition"
                            style={{ background: `${t.rose}10`, color: t.rose }}>
                            Reset
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      </>}

      {/* ══ TAB: TEMPLATES ══ */}
      {activeTab === "templates" && <>

      {/* ── ডিফল্ট টেমপ্লেট ── */}
      <Card delay={150}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileSpreadsheet size={16} style={{ color: t.cyan }} /> {tr("superAdmin.defaultTemplates")}
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>
              {tr("superAdmin.defaultTemplatesDesc")}
            </p>
          </div>
          <Button size="xs" icon={Plus} onClick={() => {
            setEditingTemplate(null);
            setTplForm({ name: "", name_bn: "", description: "", category: "excel", sub_category: "", country: "Japan", file: null });
            setShowTemplateModal(true);
          }}>{tr("superAdmin.newTemplate")}</Button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8">
            <FileSpreadsheet size={32} style={{ color: `${t.muted}40` }} className="mx-auto mb-2" />
            <p className="text-xs" style={{ color: t.muted }}>{tr("superAdmin.noTemplates")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {[tr("superAdmin.name"), tr("superAdmin.category"), tr("superAdmin.country"), tr("superAdmin.file"), tr("superAdmin.status"), tr("common.actions")].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map(tpl => {
                  const catInfo = TEMPLATE_CATEGORIES.find(c => c.id === tpl.category) || TEMPLATE_CATEGORIES[0];
                  return (
                    <React.Fragment key={tpl.id}>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold">{tpl.name}</p>
                          {tpl.name_bn && <p className="text-[10px]" style={{ color: t.muted }}>{tpl.name_bn}</p>}
                          {tpl.description && <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{tpl.description}</p>}
                          {tpl.sub_category && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: `${t.cyan}10`, color: t.cyan }}>
                              {tpl.sub_category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge color={catInfo.color} size="xs">{catInfo.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${t.purple}15`, color: t.purple }}>
                          {tpl.country || "Japan"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {tpl.file_name ? (
                          <a href={`${API_URL.replace("/api", "")}${tpl.file_url}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] hover:underline" style={{ color: t.cyan }}>
                            <Download size={10} /> {tpl.file_name}
                          </a>
                        ) : (
                          <span className="text-[10px]" style={{ color: t.muted }}>—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleTemplateActive(tpl)}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-colors"
                          style={{ background: tpl.is_active ? `${t.emerald}15` : `${t.rose}15`, color: tpl.is_active ? t.emerald : t.rose }}>
                          <Power size={10} />
                          {tpl.is_active ? tr("superAdmin.activeStatus") : tr("superAdmin.inactiveStatus")}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button onClick={() => openEditTemplate(tpl)}
                            className="px-2 py-1 rounded text-[10px]" style={{ color: t.amber, background: `${t.amber}15` }}>
                            <Edit3 size={10} />
                          </button>
                          {/* ম্যাপিং বাটন — সব template-এ দেখাবে */}
                          <button onClick={() => openMappingModal(tpl)}
                            className="px-2 py-1 rounded text-[10px] flex items-center gap-0.5" style={{ color: t.purple, background: `${t.purple}15` }}>
                            <Settings size={10} /> {tr("superAdmin.mapping")}
                          </button>
                          {deleteTemplateId === tpl.id ? (
                            <div className="flex gap-1 items-center">
                              <button onClick={() => deleteTemplate(tpl.id)} className="px-2 py-0.5 rounded text-[10px] text-white" style={{ background: t.rose }}>{tr("common.delete")}</button>
                              <button onClick={() => setDeleteTemplateId(null)} className="px-2 py-0.5 rounded text-[10px]" style={{ color: t.muted }}>{tr("superAdmin.no")}</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteTemplateId(tpl.id)}
                              className="px-2 py-1 rounded text-[10px]" style={{ color: t.rose, background: `${t.rose}15` }}>
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── টেমপ্লেট তৈরি/সম্পাদনা Modal ── */}
      <Modal isOpen={showTemplateModal} onClose={() => { setShowTemplateModal(false); setEditingTemplate(null); }}
        title={editingTemplate ? tr("superAdmin.editTemplate") : tr("superAdmin.addNewTemplate")}
        subtitle={tr("superAdmin.globalTemplateDesc")} size="md">
        <div className="space-y-4">
          {/* নাম */}
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.nameEn")} *</label>
            <input value={tplForm.name} onChange={e => setTplForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Kobe Resume Template" />
          </div>
          {/* নাম বাংলা */}
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.nameBn")}</label>
            <input value={tplForm.name_bn} onChange={e => setTplForm(p => ({ ...p, name_bn: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Kobe Resume Template (BN)" />
          </div>
          {/* বিবরণ */}
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.description")}</label>
            <input value={tplForm.description} onChange={e => setTplForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder={tr("superAdmin.descriptionPlaceholder")} />
          </div>
          {/* ক্যাটেগরি + দেশ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.category")}</label>
              <select value={tplForm.category} onChange={e => setTplForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                {TEMPLATE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.country")}</label>
              <select value={tplForm.country} onChange={e => setTplForm(p => ({ ...p, country: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                {TEMPLATE_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {/* সাব-ক্যাটেগরি */}
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.subCategory")}</label>
            <input value={tplForm.sub_category} onChange={e => setTplForm(p => ({ ...p, sub_category: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="job_permission, rirekisho, birth_cert..." />
          </div>
          {/* ফাইল আপলোড — নতুন ও এডিট দুটোতেই */}
          <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.fileUpload")}</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer text-xs font-medium"
                  style={{ background: `${t.cyan}15`, color: t.cyan, border: `1px dashed ${t.cyan}40` }}>
                  <Upload size={14} />
                  {tplForm.file ? tplForm.file.name : tr("superAdmin.selectFile")}
                  <input type="file" accept=".xlsx,.docx,.xls,.doc,.pdf" className="hidden"
                    onChange={e => setTplForm(p => ({ ...p, file: e.target.files?.[0] || null }))} />
                </label>
                {tplForm.file && (
                  <button onClick={() => setTplForm(p => ({ ...p, file: null }))} className="text-[10px]" style={{ color: t.rose }}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          {/* সংরক্ষণ বাটন */}
          <div className="flex justify-end gap-2 pt-2" style={{ borderTop: `1px solid ${t.border}` }}>
            <Button variant="ghost" size="sm" onClick={() => { setShowTemplateModal(false); setEditingTemplate(null); }}>{tr("common.cancel")}</Button>
            <Button size="sm" icon={Save} onClick={saveTemplate}>
              {editingTemplate ? tr("superAdmin.update") : tr("superAdmin.addTemplate")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── ম্যাপিং Modal — placeholder → system field mapping ── */}
      <Modal isOpen={!!mappingTemplate} onClose={() => { setMappingTemplate(null); setTemplateMappings({}); setTemplateModifiers({}); }}
        title={tr("superAdmin.templateMapping")}
        subtitle={mappingTemplate ? `${mappingTemplate.name} — ${(() => { const td = typeof mappingTemplate.template_data === "string" ? JSON.parse(mappingTemplate.template_data) : mappingTemplate.template_data; return td?.placeholders?.length || 0; })()} ${tr("superAdmin.placeholders")}` : ""}
        size="xl">
        {mappingTemplate && (() => {
          const td = typeof mappingTemplate.template_data === "string" ? JSON.parse(mappingTemplate.template_data) : mappingTemplate.template_data;
          const placeholders = td?.placeholders || [];
          return (
            <div className="space-y-4">
              {/* ── FieldMapperTable — reusable mapping component ── */}
              <FieldMapperTable
                placeholders={placeholders}
                mappings={templateMappings}
                modifiers={templateModifiers}
                onMappingChange={(key, val) => setTemplateMappings(prev => ({ ...prev, [key]: val }))}
                onModifierChange={(key, val) => setTemplateModifiers(prev => ({ ...prev, [key]: val }))}
                extraGroups={docTypeGroups}
              />

              {/* ── বাটন ── */}
              <div className="flex justify-end gap-2 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                <Button variant="ghost" size="sm" onClick={() => { setMappingTemplate(null); setTemplateMappings({}); setTemplateModifiers({}); }}>{tr("common.cancel")}</Button>
                <Button size="sm" icon={Save} onClick={saveMappings} disabled={mappingSaving}>
                  {mappingSaving ? tr("superAdmin.saving") : tr("common.save")}
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      </>}

      {/* ══ TAB: ANALYTICS ══ */}
      {activeTab === "analytics" && analyticsData !== undefined && <>

        {/* ── তারিখ পরিসীমা নির্বাচন ── */}
        <div className="flex items-center gap-2">
          {[
            { days: 7, label: tr("superAdmin.7days") },
            { days: 30, label: tr("superAdmin.30days") },
            { days: 90, label: tr("superAdmin.90days") },
          ].map(opt => (
            <button key={opt.days} onClick={() => setAnalyticsDays(opt.days)}
              className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                background: analyticsDays === opt.days ? t.cyan : t.inputBg,
                color: analyticsDays === opt.days ? "#fff" : t.muted,
                border: `1px solid ${analyticsDays === opt.days ? t.cyan : t.inputBorder}`,
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        {analyticsLoading ? (
          <div className="text-center py-20 text-xs" style={{ color: t.muted }}>{tr("superAdmin.analyticsLoading")}...</div>
        ) : analyticsData ? (<>

          {/* ── KPI কার্ড ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: tr("superAdmin.totalPageViews"), value: (analyticsData.totalPageViews || 0).toLocaleString("en-IN"), color: t.cyan, icon: "👁️" },
              { label: tr("superAdmin.activeUsers"), value: analyticsData.activeUsers || 0, color: t.emerald, icon: "👤" },
              { label: tr("superAdmin.mostUsedFeature"), value: analyticsData.mostUsedFeature || "—", color: t.purple, icon: "⭐" },
              { label: tr("superAdmin.peakHour"), value: analyticsData.peakHour != null ? `${analyticsData.peakHour}:00` : "—", color: t.amber, icon: "⏰" },
            ].map((kpi, i) => (
              <Card key={i} delay={i * 40}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                  </div>
                  <span className="text-2xl opacity-40">{kpi.icon}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* ── ফিচার ব্যবহার — হরিজন্টাল বার চার্ট ── */}
          <Card delay={100}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">📊 {tr("superAdmin.featureUsage")}</h3>
            <div className="space-y-3">
              {(analyticsData.featureUsage || []).length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: t.muted }}>{tr("common.noData")}</p>
              ) : (() => {
                const maxVal = Math.max(...(analyticsData.featureUsage || []).map(f => f.count || 0), 1);
                const barColors = [t.cyan, t.emerald, t.purple, t.amber, t.rose];
                return (analyticsData.featureUsage || []).map((feature, i) => {
                  const pct = ((feature.count || 0) / maxVal) * 100;
                  return (
                    <div key={feature.name || i} className="flex items-center gap-3">
                      <div className="w-28 text-xs font-medium truncate" style={{ color: t.text }}>{feature.name}</div>
                      <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: `${t.border}40` }}>
                        <div className="h-full rounded-lg transition-all duration-500 flex items-center px-2"
                          style={{ width: `${Math.max(pct, 2)}%`, background: barColors[i % barColors.length] }}>
                          {pct > 20 && <span className="text-[10px] font-bold text-white">{(feature.count || 0).toLocaleString("en-IN")}</span>}
                        </div>
                      </div>
                      {pct <= 20 && <span className="text-[10px] font-medium" style={{ color: t.muted }}>{(feature.count || 0).toLocaleString("en-IN")}</span>}
                    </div>
                  );
                });
              })()}
            </div>
          </Card>

          {/* ── সক্রিয় ইউজার তালিকা ── */}
          <Card delay={150}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">👤 {tr("superAdmin.activeUsers")}</h3>
            {(analyticsData.activeUsersList || []).length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: t.muted }}>{tr("common.noData")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      {[tr("superAdmin.user"), tr("superAdmin.role"), tr("superAdmin.pageViews")].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(analyticsData.activeUsersList || []).map((user, i) => (
                      <tr key={user.id || i} style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                              style={{ background: `${t.cyan}15`, color: t.cyan }}>
                              {(user.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{user.name || "—"}</p>
                              {user.email && <p className="text-[10px]" style={{ color: t.muted }}>{user.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] px-2 py-0.5 rounded-lg font-medium"
                            style={{ background: `${t.purple}15`, color: t.purple }}>
                            {user.role || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold" style={{ color: t.cyan }}>{(user.pageViews || 0).toLocaleString("en-IN")}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ── পিক আওয়ার চার্ট — ২৪ ঘণ্টা ── */}
          <Card delay={200}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">⏰ {tr("superAdmin.peakHour24")}</h3>
            {(analyticsData.hourlyData || []).length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: t.muted }}>{tr("common.noData")}</p>
            ) : (() => {
              const hours = analyticsData.hourlyData || [];
              const maxH = Math.max(...hours.map(h => h.count || 0), 1);
              return (
                <div className="flex items-end gap-1" style={{ height: 140 }}>
                  {Array.from({ length: 24 }, (_, hr) => {
                    const found = hours.find(h => h.hour === hr);
                    const count = found ? found.count || 0 : 0;
                    const heightPct = (count / maxH) * 100;
                    const isPeak = analyticsData.peakHour === hr;
                    return (
                      <div key={hr} className="flex-1 flex flex-col items-center gap-1 group relative" title={`${hr}:00 — ${count} ${tr("superAdmin.views")}`}>
                        <div className="w-full rounded-t-md transition-all duration-300"
                          style={{
                            height: `${Math.max(heightPct, 3)}%`,
                            background: isPeak ? t.amber : `${t.cyan}80`,
                            minHeight: 4,
                          }} />
                        <span className="text-[8px]" style={{ color: hr % 3 === 0 ? t.muted : "transparent" }}>{hr}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>

          {/* ── দৈনিক ট্রেন্ড ── */}
          <Card delay={250}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">📈 {tr("superAdmin.dailyTrend")}</h3>
            {(analyticsData.dailyTrend || []).length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: t.muted }}>{tr("common.noData")}</p>
            ) : (() => {
              const daily = analyticsData.dailyTrend || [];
              const maxD = Math.max(...daily.map(d => d.count || 0), 1);
              return (
                <div>
                  <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
                    {daily.map((day, i) => {
                      const heightPct = ((day.count || 0) / maxD) * 100;
                      return (
                        <div key={day.date || i} className="flex-1 group relative" title={`${formatDateDisplay(day.date)} — ${day.count || 0} ${tr("superAdmin.views")}`}>
                          <div className="w-full rounded-t-sm transition-all duration-300"
                            style={{
                              height: `${Math.max(heightPct, 2)}%`,
                              background: t.emerald,
                              minHeight: 2,
                            }} />
                        </div>
                      );
                    })}
                  </div>
                  {/* তারিখ লেবেল — শুরু ও শেষ */}
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px]" style={{ color: t.muted }}>{formatDateDisplay(daily[0]?.date)}</span>
                    <span className="text-[9px]" style={{ color: t.muted }}>{formatDateDisplay(daily[daily.length - 1]?.date)}</span>
                  </div>
                </div>
              );
            })()}
          </Card>

        </>) : (
          <div className="text-center py-20 text-xs" style={{ color: t.muted }}>{tr("superAdmin.analyticsNoData")}</div>
        )}

      </>}

      {/* ── নতুন এজেন্সি তৈরি (agencies tab) ── */}
      {activeTab === "agencies" && <>
      {/* ── নতুন এজেন্সি তৈরি ── */}
      {showCreateForm && (
        <Card delay={0}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2"><Plus size={14} /> {tr("superAdmin.createAgency")}</h3>
            <Button variant="ghost" size="xs" icon={X} onClick={() => setShowCreateForm(false)}>{tr("common.cancel")}</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.agencyName")} *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="ABC Education" />
              {/* ── Prefix Preview — নামের আদ্যক্ষর দিয়ে ID prefix ── */}
              {form.name.trim() && (() => {
                const words = form.name.replace(/[^\x20-\x7E]/g, "").trim().split(/[\s\-_&]+/).filter(w => w.length > 0);
                const pfx = words.length >= 3 ? words.map(w => w[0]).join("").toUpperCase().slice(0, 4)
                  : words.length === 2 ? (words[0].slice(0, 2) + words[1][0]).toUpperCase()
                  : (words[0] || "").slice(0, 3).toUpperCase();
                return pfx ? (
                  <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: t.cyan }}>
                    {tr("superAdmin.idPrefix")}: <span className="font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: `${t.cyan}15` }}>{pfx}</span>
                    <span style={{ color: t.muted }}>→ {pfx}-S-2026-001</span>
                  </p>
                ) : null;
              })()}
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.nameBn")}</label>
              <input value={form.name_bn} onChange={e => setForm(p => ({ ...p, name_bn: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="ABC Education (BN)" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Subdomain * <span className="text-[9px] normal-case" style={{ color: t.cyan }}>.agencybook.net</span></label>
              <input value={form.subdomain} onChange={e => setForm(p => ({ ...p, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono" style={is} placeholder="abc-education" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.phone")}</label>
              <PhoneInput value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} size="md" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.email")}</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="info@agency.com" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.address")}</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Office address..." />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ID Prefix <span className="text-[9px] normal-case" style={{ color: t.muted }}>(auto or custom)</span></label>
              <input value={form.prefix} onChange={e => setForm(p => ({ ...p, prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono" style={is} placeholder={(() => {
                const words = (form.name || "").replace(/[^\x20-\x7E]/g, "").trim().split(/[\s\-_&]+/).filter(w => w.length > 0);
                return words.length >= 3 ? words.map(w => w[0]).join("").toUpperCase().slice(0, 4)
                  : words.length === 2 ? (words[0].slice(0, 2) + words[1][0]).toUpperCase()
                  : (words[0] || "").slice(0, 3).toUpperCase() || "ABC";
              })()} />
              <p className="text-[10px] mt-1" style={{ color: t.muted }}>
                Student ID: <span className="font-mono" style={{ color: t.cyan }}>{form.prefix || (() => {
                  const words = (form.name || "").replace(/[^\x20-\x7E]/g, "").trim().split(/[\s\-_&]+/).filter(w => w.length > 0);
                  return words.length >= 3 ? words.map(w => w[0]).join("").toUpperCase().slice(0, 4)
                    : words.length === 2 ? (words[0].slice(0, 2) + words[1][0]).toUpperCase()
                    : (words[0] || "").slice(0, 3).toUpperCase() || "?";
                })()}-S-2026-001</span>
              </p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.plan")}</label>
              <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                {PLANS.map(p => <option key={p.id} value={p.id}>{p.label} — {p.limit}</option>)}
              </select>
            </div>
          </div>

          {/* Admin user */}
          <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.cyan }}>{tr("superAdmin.agencyAdminUser")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.adminName")}</label>
              <input value={form.admin_name} onChange={e => setForm(p => ({ ...p, admin_name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Agency Owner" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.adminEmail")} *</label>
              <input value={form.admin_email} onChange={e => setForm(p => ({ ...p, admin_email: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="owner@agency.com" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("superAdmin.password")} *</label>
              <input type="password" value={form.admin_password} onChange={e => setForm(p => ({ ...p, admin_password: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder={tr("superAdmin.minChars")} autoComplete="new-password" />
            </div>
          </div>

          {/* Dedicated toggle */}
          <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-4" style={{ background: t.inputBg }}>
            <input type="checkbox" checked={form.dedicated} onChange={e => setForm(p => ({ ...p, dedicated: e.target.checked }))}
              className="w-4 h-4 rounded" style={{ accentColor: t.purple }} />
            <div>
              <p className="text-xs font-semibold">{tr("superAdmin.dedicatedMode")}</p>
              <p className="text-[10px]" style={{ color: t.muted }}>{tr("superAdmin.dedicatedModeDesc")}</p>
            </div>
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreateForm(false)}>{tr("common.cancel")}</Button>
            <Button icon={Save} onClick={createAgency}>{tr("superAdmin.createAgencyBtn")}</Button>
          </div>
        </Card>
      )}

      {/* ── এজেন্সি তালিকা ── */}
      <Card delay={100}>
        <h3 className="text-sm font-semibold mb-4">{tr("superAdmin.allAgencies")} ({agencies.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                {[tr("superAdmin.agency"), tr("superAdmin.subdomain"), tr("superAdmin.feePerStudent"), tr("superAdmin.students"), tr("superAdmin.trial"), tr("superAdmin.status"), tr("common.actions")].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agencies.map(agency => {
                const planInfo = PLANS.find(p => p.id === agency.plan) || PLANS[0];
                const isDedicated = agency.settings?.dedicated;
                return (
                  <React.Fragment key={agency.id}>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: `${t.cyan}15`, color: t.cyan }}>
                          {(agency.name || "A").charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{agency.name}</p>
                          <p className="text-[9px]" style={{ color: t.muted }}>{agency.name_bn || ""} {isDedicated ? `• ${tr("superAdmin.dedicated")}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px]" style={{ color: t.cyan }}>{agency.subdomain}.agencybook.net</td>
                    <td className="py-3 px-4">
                      {isDedicated ? (
                        <Badge color={t.purple} size="xs">{tr("superAdmin.dedicated")}</Badge>
                      ) : (
                        <span className="text-xs font-mono font-bold" style={{ color: t.emerald }}>৳{(agency.per_student_fee || 0).toLocaleString("en-IN")}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">{agency.studentCount || 0}</td>
                    <td className="py-3 px-4">
                      {(() => {
                        const trialActive = agency.trial_ends_at && new Date(agency.trial_ends_at) > new Date();
                        const daysLeft = trialActive ? Math.ceil((new Date(agency.trial_ends_at) - new Date()) / 86400000) : 0;
                        return trialActive ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${t.amber}15`, color: t.amber }}>{daysLeft} {tr("superAdmin.daysLeft")}</span>
                        ) : (
                          <span className="text-[10px]" style={{ color: t.muted }}>{tr("superAdmin.ended")}</span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge color={agency.status === "active" ? t.emerald : agency.status === "suspended" ? t.rose : t.amber} size="xs">
                        {agency.status === "active" ? tr("superAdmin.activeStatus") : agency.status === "suspended" ? tr("superAdmin.suspended") : agency.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1">
                          {switchConfirmId === agency.id ? (
                            <div className="flex gap-1 items-center">
                              <span className="text-[10px]" style={{ color: t.amber }}>{tr("superAdmin.switchQ")}</span>
                              <button onClick={() => switchToAgency(agency)} className="px-2 py-0.5 rounded text-[10px] text-white" style={{ background: t.cyan }}>{tr("superAdmin.yes")}</button>
                              <button onClick={() => setSwitchConfirmId(null)} className="px-2 py-0.5 rounded text-[10px]" style={{ color: t.muted }}>{tr("superAdmin.no")}</button>
                            </div>
                          ) : (
                            <button onClick={() => setSwitchConfirmId(agency.id)}
                              className="px-2 py-1 rounded text-[10px]" style={{ color: t.cyan, background: `${t.cyan}15` }}>
                              🔄 {tr("superAdmin.switch")}
                            </button>
                          )}
                          <button onClick={() => {
                            setForm({ name: agency.name || "", name_bn: agency.name_bn || "", subdomain: agency.subdomain || "", phone: agency.phone || "", email: agency.email || "", address: agency.address || "", plan: agency.plan || "standard", admin_name: "", admin_email: "", admin_password: "", dedicated: agency.dedicated || false });
                            setEditingId(editingId === agency.id ? null : agency.id);
                          }} className="px-2 py-1 rounded text-[10px]" style={{ color: t.amber, background: `${t.amber}15` }}>
                            ✏️ {tr("common.edit")}
                          </button>
                        </div>
                        <div className="flex gap-1">
                          {agency.status === "active" ? (
                            <button onClick={() => updateAgency(agency.id, { status: "suspended" })}
                              className="px-2 py-0.5 rounded text-[10px]" style={{ color: t.rose, background: `${t.rose}15` }}>{tr("superAdmin.suspend")}</button>
                          ) : (
                            <button onClick={() => updateAgency(agency.id, { status: "active" })}
                              className="px-2 py-0.5 rounded text-[10px]" style={{ color: t.emerald, background: `${t.emerald}15` }}>{tr("superAdmin.activate")}</button>
                          )}
                          {deleteConfirmId === agency.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => deleteAgency(agency.id)} className="px-2 py-0.5 rounded text-[10px] text-white" style={{ background: t.rose }}>{tr("common.delete")}</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-0.5 rounded text-[10px]" style={{ color: t.muted }}>{tr("superAdmin.no")}</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(agency.id)} className="px-2 py-0.5 rounded text-[10px]" style={{ color: t.muted }}>🗑️ {tr("common.delete")}</button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  {/* ── Inline Edit Form ── */}
                  {editingId === agency.id && !showCreateForm && (
                    <tr>
                      <td colSpan={7} style={{ background: `${t.amber}08` }}>
                        <div className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            {[
                              { key: "name", label: tr("superAdmin.nameEn") },
                              { key: "name_bn", label: tr("superAdmin.nameBn") },
                              { key: "phone", label: tr("superAdmin.phone") },
                              { key: "email", label: tr("superAdmin.email") },
                              { key: "address", label: tr("superAdmin.address") },
                              { key: "subdomain", label: tr("superAdmin.subdomain") },
                            ].map(f => (
                              <div key={f.key}>
                                <label className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{f.label}</label>
                                <input value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                  className="w-full mt-1 px-3 py-1.5 rounded-lg text-xs outline-none" style={is} />
                              </div>
                            ))}
                            <div>
                              <label className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{tr("superAdmin.plan")}</label>
                              <select value={form.plan || "standard"} onChange={e => setForm({ ...form, plan: e.target.value })}
                                className="w-full mt-1 px-3 py-1.5 rounded-lg text-xs outline-none" style={is}>
                                {PLANS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{tr("superAdmin.status")}</label>
                              <select value={agency.status || "active"} onChange={e => updateAgency(agency.id, { status: e.target.value })}
                                className="w-full mt-1 px-3 py-1.5 rounded-lg text-xs outline-none" style={is}>
                                <option value="active">{tr("superAdmin.activeStatus")}</option>
                                <option value="suspended">{tr("superAdmin.suspended")}</option>
                                <option value="trial">{tr("superAdmin.trialStatus")}</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { updateAgency(agency.id, { name: form.name, name_bn: form.name_bn, phone: form.phone, email: form.email, address: form.address, subdomain: form.subdomain, plan: form.plan }); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: t.emerald, color: "#000" }}>💾 {tr("common.save")}</button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: t.muted }}>{tr("common.cancel")}</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
              {agencies.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center" style={{ color: t.muted }}>{tr("superAdmin.noAgencies")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      </>}

      {/* ══ TAB: AI RESUME BUILDER — Excel template-এ AI দিয়ে placeholder বসানো ══ */}
      {activeTab === "ai-resume" && <AIResumeBuilder t={t} toast={toast} token={token} API_URL={API_URL} />}

    </div>
  );
}

// ════════════════════════════════════════════════════════
// AIResumeBuilder — Super Admin only AI placeholder tool
// Raw Excel upload → Claude Haiku analysis → review → save
// ════════════════════════════════════════════════════════
function AIResumeBuilder({ t, toast, token, API_URL }) {
  const { t: tr } = useLanguage();

  const [file, setFile] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [engine, setEngine] = useState("");
  const [inserting, setInserting] = useState(false);
  const [done, setDone] = useState(false);

  const fileRef = React.useRef(null);
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
  const confColor = { high: t.emerald, medium: t.amber, low: t.rose };

  // ── Excel upload → AI analyze ──
  const doAnalyze = async () => {
    if (!file) { toast.error("Excel ফাইল আপলোড করুন"); return; }
    // School name optional — filename থেকে auto detect
    if (!schoolName.trim()) setSchoolName(file.name.replace(/\.xlsx?$/i, "").replace(/[_-]/g, " "));
    setAnalyzing(true);
    setSuggestions([]);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("school_name", schoolName);
      const res = await fetch(`${API_URL}/excel/ai-analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuggestions((data.suggestions || []).map(s => ({ ...s, approved: s.confidence !== "low" })));
      setStats(data.stats);
      setEngine(data.engine || "claude-haiku");
      toast.success(`AI: ${data.stats?.total || 0} fields detected`);
    } catch (err) {
      toast.error("AI Analysis: " + (err.message || "ব্যর্থ"));
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Approved suggestions → insert placeholders → download ──
  const doInsert = async () => {
    const approved = suggestions.filter(s => s.approved && s.field);
    if (!approved.length) { toast.error("কমপক্ষে ১টি field approve করুন"); return; }
    setInserting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("school_name", schoolName);
      form.append("suggestions", JSON.stringify(approved));
      const res = await fetch(`${API_URL}/excel/ai-insert-placeholders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Failed"); }
      // Download .xlsx file
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(schoolName || "template").replace(/\s+/g, "_")}_with_placeholders.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      toast.success(`${approved.length} placeholders inserted — ডাউনলোড হচ্ছে!`);
    } catch (err) {
      toast.error(err.message || "Insert ব্যর্থ");
    } finally {
      setInserting(false);
    }
  };

  // ── Reset ──
  const reset = () => {
    setFile(null); setSchoolName(""); setSuggestions([]); setStats(null); setEngine(""); setDone(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const approvedCount = suggestions.filter(s => s.approved).length;

  return (
    <div className="space-y-4">
      {/* ── Step 1: Upload ── */}
      <Card delay={50}>
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
          🤖 AI Resume Placeholder Builder
          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full" style={{ background: `${t.purple}15`, color: t.purple }}>Super Admin Only</span>
        </h3>
        <p className="text-xs mb-4" style={{ color: t.muted }}>
          Raw Excel template (placeholder ছাড়া) আপলোড করুন → AI সব cell analyze করে appropriate placeholder suggest করবে → Review করে Save করুন
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Template নাম <span className="normal-case" style={{ color: t.muted }}>(optional — ফাইল নাম থেকে নেবে)</span></label>
            <input value={schoolName} onChange={e => setSchoolName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}
              placeholder="e.g. Tokyo Galaxy, Osaka YMCA" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Excel ফাইল (.xlsx) *</label>
            <input ref={fileRef} type="file" accept=".xlsx,.xls"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs px-3 py-2 rounded-lg outline-none" style={is} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={doAnalyze} disabled={analyzing || !file || !schoolName.trim()}
            style={{ background: `linear-gradient(135deg, ${t.purple}, ${t.cyan})` }}>
            {analyzing ? "🤖 Analyzing..." : "🤖 AI Analyze"}
          </Button>
          {suggestions.length > 0 && (
            <Button variant="ghost" size="xs" onClick={reset}>🔄 Reset</Button>
          )}
          {done && (
            <span className="text-xs flex items-center gap-1" style={{ color: t.emerald }}>
              <Check size={14} /> Template saved with placeholders!
            </span>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <span className="text-xs" style={{ color: t.muted }}>
              Total: <strong style={{ color: t.cyan }}>{stats.total}</strong>
            </span>
            <span className="text-xs" style={{ color: t.muted }}>
              High: <strong style={{ color: t.emerald }}>{stats.high}</strong>
            </span>
            <span className="text-xs" style={{ color: t.muted }}>
              Medium: <strong style={{ color: t.amber }}>{stats.medium}</strong>
            </span>
            <span className="text-xs" style={{ color: t.muted }}>
              Low: <strong style={{ color: t.rose }}>{stats.low}</strong>
            </span>
            {engine && (
              <span className="text-[10px] px-2 py-0.5 rounded-full ml-auto" style={{ background: `${t.purple}15`, color: t.purple }}>
                {engine}
              </span>
            )}
          </div>
        )}
      </Card>

      {/* ── Step 2: Review Suggestions ── */}
      {suggestions.length > 0 && (
        <Card delay={80}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">AI Suggestions — Review & Approve</h4>
            <div className="flex items-center gap-2">
              <button onClick={() => setSuggestions(prev => prev.map(s => ({ ...s, approved: true })))}
                className="text-[10px] px-2 py-1 rounded-lg" style={{ background: `${t.emerald}15`, color: t.emerald }}>✓ All</button>
              <button onClick={() => setSuggestions(prev => prev.map(s => ({ ...s, approved: s.confidence === "high" })))}
                className="text-[10px] px-2 py-1 rounded-lg" style={{ background: `${t.cyan}15`, color: t.cyan }}>✓ High Only</button>
              <button onClick={() => setSuggestions(prev => prev.map(s => ({ ...s, approved: false })))}
                className="text-[10px] px-2 py-1 rounded-lg" style={{ background: `${t.muted}15`, color: t.muted }}>✗ None</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["", "Sheet", "Cell", "System Field", "Confidence", "Reasoning"].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.border}`, opacity: s.approved ? 1 : 0.4 }}
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td className="py-2 px-3">
                      <input type="checkbox" checked={!!s.approved}
                        onChange={() => setSuggestions(prev => prev.map((x, j) => j === i ? { ...x, approved: !x.approved } : x))}
                        style={{ accentColor: t.cyan }} />
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${t.purple}10`, color: t.purple }}>{s.sheet || "—"}</span>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold" style={{ color: t.cyan }}>{s.cellRef}</td>
                    <td className="py-2 px-3" style={{ minWidth: 180 }}>
                      <select value={s.field || ""} onChange={e => setSuggestions(prev => prev.map((x, j) => j === i ? { ...x, field: e.target.value, approved: !!e.target.value } : x))}
                        className="px-2 py-1 rounded text-xs outline-none" style={is}>
                        <option value="">— Select —</option>
                        {SYSTEM_FIELDS_FLAT.map(f => (
                          <option key={f.key} value={f.key}>{f.key} ({f.label})</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${confColor[s.confidence] || t.muted}15`, color: confColor[s.confidence] || t.muted }}>
                        {s.confidence}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[10px] max-w-[250px] truncate" style={{ color: t.muted }} title={s.reasoning}>
                      {s.reasoning || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Insert button */}
          <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <p className="text-xs" style={{ color: t.muted }}>
              Approved: <strong style={{ color: t.cyan }}>{approvedCount}</strong> / {suggestions.length}
            </p>
            <Button onClick={doInsert} disabled={inserting || approvedCount === 0}
              style={{ background: `linear-gradient(135deg, ${t.emerald}, ${t.cyan})` }}>
              {inserting ? "Inserting..." : `⬇️ Insert ${approvedCount} Placeholders & Download`}
            </Button>
          </div>
        </Card>
      )}

      {/* How it works */}
      {suggestions.length === 0 && !analyzing && (
        <Card delay={100}>
          <h4 className="text-sm font-semibold mb-3">কিভাবে কাজ করে?</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "১", title: "Raw Excel আপলোড", desc: "স্কুলের original Excel ফরম (.xlsx) আপলোড করুন — কোনো placeholder লাগবে না", color: t.cyan },
              { step: "২", title: "AI Analysis", desc: "Claude AI সব cell analyze করে — Japanese/Bengali/English label detect করে সঠিক field suggest করবে", color: t.purple },
              { step: "৩", title: "Review & Save", desc: "AI-র suggestion review করুন, edit করুন, approve করুন — template save হবে placeholder সহ", color: t.emerald },
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-black mb-2"
                  style={{ background: `${s.color}20`, color: s.color }}>{s.step}</div>
                <p className="text-xs font-bold mb-1">{s.title}</p>
                <p className="text-[10px]" style={{ color: t.muted }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-3 text-center" style={{ color: t.muted }}>
            💡 Cost: প্রতি template ~$0.002 (Claude Haiku) • Merged cells ও multi-sheet সাপোর্ট করে
          </p>
        </Card>
      )}
    </div>
  );
}
