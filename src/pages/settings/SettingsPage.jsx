import { useState } from "react";
import { Building, DollarSign, Eye, Globe, Download, Plus, CheckCircle, Layers } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

export default function SettingsPage({ isDark, setIsDark, students, visitors }) {
  const t = useTheme();
  const [agencyName, setAgencyName] = useState("ABC Education Consultancy");
  const [branch, setBranch] = useState("Dhaka (HQ)");
  const [taxRate, setTaxRate] = useState("15");
  const [currency, setCurrency] = useState("BDT");

  return (
    <div className="space-y-5 anim-fade">
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-xs mt-0.5" style={{ color: t.muted }}>এজেন্সি সেটিংস ও কনফিগারেশন</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay={50}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Building size={14} /> এজেন্সি তথ্য</h3>
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
                    a.download = `AgencyOS_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`;
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
                  onClick: () => alert("Financial Report downloading... (Backend এ implement হবে)")
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

        <Card delay={300}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Layers size={14} /> Dynamic Fields ও Document Types</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.inputBg }}>
              <div>
                <p className="text-sm font-medium">Custom Fields</p>
                <p className="text-[10px]" style={{ color: t.muted }}>নতুন field যোগ করুন — কোনো code change ছাড়া</p>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1" style={{ background: `${t.cyan}15`, color: t.cyan }}>
                <Plus size={10} /> Add Field
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.inputBg }}>
              <div>
                <p className="text-sm font-medium">Document Types</p>
                <p className="text-[10px]" style={{ color: t.muted }}>নতুন document type যোগ বা সাজানো</p>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1" style={{ background: `${t.purple}15`, color: t.purple }}>
                <Plus size={10} /> Add Doc Type
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.inputBg }}>
              <div>
                <p className="text-sm font-medium">Field Priority</p>
                <p className="text-[10px]" style={{ color: t.muted }}>P1/P2/P3 — কোন field কখন দেখাবে</p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>P1: 55</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: "#FEF9C3", color: "#CA8A04" }}>P2: 195</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: "#DCFCE7", color: "#16A34A" }}>P3: 200</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
