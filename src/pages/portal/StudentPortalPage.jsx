import { useState, useEffect } from "react";
import { Save, LogOut, ChevronDown, ChevronRight, Check, Lock, User, FileText, DollarSign, Clock } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { PIPELINE_STATUSES } from "../../data/students";
import { API_URL } from "../../lib/api";

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

  // API_URL top-level import থেকে আসে

  const headers = { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" };

  // ── ডাটা লোড ──
  useEffect(() => {
    const load = async () => {
      const hdrs = { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" };
      try {
        const [profileRes, configRes, feesRes] = await Promise.all([
          fetch(`${API_URL}/student-portal/me`, { headers: hdrs }),
          fetch(`${API_URL}/student-portal/form-config`, { headers: hdrs }),
          fetch(`${API_URL}/student-portal/fees`, { headers: hdrs }),
        ]);
        const p = await profileRes.json();
        const c = await configRes.json();
        const f = await feesRes.json();
        if (profileRes.ok) { setProfile(p); setEditData({ ...p }); }
        if (configRes.ok && Array.isArray(c)) setFormConfig(c);
        if (feesRes.ok) setFees(f);
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
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নতুন পাসওয়ার্ড</label>
              <input type="password" value={pwForm.new} onChange={e => setPwForm(p => ({ ...p, new: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নিশ্চিত করুন</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
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
                  <span className="text-xs">{item.label || item.category}</span>
                  <span className="text-xs font-bold font-mono">৳{(item.amount || 0).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3 mt-3 text-xs" style={{ borderTop: `1px solid ${t.border}` }}>
              <div>
                <span style={{ color: t.muted }}>মোট: </span>
                <span className="font-bold">৳{fees.totalDue.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span style={{ color: t.muted }}>পরিশোধিত: </span>
                <span className="font-bold" style={{ color: t.emerald }}>৳{fees.totalPaid.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span style={{ color: t.muted }}>বাকি: </span>
                <span className="font-bold" style={{ color: fees.balance > 0 ? t.rose : t.emerald }}>৳{fees.balance.toLocaleString("en-IN")}</span>
              </div>
            </div>
            {/* ── পেমেন্ট ইতিহাস ── */}
            {fees.payments && fees.payments.length > 0 && (
              <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                <p className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: t.muted }}>পেমেন্ট ইতিহাস</p>
                <div className="space-y-1.5">
                  {fees.payments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg text-[11px]" style={{ background: `${t.emerald}06` }}>
                      <div className="flex items-center gap-2">
                        <span style={{ color: t.emerald }}>✓</span>
                        <span>{p.date || p.created_at?.slice(0, 10) || "—"}</span>
                        <span style={{ color: t.muted }}>{p.method || p.payment_method || ""}</span>
                      </div>
                      <span className="font-bold font-mono" style={{ color: t.emerald }}>৳{(p.amount || p.paid_amount || 0).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-center py-4" style={{ color: t.muted }}>কোনো ফি রেকর্ড নেই</p>
        )}
      </Card>

      {/* ── যোগাযোগ ── */}
      <div className="p-4 rounded-xl text-center" style={{ background: `${t.cyan}06`, border: `1px solid ${t.cyan}15` }}>
        <p className="text-xs" style={{ color: t.cyan }}>📞 সমস্যা হলে আপনার এজেন্সিতে যোগাযোগ করুন</p>
      </div>
    </div>
  );
}
