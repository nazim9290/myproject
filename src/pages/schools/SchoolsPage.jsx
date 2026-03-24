import { useState, useEffect } from "react";
import { Globe, Users, Plane, AlertTriangle, MapPin, AlertCircle, Plus, Save, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { SCHOOLS_DATA, SUBMISSIONS_DATA, SUB_STATUS } from "../../data/mockData";
import SchoolDetailView from "./SchoolDetailView";
import { api } from "../../hooks/useAPI";

const BLANK_SCHOOL = { name_en: "", name_jp: "", country: "Japan", city: "", phone: "", fax: "", fees: "", requirements: "", deadline: "" };

export default function SchoolsPage({ students }) {
  const t = useTheme();
  const toast = useToast();
  const [schools, setSchools] = useState(SCHOOLS_DATA);

  useEffect(() => {
    api.get("/schools").then(data => { if (Array.isArray(data) && data.length > 0) setSchools(data); }).catch(() => {});
  }, []);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [activeTab, setActiveTab] = useState("schools");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK_SCHOOL);

  if (selectedSchool) {
    const live = schools.find(s => s.id === selectedSchool.id) || selectedSchool;
    return <SchoolDetailView school={live} students={students} onBack={() => setSelectedSchool(null)} />;
  }

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  const openAdd = () => { setForm(BLANK_SCHOOL); setEditingId(null); setShowForm(true); };
  const openEdit = (school) => { setForm({ name_en: school.name, name_jp: school.nameJP || "", country: school.country || "Japan", city: school.city || "", phone: school.phone || "", fax: school.fax || "", fees: school.fees || "", requirements: school.requirements || "", deadline: school.deadline || "" }); setEditingId(school.id); setShowForm(true); };

  const saveSchool = () => {
    if (!form.name_en.trim()) { toast.error("স্কুলের নাম দিন"); return; }
    if (editingId) {
      setSchools(prev => prev.map(s => s.id === editingId ? { ...s, name: form.name_en, nameJP: form.name_jp, city: form.city, phone: form.phone, fax: form.fax, fees: form.fees, requirements: form.requirements, deadline: form.deadline, country: form.country } : s));
      toast.updated(form.name_en);
    } else {
      const newSchool = { id: `SC-${Date.now()}`, name: form.name_en, nameJP: form.name_jp, country: form.country, city: form.city, phone: form.phone, fax: form.fax, fees: form.fees, requirements: form.requirements, deadline: form.deadline, studentsReferred: 0, studentsArrived: 0, rating: 4.0 };
      setSchools(prev => [...prev, newSchool]);
      toast.success(`${form.name_en} — স্কুল যোগ হয়েছে`);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const totalReferred = schools.reduce((s, sc) => s + (sc.studentsReferred || 0), 0);
  const totalArrived = schools.reduce((s, sc) => s + (sc.studentsArrived || 0), 0);
  const pendingRecheck = SUBMISSIONS_DATA.filter((s) => s.status === "issues_found" || s.status === "minor_issues").length;

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Schools</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>স্কুল ডাটাবেস, সাবমিশন ও রিচেক ট্র্যাকিং</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>স্কুল যোগ করুন</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "মোট স্কুল", value: SCHOOLS_DATA.length, color: t.cyan, icon: Globe },
          { label: "মোট রেফার", value: totalReferred, color: t.purple, icon: Users },
          { label: "পৌঁছেছে", value: totalArrived, color: t.emerald, icon: Plane },
          { label: "Recheck বাকি", value: pendingRecheck, color: t.rose, icon: AlertTriangle },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 50}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {[
          { key: "schools", label: "🏫 Schools" },
          { key: "submissions", label: "📤 Submissions" },
          { key: "rechecks", label: "🔄 Recheck Log" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
            style={{ background: activeTab === tab.key ? (t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#ffffff") : "transparent", color: activeTab === tab.key ? t.text : t.muted, boxShadow: activeTab === tab.key && t.mode === "light" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "schools" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showForm && (
            <Card delay={0} className="md:col-span-2 xl:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">{editingId ? "স্কুল এডিট করুন" : "নতুন স্কুল যোগ করুন"}</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="xs" icon={X} onClick={() => setShowForm(false)}>বাতিল</Button>
                  <Button icon={Save} size="xs" onClick={saveSchool}>সংরক্ষণ</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: "নাম (English) *", key: "name_en" },
                  { label: "নাম (Japanese)", key: "name_jp" },
                  { label: "শহর", key: "city" },
                  { label: "ফোন", key: "phone" },
                  { label: "ফ্যাক্স", key: "fax" },
                  { label: "ভর্তি ডেডলাইন", key: "deadline", type: "date" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label}</label>
                    <input type={f.type || "text"} value={form[f.key] || ""} onChange={e => sf(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>দেশ</label>
                  <select value={form.country} onChange={e => sf("country", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option>Japan</option><option>Germany</option><option>Korea</option><option>Canada</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ভর্তির শর্তাবলী</label>
                  <textarea value={form.requirements || ""} onChange={e => sf("requirements", e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={is} placeholder="JLPT N4, শিক্ষাগত যোগ্যতা..." />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ফি (JPY)</label>
                  <input value={form.fees || ""} onChange={e => sf("fees", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="600000" />
                </div>
              </div>
            </Card>
          )}
          {schools.map((school, i) => {
            const countryColor = school.country === "Japan" ? t.rose : school.country === "Germany" ? t.amber : t.cyan;
            const name = school.name_en || school.name;
            return (
              <Card key={school.id} delay={200 + i * 60} className="group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 !p-0 overflow-hidden">
                <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${countryColor}, ${t.purple})` }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedSchool(school)}>
                      <p className="text-sm font-bold group-hover:text-cyan-400 transition">{name}</p>
                      {school.name_jp && <p className="text-[11px] mt-0.5" style={{ color: t.muted }}>{school.name_jp}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge color={countryColor} size="xs">{school.country}</Badge>
                      <button onClick={() => openEdit(school)} className="ml-1 p-1 rounded opacity-0 group-hover:opacity-100 transition" style={{ color: t.muted }}>✏️</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] mb-3" style={{ color: t.textSecondary }}>
                    <MapPin size={11} /> {school.city || "—"}
                  </div>
                  {(school.deadline || school.fees) && (
                    <div className="flex gap-3 mb-2 text-[10px]" style={{ color: t.muted }}>
                      {school.deadline && <span>📅 {school.deadline}</span>}
                      {school.fees && <span>💴 ¥{Number(school.fees).toLocaleString()}</span>}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3 pt-3 cursor-pointer" onClick={() => setSelectedSchool(school)} style={{ borderTop: `1px solid ${t.border}` }}>
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: t.cyan }}>{school.studentsReferred || 0}</p>
                      <p className="text-[9px]" style={{ color: t.muted }}>রেফার</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: t.emerald }}>{school.studentsArrived || 0}</p>
                      <p className="text-[9px]" style={{ color: t.muted }}>পৌঁছেছে</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: t.amber }}>{school.shoukaiPerStudent > 0 ? `¥${(school.shoukaiPerStudent / 1000).toFixed(0)}K` : "—"}</p>
                      <p className="text-[9px]" style={{ color: t.muted }}>শোকাই/জন</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === "submissions" && (
        <Card delay={100}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["স্টুডেন্ট", "স্কুল", "তারিখ", "#", "স্ট্যাটাস", "সমস্যা"].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUBMISSIONS_DATA.sort((a, b) => b.submissionDate.localeCompare(a.submissionDate)).map((sub) => {
                  const st = SUB_STATUS[sub.status];
                  return (
                    <tr key={sub.id} style={{ borderBottom: `1px solid ${t.border}` }}
                      onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td className="py-3 px-3"><p className="font-medium">{sub.studentName}</p><p className="text-[9px]" style={{ color: t.muted }}>{sub.studentId}</p></td>
                      <td className="py-3 px-3" style={{ color: t.textSecondary }}>{sub.schoolName}</td>
                      <td className="py-3 px-3 font-mono text-[11px]" style={{ color: t.textSecondary }}>{sub.submissionDate}</td>
                      <td className="py-3 px-3"><span className="font-mono font-semibold" style={{ color: t.cyan }}>#{sub.submissionNo}</span></td>
                      <td className="py-3 px-3"><Badge color={st.color} size="xs">{st.icon} {st.label}</Badge></td>
                      <td className="py-3 px-3">{sub.feedback.length > 0 ? <Badge color={t.rose} size="xs">{sub.feedback.length} issues</Badge> : <span style={{ color: t.muted }}>—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "rechecks" && (
        <div className="space-y-3">
          {SUBMISSIONS_DATA.filter((s) => s.feedback.length > 0).map((sub, i) => {
            const st = SUB_STATUS[sub.status];
            return (
              <Card key={sub.id} delay={i * 60}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{sub.studentName}</p>
                      <Badge color={st.color} size="xs">{st.icon} {st.label}</Badge>
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{sub.schoolName} • Submission #{sub.submissionNo} • {sub.submissionDate}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {sub.feedback.map((fb, j) => (
                    <div key={j} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: `${t.rose}06`, border: `1px solid ${t.rose}15` }}>
                      <AlertCircle size={14} style={{ color: t.rose }} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: t.rose }}>{fb.doc}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: t.textSecondary }}>{fb.issue}</p>
                        <p className="text-[9px] mt-1" style={{ color: t.muted }}>তারিখ: {fb.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
          {SUBMISSIONS_DATA.filter((s) => s.feedback.length > 0).length === 0 && (
            <Card delay={0}><EmptyState icon={AlertCircle} title="কোনো recheck বাকি নেই" subtitle="সব ডকুমেন্ট গ্রহণযোগ্য" /></Card>
          )}
        </div>
      )}
    </div>
  );
}
