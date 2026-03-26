import { useState } from "react";
import { Building, DollarSign, Eye, Globe, Download, Plus, CheckCircle, Layers, Save, X, Trash2, Type, Palette, Shield, Bell, Database, Settings as SettingsIcon, Users, GitBranch, FileText } from "lucide-react";
import { useTheme, useLabelSettings } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

// ── Administration ট্যাব কনফিগ ──
const ADMIN_TABS = [
  { key: "agency", label: "এজেন্সি তথ্য", icon: Building },
  { key: "appearance", label: "ডিজাইন ও থিম", icon: Palette },
  { key: "pipeline", label: "পাইপলাইন সেটিংস", icon: GitBranch },
  { key: "branches", label: "ব্রাঞ্চ ম্যানেজমেন্ট", icon: Globe },
  { key: "notifications", label: "নোটিফিকেশন", icon: Bell },
  { key: "custom_fields", label: "কাস্টম ফিল্ড", icon: Layers },
  { key: "backup", label: "ডাটা ব্যাকআপ", icon: Database },
];

export default function SettingsPage({ isDark, setIsDark, students, visitors }) {
  const t = useTheme();
  const toast = useToast();
  const { labelSettings, updateLabelSettings } = useLabelSettings();
  const [activeTab, setActiveTab] = useState("agency");
  const [agencyName, setAgencyName] = useState("ABC Education Consultancy");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [agencyEmail, setAgencyEmail] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [tradeLicense, setTradeLicense] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [branch, setBranch] = useState("Dhaka (HQ)");
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

  // ── Branch management ──
  const [branches, setBranches] = useState([
    { id: "b1", name: "ঢাকা (HQ)", manager: "Admin", phone: "", status: "active" },
    { id: "b2", name: "চট্টগ্রাম", manager: "", phone: "", status: "active" },
    { id: "b3", name: "সিলেট", manager: "", phone: "", status: "active" },
  ]);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: "", manager: "", phone: "" });

  // ── Notification settings ──
  const [notifications, setNotifications] = useState({
    followUpReminder: true,
    visaExpiry: true,
    passportExpiry: true,
    paymentDue: true,
    batchStart: true,
    documentPending: false,
  });

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
            <Button icon={Save} size="xs" onClick={() => toast.success("এজেন্সি তথ্য সংরক্ষণ হয়েছে!")}>সংরক্ষণ</Button>
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
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>লোগো</label>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl flex items-center justify-center text-2xl" style={{ background: `linear-gradient(135deg, ${t.cyan}, ${t.purple})` }}>
                  🎓
                </div>
                <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: t.inputBg, color: t.textSecondary }}>Change Logo</button>
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

      {/* ── পাইপলাইন সেটিংস ── */}
      {activeTab === "pipeline" && <div className="space-y-5">
        <Card delay={50}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><GitBranch size={14} /> Student Pipeline Steps</h3>
          <p className="text-[10px] mb-3" style={{ color: t.muted }}>স্টুডেন্ট pipeline-এর ধাপগুলো — drag করে order পরিবর্তন করা যাবে ভবিষ্যতে</p>
          <div className="space-y-1.5">
            {pipelineStatuses.map((s, i) => (
              <div key={s} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: t.inputBg }}>
                <span className="text-[10px] font-mono w-6 text-center" style={{ color: t.muted }}>{i + 1}</span>
                <span className="w-2 h-2 rounded-full" style={{ background: i < 2 ? t.amber : i < 10 ? t.cyan : t.emerald }} />
                <span className="text-xs font-medium flex-1">{s}</span>
                <Badge color={i < 2 ? "amber" : i < 10 ? "cyan" : "emerald"} size="xs">{i < 2 ? "লিড" : i < 10 ? "প্রসেসিং" : "সম্পন্ন"}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>}

      {/* ── ব্রাঞ্চ ম্যানেজমেন্ট ── */}
      {activeTab === "branches" && <div className="space-y-5">
        <Card delay={50}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Globe size={14} /> ব্রাঞ্চ তালিকা</h3>
            <Button icon={Plus} size="xs" onClick={() => setShowBranchForm(true)}>নতুন ব্রাঞ্চ</Button>
          </div>
          {showBranchForm && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ব্রাঞ্চ নাম <span className="req-star">*</span></label>
                  <input value={branchForm.name} onChange={e => setBranchForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="রাজশাহী" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ম্যানেজার</label>
                  <input value={branchForm.manager} onChange={e => setBranchForm(p => ({ ...p, manager: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ফোন</label>
                  <input value={branchForm.phone} onChange={e => setBranchForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="xs" icon={X} onClick={() => setShowBranchForm(false)}>বাতিল</Button>
                <Button size="xs" icon={Save} onClick={() => {
                  if (!branchForm.name.trim()) { toast.error("ব্রাঞ্চ নাম দিন"); return; }
                  setBranches(prev => [...prev, { id: `b-${Date.now()}`, ...branchForm, status: "active" }]);
                  setBranchForm({ name: "", manager: "", phone: "" });
                  setShowBranchForm(false);
                  toast.success("ব্রাঞ্চ যোগ হয়েছে");
                }}>সংরক্ষণ</Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {branches.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: t.inputBg }}>
                <div className="flex items-center gap-3">
                  <Globe size={14} style={{ color: t.cyan }} />
                  <div>
                    <p className="text-xs font-semibold">{b.name}</p>
                    <p className="text-[10px]" style={{ color: t.muted }}>{b.manager || "ম্যানেজার নেই"} {b.phone ? `• ${b.phone}` : ""}</p>
                  </div>
                </div>
                <Badge color={b.status === "active" ? "emerald" : "rose"} size="xs">{b.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>
              </div>
            ))}
          </div>
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
