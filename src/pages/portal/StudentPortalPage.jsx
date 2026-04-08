import { useState, useEffect, useRef } from "react";
import { Save, LogOut, ChevronDown, ChevronRight, Check, Lock, User, FileText, DollarSign, Clock, Upload, Eye, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { PIPELINE_STATUSES } from "../../data/students";
import { API_URL } from "../../lib/api";
import { formatDateDisplay } from "../../components/ui/DateInput";

/**
 * StudentPortalPage — স্টুডেন্ট নিজের তথ্য দেখবে ও পূরণ করবে
 * Admin যে section enable করেছে শুধু সেগুলো দেখাবে
 */
export default function StudentPortalPage({ studentUser, studentToken, onLogout }) {
  const t = useTheme();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [formConfig, setFormConfig] = useState([]);
  const [fees, setFees] = useState({ items: [], payments: [], totalDue: 0, totalPaid: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });

  // ── পেমেন্ট ইতিহাস state ──
  const [payments, setPayments] = useState([]);

  // ── ডকুমেন্ট state ──
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [docForm, setDocForm] = useState({ doc_type: "", label: "", notes: "" });
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // API_URL top-level import থেকে আসে

  const headers = { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" };

  // ── ডাটা লোড ──
  useEffect(() => {
    const load = async () => {
      const hdrs = { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" };
      try {
        const [profileRes, configRes, feesRes, paymentsRes, docsRes] = await Promise.all([
          fetch(`${API_URL}/student-portal/me`, { headers: hdrs }),
          fetch(`${API_URL}/student-portal/form-config`, { headers: hdrs }),
          fetch(`${API_URL}/student-portal/fees`, { headers: hdrs }),
          fetch(`${API_URL}/student-portal/payments`, { headers: hdrs }),
          fetch(`${API_URL}/student-portal/documents`, { headers: hdrs }),
        ]);
        const p = await profileRes.json();
        const c = await configRes.json();
        const f = await feesRes.json();
        const pay = await paymentsRes.json();
        const docs = await docsRes.json();
        if (profileRes.ok) { setProfile(p); setEditData({ ...p }); }
        if (configRes.ok && Array.isArray(c)) setFormConfig(c);
        if (feesRes.ok) setFees(f);
        if (paymentsRes.ok && Array.isArray(pay)) setPayments(pay);
        if (docsRes.ok && Array.isArray(docs)) setDocuments(docs);
      } catch (err) { console.error("[Portal Load]", err); toast.error("ডাটা লোড করতে সমস্যা হয়েছে"); }
      setLoading(false);
    };
    load();
  }, [studentToken]);

  // ── ডাটা সংরক্ষণ ──
  const saveData = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/student-portal/me`, {
        method: "PATCH", headers, body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setEditData({ ...data });
        toast.success("তথ্য সংরক্ষিত হয়েছে");
      } else {
        toast.error(data.error || "সংরক্ষণ ব্যর্থ");
      }
    } catch { toast.error("সার্ভারে সমস্যা"); }
    setSaving(false);
  };

  // ── পাসওয়ার্ড পরিবর্তন ──
  const changePassword = async () => {
    if (!pwForm.current || !pwForm.new) { toast.error("পুরানো ও নতুন পাসওয়ার্ড দিন"); return; }
    if (pwForm.new.length < 6) { toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর"); return; }
    if (pwForm.new !== pwForm.confirm) { toast.error("নতুন পাসওয়ার্ড মিলছে না"); return; }
    try {
      const res = await fetch(`${API_URL}/student-portal/change-password`, {
        method: "POST", headers,
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.new }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে");
        setShowPasswordForm(false);
        setPwForm({ current: "", new: "", confirm: "" });
      } else {
        toast.error(data.error || "পরিবর্তন ব্যর্থ");
      }
    } catch { toast.error("সার্ভারে সমস্যা"); }
  };

  // ── ডকুমেন্ট আপলোড ──
  const handleDocUpload = async () => {
    if (!selectedFile) { toast.error("ফাইল নির্বাচন করুন"); return; }
    if (!docForm.doc_type) { toast.error("ডকুমেন্ট টাইপ নির্বাচন করুন"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("doc_type", docForm.doc_type);
      formData.append("label", docForm.label || docForm.doc_type);
      if (docForm.notes) formData.append("notes", docForm.notes);

      const res = await fetch(`${API_URL}/student-portal/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${studentToken}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setDocuments(prev => [data, ...prev]);
        setDocForm({ doc_type: "", label: "", notes: "" });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.success("ডকুমেন্ট আপলোড হয়েছে");
      } else {
        toast.error(data.error || "আপলোড ব্যর্থ");
      }
    } catch { toast.error("সার্ভারে সমস্যা"); }
    setUploading(false);
  };

  // ── ডকুমেন্ট স্ট্যাটাস config ──
  const DOC_STATUS_MAP = {
    pending: { label: "পেন্ডিং", color: "amber", icon: AlertCircle },
    approved: { label: "অনুমোদিত", color: "emerald", icon: CheckCircle },
    rejected: { label: "প্রত্যাখ্যাত", color: "rose", icon: XCircle },
    verified: { label: "যাচাইকৃত", color: "emerald", icon: CheckCircle },
    not_submitted: { label: "জমা হয়নি", color: "muted", icon: AlertCircle },
  };

  // ── ডকুমেন্ট টাইপ options ──
  const DOC_TYPE_OPTIONS = [
    { value: "passport", label: "পাসপোর্ট কপি" },
    { value: "nid", label: "NID / জন্ম সনদ" },
    { value: "photo", label: "ছবি (ফটো)" },
    { value: "ssc_certificate", label: "SSC সার্টিফিকেট" },
    { value: "hsc_certificate", label: "HSC সার্টিফিকেট" },
    { value: "degree_certificate", label: "ডিগ্রি সার্টিফিকেট" },
    { value: "transcript", label: "ট্রান্সক্রিপ্ট" },
    { value: "jp_certificate", label: "জাপানি ভাষা সার্টিফিকেট" },
    { value: "bank_statement", label: "ব্যাংক স্টেটমেন্ট" },
    { value: "bank_solvency", label: "ব্যাংক সলভেন্সি" },
    { value: "sponsor_letter", label: "স্পনসর লেটার" },
    { value: "medical", label: "মেডিকেল রিপোর্ট" },
    { value: "police_clearance", label: "পুলিশ ক্লিয়ারেন্স" },
    { value: "other", label: "অন্যান্য" },
  ];

  // ── পেমেন্ট ক্যাটাগরি বাংলা label ──
  const PAYMENT_CAT_BN = {
    enrollment_fee: "ভর্তি ফি",
    course_fee: "কোর্স ফি",
    doc_processing: "ডকুমেন্ট প্রসেসিং",
    visa_fee: "ভিসা ফি",
    service_charge: "সার্ভিস চার্জ",
    shokai_fee: "শোকাই ফি",
    other_income: "অন্যান্য",
  };

  // ── ফর্ম ইনপুট render ──
  const renderField = (field) => {
    const val = editData[field.key] || "";
    const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

    if (field.type === "select") {
      return (
        <select value={val} onChange={e => setEditData(p => ({ ...p, [field.key]: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
          <option value="">-- নির্বাচন করুন --</option>
          {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (field.type === "textarea") {
      return (
        <textarea value={val} onChange={e => setEditData(p => ({ ...p, [field.key]: e.target.value }))}
          rows={3} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={is} />
      );
    }
    return (
      <input type={field.type || "text"} value={val}
        onChange={e => setEditData(p => ({ ...p, [field.key]: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}
        placeholder={field.label} />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 anim-fade">
        <div className="text-center">
          <div className="h-10 w-10 mx-auto mb-3 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${t.emerald}, ${t.cyan})` }}>
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <p className="text-xs" style={{ color: t.muted }}>লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-sm" style={{ color: t.muted }}>প্রোফাইল লোড ব্যর্থ — আবার লগইন করুন</p>
        <button onClick={onLogout} className="mt-3 px-4 py-2 rounded-lg text-xs" style={{ background: t.inputBg, color: t.cyan }}>লগআউট</button>
      </div>
    );
  }

  const statusInfo = PIPELINE_STATUSES.find(s => s.code === profile.status);

  return (
    <div className="space-y-5 anim-fade max-w-4xl mx-auto">
      {/* ── হেডার ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-lg font-bold"
            style={{ background: `linear-gradient(135deg, ${t.emerald}30, ${t.cyan}30)`, color: t.emerald }}>
            {(profile.name_en || "S").charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">স্বাগতম, {profile.name_bn || profile.name_en}!</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>
              {profile.id} • {profile.school || "—"} • {profile.batch || "—"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="xs" icon={Lock} onClick={() => setShowPasswordForm(!showPasswordForm)}>পাসওয়ার্ড</Button>
          <Button variant="ghost" size="xs" icon={LogOut} onClick={onLogout}>লগআউট</Button>
        </div>
      </div>

      {/* ── পাইপলাইন স্ট্যাটাস ── */}
      <Card delay={50}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${statusInfo?.color || t.cyan}15` }}>
            <Clock size={20} style={{ color: statusInfo?.color || t.cyan }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">
              বর্তমান অবস্থা: <span style={{ color: statusInfo?.color || t.cyan }}>{statusInfo?.label || profile.status}</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>
              নিচের ফর্মগুলো পূরণ করুন — আপনার এজেন্সি নির্দেশনা দিবে
            </p>
          </div>
          <StatusBadge status={profile.status} />
        </div>
      </Card>

      {/* ── পাসওয়ার্ড পরিবর্তন ── */}
      {showPasswordForm && (
        <Card delay={0}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Lock size={14} /> পাসওয়ার্ড পরিবর্তন</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>বর্তমান পাসওয়ার্ড</label>
              <input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} autoComplete="current-password" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নতুন পাসওয়ার্ড</label>
              <input type="password" value={pwForm.new} onChange={e => setPwForm(p => ({ ...p, new: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} autoComplete="new-password" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নিশ্চিত করুন</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} autoComplete="new-password" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="xs" onClick={changePassword}>পরিবর্তন করুন</Button>
            <Button size="xs" variant="ghost" onClick={() => setShowPasswordForm(false)}>বাতিল</Button>
          </div>
        </Card>
      )}

      {/* ── ডাটা ইনপুট ফর্ম — Admin-defined sections ── */}
      {formConfig.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText size={14} style={{ color: t.cyan }} /> আপনার তথ্য পূরণ করুন
            </h3>
            <Button icon={Save} size="xs" onClick={saveData} disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </Button>
          </div>

          {formConfig.map((section, idx) => {
            const isOpen = activeSection === section.section_key;
            const fields = Array.isArray(section.fields) ? section.fields : [];
            const filledCount = fields.filter(f => editData[f.key]).length;

            return (
              <Card key={section.id || idx} delay={idx * 30}>
                {/* Section header — ক্লিক করে expand/collapse */}
                <button onClick={() => setActiveSection(isOpen ? null : section.section_key)}
                  className="w-full flex items-center gap-3 text-left">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: `${t.cyan}12` }}>
                    {section.section_key === "personal" ? "👤" :
                     section.section_key === "identity" ? "🛂" :
                     section.section_key === "address" ? "📍" :
                     section.section_key === "family" ? "👨‍👩‍👧" :
                     section.section_key === "education" ? "🎓" :
                     section.section_key === "jp_exam" ? "🇯🇵" : "📋"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{section.section_label_bn || section.section_label}</p>
                    <p className="text-[10px]" style={{ color: t.muted }}>
                      {fields.length > 0 ? `${filledCount}/${fields.length} পূরণ হয়েছে` : "ডাটা ইনপুট"}
                    </p>
                  </div>
                  {fields.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      {filledCount === fields.length && fields.length > 0 ? (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: `${t.emerald}15`, color: t.emerald }}>
                          <Check size={10} /> সম্পন্ন
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: `${t.amber}15`, color: t.amber }}>
                          অসম্পূর্ণ
                        </span>
                      )}
                    </div>
                  )}
                  {isOpen ? <ChevronDown size={16} style={{ color: t.muted }} /> : <ChevronRight size={16} style={{ color: t.muted }} />}
                </button>

                {/* Fields */}
                {isOpen && fields.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${t.border}` }}>
                    {fields.map(field => (
                      <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                        <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>
                          {field.label} {field.required && <span style={{ color: t.rose }}>*</span>}
                        </label>
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                )}

                {isOpen && fields.length === 0 && (
                  <p className="text-xs mt-4 pt-3 text-center" style={{ color: t.muted, borderTop: `1px solid ${t.border}` }}>
                    এই সেকশনের ফর্ম এজেন্সি কনফিগার করবে
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card delay={100}>
          <p className="text-xs text-center py-6" style={{ color: t.muted }}>
            এজেন্সি এখনো ফর্ম কনফিগার করেনি — পরে আবার দেখুন
          </p>
        </Card>
      )}

      {/* ── ফি সারাংশ ── */}
      <Card delay={200}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <DollarSign size={14} style={{ color: t.emerald }} /> পেমেন্ট সারাংশ
        </h3>
        {fees.items.length > 0 ? (
          <>
            <div className="space-y-1.5">
              {fees.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: t.inputBg }}>
                  <span className="text-xs">{item.label || PAYMENT_CAT_BN[item.category] || item.category}</span>
                  <span className="text-xs font-bold font-mono">৳{(item.amount || 0).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
            {/* ── সারসংক্ষেপ — মোট / পরিশোধিত / বাকি ── */}
            <div className="grid grid-cols-3 gap-3 pt-3 mt-3" style={{ borderTop: `1px solid ${t.border}` }}>
              <div className="text-center p-2.5 rounded-lg" style={{ background: t.inputBg }}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>মোট ফি</p>
                <p className="text-sm font-bold mt-1 font-mono">৳{fees.totalDue.toLocaleString("en-IN")}</p>
              </div>
              <div className="text-center p-2.5 rounded-lg" style={{ background: `${t.emerald}08` }}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.emerald }}>পরিশোধিত</p>
                <p className="text-sm font-bold mt-1 font-mono" style={{ color: t.emerald }}>৳{fees.totalPaid.toLocaleString("en-IN")}</p>
              </div>
              <div className="text-center p-2.5 rounded-lg" style={{ background: fees.balance > 0 ? `${t.rose}08` : `${t.emerald}08` }}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: fees.balance > 0 ? t.rose : t.emerald }}>বাকি</p>
                <p className="text-sm font-bold mt-1 font-mono" style={{ color: fees.balance > 0 ? t.rose : t.emerald }}>৳{fees.balance.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-center py-4" style={{ color: t.muted }}>কোনো ফি রেকর্ড নেই</p>
        )}
      </Card>

      {/* ── পেমেন্ট ইতিহাস (বিস্তারিত টেবিল) ── */}
      <Card delay={250}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock size={14} style={{ color: t.cyan }} /> পেমেন্ট ইতিহাস
        </h3>
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["তারিখ", "ক্যাটাগরি", "বিবরণ", "পরিমাণ", "পদ্ধতি", "রশিদ", "নোট"].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id || i} style={{ borderBottom: `1px solid ${t.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td className="py-2.5 px-3 whitespace-nowrap">{formatDateDisplay(p.date || p.created_at)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: `${t.cyan}12`, color: t.cyan }}>
                        {PAYMENT_CAT_BN[p.category] || p.category || "—"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{p.label || "—"}</td>
                    <td className="py-2.5 px-3 font-bold font-mono" style={{ color: t.emerald }}>
                      ৳{(p.amount || p.paid_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3">{p.method || p.payment_method || "—"}</td>
                    <td className="py-2.5 px-3" style={{ color: t.muted }}>{p.receipt_no || "—"}</td>
                    <td className="py-2.5 px-3" style={{ color: t.muted }}>{p.notes || p.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* ── মোট পরিশোধিত row ── */}
            <div className="flex justify-end pt-2 mt-1 px-3" style={{ borderTop: `1px solid ${t.border}` }}>
              <span className="text-xs" style={{ color: t.muted }}>মোট পরিশোধিত:&nbsp;</span>
              <span className="text-xs font-bold font-mono" style={{ color: t.emerald }}>
                ৳{payments.reduce((s, p) => s + (p.amount || p.paid_amount || 0), 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-center py-4" style={{ color: t.muted }}>কোনো পেমেন্ট রেকর্ড নেই</p>
        )}
      </Card>

      {/* ── ডকুমেন্ট সেকশন ── */}
      <Card delay={300}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText size={14} style={{ color: t.purple }} /> ডকুমেন্ট
        </h3>

        {/* ── আপলোড ফর্ম ── */}
        <div className="p-4 rounded-xl mb-4" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
          <p className="text-xs font-semibold mb-3 flex items-center gap-2">
            <Upload size={12} style={{ color: t.purple }} /> নতুন ডকুমেন্ট আপলোড করুন
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* ডকুমেন্ট টাইপ */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ডকুমেন্ট টাইপ <span style={{ color: t.rose }}>*</span></label>
              <select value={docForm.doc_type} onChange={e => setDocForm(p => ({ ...p, doc_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: t.card, border: `1px solid ${!docForm.doc_type && selectedFile ? t.rose : t.inputBorder}`, color: t.text }}>
                <option value="">-- নির্বাচন করুন --</option>
                {DOC_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {/* লেবেল (ঐচ্ছিক) */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>লেবেল / শিরোনাম</label>
              <input type="text" value={docForm.label} onChange={e => setDocForm(p => ({ ...p, label: e.target.value }))}
                placeholder="যেমন: পাসপোর্ট পেজ ১"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: t.card, border: `1px solid ${t.inputBorder}`, color: t.text }} />
            </div>
            {/* নোট */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নোট</label>
              <input type="text" value={docForm.notes} onChange={e => setDocForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="অতিরিক্ত তথ্য..."
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: t.card, border: `1px solid ${t.inputBorder}`, color: t.text }} />
            </div>
          </div>

          {/* ফাইল ইনপুট ও আপলোড বাটন */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 relative">
              <input ref={fileInputRef} type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs px-3 py-2 rounded-lg outline-none"
                style={{ background: t.card, border: `1px solid ${t.inputBorder}`, color: t.text }} />
              {selectedFile && (
                <p className="text-[10px] mt-1" style={{ color: t.muted }}>
                  নির্বাচিত: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
            <Button icon={Upload} size="xs" onClick={handleDocUpload} disabled={uploading}>
              {uploading ? "আপলোড হচ্ছে..." : "আপলোড"}
            </Button>
          </div>
          <p className="text-[10px] mt-2" style={{ color: t.muted }}>
            সমর্থিত ফরম্যাট: JPG, PNG, WEBP, PDF, DOC, DOCX • সর্বোচ্চ 5MB
          </p>
        </div>

        {/* ── ডকুমেন্ট তালিকা ── */}
        {documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["টাইপ", "লেবেল", "তারিখ", "স্ট্যাটাস", "নোট", "ফাইল"].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => {
                  const st = DOC_STATUS_MAP[doc.status] || DOC_STATUS_MAP.pending;
                  const StIcon = st.icon;
                  const typeLabel = DOC_TYPE_OPTIONS.find(o => o.value === doc.doc_type)?.label || doc.doc_type || "—";
                  return (
                    <tr key={doc.id || i} style={{ borderBottom: `1px solid ${t.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td className="py-2.5 px-3 font-medium">{typeLabel}</td>
                      <td className="py-2.5 px-3">{doc.label || "—"}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{formatDateDisplay(doc.upload_date || doc.created_at)}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: `${t[st.color]}15`, color: t[st.color] }}>
                          <StIcon size={10} /> {st.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3" style={{ color: t.muted }}>{doc.notes || "—"}</td>
                      <td className="py-2.5 px-3">
                        {(doc.file_url || doc.gdrive_url) ? (
                          <a href={doc.gdrive_url || doc.file_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg"
                            style={{ background: `${t.cyan}12`, color: t.cyan }}>
                            <Eye size={10} /> দেখুন
                          </a>
                        ) : (
                          <span style={{ color: t.muted }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[10px] text-right pt-2 px-3" style={{ color: t.muted }}>
              মোট {documents.length}টি ডকুমেন্ট
            </p>
          </div>
        ) : (
          <p className="text-xs text-center py-4" style={{ color: t.muted }}>কোনো ডকুমেন্ট জমা হয়নি</p>
        )}
      </Card>

      {/* ── যোগাযোগ ── */}
      <div className="p-4 rounded-xl text-center" style={{ background: `${t.cyan}06`, border: `1px solid ${t.cyan}15` }}>
        <p className="text-xs" style={{ color: t.cyan }}>সমস্যা হলে আপনার এজেন্সিতে যোগাযোগ করুন</p>
      </div>
    </div>
  );
}
