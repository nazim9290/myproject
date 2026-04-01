import { useState, useEffect, useCallback, useRef } from "react";
import { Globe, Users, Plane, AlertTriangle, MapPin, AlertCircle, Plus, Save, X, Search } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import SortHeader from "../../components/ui/SortHeader";
import useSortable from "../../hooks/useSortable";
import { SUB_STATUS } from "../../data/mockData";
import SchoolDetailView from "./SchoolDetailView";
import { api } from "../../hooks/useAPI";

const BLANK_SCHOOL = {
  name_en: "", name_jp: "", country: "Japan", city: "",
  contact_person: "", contact_email: "", contact_phone: "",
  shoukai_fee: "", tuition_y1: "", tuition_y2: "", admission_fee: "",
  min_jp_level: "", interview_type: "", has_dormitory: false,
  intakes: [], // [{month: "April", deadline: "2026-01-15"}, ...]
  gdrive_url: "", website: "", notes: "",
};

export default function SchoolsPage({ students }) {
  const t = useTheme();
  const toast = useToast();
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [activeTab, setActiveTab] = useState("schools");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK_SCHOOL);
  const [submissionsData, setSubmissionsData] = useState([]);
  const [deleteSchoolId, setDeleteSchoolId] = useState(null);

  // ── সার্চ ও ফিল্টার state ──
  const [schoolSearch, setSchoolSearch] = useState("");
  const [subSearch, setSubSearch] = useState("");
  const [recheckSearch, setRecheckSearch] = useState("");

  // ── স্কুল পেজিনেশন state ──
  const [schoolPage, setSchoolPage] = useState(1);
  const [schoolPageSize, setSchoolPageSize] = useState(20);
  const [schoolTotal, setSchoolTotal] = useState(0);
  const [schoolLoading, setSchoolLoading] = useState(false);

  // ── সাবমিশন টেবিল সর্টিং ও পেজিনেশন ──
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("submission_date", "desc");
  const [subPage, setSubPage] = useState(1);
  const [subPageSize, setSubPageSize] = useState(20);

  // ── Search debounce — স্কুল সার্চে debounce ──
  const schoolSearchTimerRef = useRef(null);
  const [debouncedSchoolSearch, setDebouncedSchoolSearch] = useState("");
  useEffect(() => {
    if (schoolSearchTimerRef.current) clearTimeout(schoolSearchTimerRef.current);
    schoolSearchTimerRef.current = setTimeout(() => setDebouncedSchoolSearch(schoolSearch), 400);
    return () => { if (schoolSearchTimerRef.current) clearTimeout(schoolSearchTimerRef.current); };
  }, [schoolSearch]);

  // ── Server-side pagination — API থেকে page-by-page স্কুল fetch ──
  const fetchSchools = useCallback(async () => {
    setSchoolLoading(true);
    try {
      const params = { page: schoolPage, limit: schoolPageSize };
      if (debouncedSchoolSearch) params.search = debouncedSchoolSearch;
      const qs = new URLSearchParams(params).toString();
      const res = await api.get(`/schools?${qs}`);
      // Backend এখন { data, total, page, limit } ফর্ম্যাটে দেয়
      const data = Array.isArray(res) ? res : res.data || [];
      const total = res.total ?? data.length;
      setSchools(data);
      setSchoolTotal(total);
    } catch (err) {
      console.error("[Schools Load]", err);
      toast.error("স্কুল ডাটা লোড করতে সমস্যা হয়েছে");
    }
    setSchoolLoading(false);
  }, [schoolPage, schoolPageSize, debouncedSchoolSearch]);

  // ── ফিল্টার/পেজ বদলালে re-fetch হবে ──
  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  // ── সাবমিশন ডাটা load (একবার) ──
  useEffect(() => {
    api.get("/submissions").then(data => { if (Array.isArray(data)) setSubmissionsData(data); }).catch((err) => { console.error("[Submissions Load]", err); });
  }, []);

  if (selectedSchool) {
    const live = schools.find(s => s.id === selectedSchool.id) || selectedSchool;
    return <SchoolDetailView school={live} students={students} onBack={() => setSelectedSchool(null)} />;
  }

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  const openAdd = () => { setForm(BLANK_SCHOOL); setEditingId(null); setShowForm(true); };
  const openEdit = (school) => {
    setForm({
      name_en: school.name_en || "", name_jp: school.name_jp || "", country: school.country || "Japan", city: school.city || "",
      contact_person: school.contact_person || "", contact_email: school.contact_email || "", contact_phone: school.contact_phone || "",
      shoukai_fee: school.shoukai_fee || "", tuition_y1: school.tuition_y1 || "", tuition_y2: school.tuition_y2 || "", admission_fee: school.admission_fee || "",
      min_jp_level: school.min_jp_level || "", interview_type: school.interview_type || "", has_dormitory: school.has_dormitory || false,
      intakes: school.intakes || (school.deadline_april || school.deadline_october ? [
        ...(school.deadline_april ? [{ month: "April", deadline: school.deadline_april }] : []),
        ...(school.deadline_october ? [{ month: "October", deadline: school.deadline_october }] : []),
      ] : []),
      gdrive_url: school.gdrive_url || "", website: school.website || "", notes: school.notes || "",
    });
    setEditingId(school.id); setShowForm(true);
  };

  const saveSchool = async () => {
    if (!form.name_en.trim()) { toast.error("স্কুলের নাম দিন"); return; }
    const payload = { ...form };
    // Empty string → null for numeric fields (DB rejects "")
    ["shoukai_fee", "tuition_y1", "tuition_y2", "admission_fee"].forEach(k => {
      payload[k] = payload[k] ? Number(payload[k]) : null;
    });
    // Empty string → null for optional text fields
    ["contact_person", "contact_email", "contact_phone", "website", "gdrive_url", "notes", "min_jp_level", "interview_type"].forEach(k => {
      if (payload[k] === "") payload[k] = null;
    });
    try {
      if (editingId) {
        await api.patch(`/schools/${editingId}`, payload);
        toast.updated(form.name_en);
      } else {
        await api.post("/schools", payload);
        toast.success(`${form.name_en} — স্কুল যোগ হয়েছে`);
      }
      setShowForm(false);
      setEditingId(null);
      fetchSchools(); // সার্ভার থেকে re-fetch
    } catch (err) {
      toast.error(err.message || "স্কুল save ব্যর্থ");
    }
  };

  const totalReferred = schools.reduce((s, sc) => s + (sc.studentsReferred || 0), 0);
  const totalArrived = schools.reduce((s, sc) => s + (sc.studentsArrived || 0), 0);
  const pendingRecheck = 0; // submissions API থেকে আসবে

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">স্কুল</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>স্কুল ডাটাবেস, সাবমিশন ও রিচেক ট্র্যাকিং</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>স্কুল যোগ করুন</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "মোট স্কুল", value: schoolTotal, color: t.cyan, icon: Globe },
          { label: "মোট রেফার", value: totalReferred, color: t.purple, icon: Users },
          { label: "পৌঁছেছে", value: totalArrived, color: t.emerald, icon: Plane },
          { label: "রিচেক বাকি", value: pendingRecheck, color: t.rose, icon: AlertTriangle },
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
          { key: "schools", label: "🏫 স্কুল" },
          { key: "submissions", label: "📤 সাবমিশন" },
          { key: "rechecks", label: "🔄 রিচেক লগ" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
            style={{ background: activeTab === tab.key ? `${t.cyan}15` : "transparent", color: activeTab === tab.key ? t.cyan : t.muted }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "schools" && (
        <div className="space-y-4">
          {/* ── স্কুল সার্চ বার ── */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <Search size={14} style={{ color: t.muted }} />
              <input value={schoolSearch} onChange={e => { setSchoolSearch(e.target.value); setSchoolPage(1); }}
                className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
                placeholder="স্কুলের নাম দিয়ে খুঁজুন..." />
            </div>
          </div>

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
              {/* ── Basic Info ── */}
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.cyan }}>মূল তথ্য</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {[
                  { label: "নাম (English)", key: "name_en", required: true },
                  { label: "নাম (Japanese)", key: "name_jp", placeholder: "東京ギャラクシー日本語学校" },
                  { label: "শহর", key: "city", placeholder: "Tokyo" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label} {f.required && <span className="req-star">*</span>}</label>
                    <input value={form[f.key] || ""} onChange={e => sf(f.key, e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder={f.placeholder || ""} />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>দেশ</label>
                  <select value={form.country} onChange={e => sf("country", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option>Japan</option><option>Germany</option><option>Korea</option><option>Canada</option><option>Australia</option><option>UK</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ওয়েবসাইট</label>
                  <input value={form.website || ""} onChange={e => sf("website", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="https://..." />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>কেইয়াকু / ডকুমেন্ট ফোল্ডার</label>
                  <input value={form.gdrive_url || ""} onChange={e => sf("gdrive_url", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Google Drive link..." />
                </div>
              </div>

              {/* ── Contact ── */}
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.purple }}>যোগাযোগ</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>যোগাযোগ ব্যক্তি</label>
                  <input value={form.contact_person || ""} onChange={e => sf("contact_person", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Tanaka San" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ইমেইল</label>
                  <input type="email" value={form.contact_email || ""} onChange={e => sf("contact_email", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="info@school.jp" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ফোন</label>
                  <input value={form.contact_phone || ""} onChange={e => sf("contact_phone", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="+81-3-XXXX-XXXX" />
                </div>
              </div>

              {/* ── Fees & Requirements ── */}
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.emerald }}>ফি ও শর্তাবলী</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>শোকাই ফি (¥)</label>
                  <input type="number" value={form.shoukai_fee || ""} onChange={e => sf("shoukai_fee", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="50000" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>টিউশন ১ম বছর (¥)</label>
                  <input type="number" value={form.tuition_y1 || ""} onChange={e => sf("tuition_y1", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="700000" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>টিউশন ২য় বছর (¥)</label>
                  <input type="number" value={form.tuition_y2 || ""} onChange={e => sf("tuition_y2", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="650000" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ভর্তি ফি (¥)</label>
                  <input type="number" value={form.admission_fee || ""} onChange={e => sf("admission_fee", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="50000" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ন্যূনতম JP লেভেল</label>
                  <select value={form.min_jp_level || ""} onChange={e => sf("min_jp_level", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option value="">—</option><option>N5</option><option>N4</option><option>N3</option><option>N2</option><option>NAT 5</option><option>NAT 4</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ইন্টারভিউ ধরন</label>
                  <select value={form.interview_type || ""} onChange={e => sf("interview_type", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option value="">—</option><option>Online</option><option>In-person</option><option>Written + Online</option><option>None</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <label className="text-xs" style={{ color: t.muted }}>ডরমিটরি আছে?</label>
                  <button onClick={() => sf("has_dormitory", !form.has_dormitory)}
                    className="w-10 h-5 rounded-full transition-all relative"
                    style={{ background: form.has_dormitory ? t.emerald : t.inputBorder }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: form.has_dormitory ? 22 : 2 }} />
                  </button>
                </div>
              </div>

              {/* ── Intakes (Dynamic) ── */}
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.amber }}>ইন্টেক ও ডেডলাইন</p>
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {["January", "April", "July", "October"].map(month => {
                    const intakes = form.intakes || [];
                    const exists = intakes.find(i => i.month === month);
                    return (
                      <button key={month} onClick={() => {
                        if (exists) {
                          sf("intakes", intakes.filter(i => i.month !== month));
                        } else {
                          sf("intakes", [...intakes, { month, deadline: "" }]);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      style={{
                        background: exists ? `${t.amber}15` : t.inputBg,
                        border: `1px solid ${exists ? t.amber : t.inputBorder}`,
                        color: exists ? t.amber : t.muted,
                      }}>
                        {exists ? "✓ " : ""}{month}
                      </button>
                    );
                  })}
                </div>
                {(form.intakes || []).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(form.intakes || []).map((intake, idx) => (
                      <div key={intake.month} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: t.inputBg }}>
                        <span className="text-xs font-medium w-20" style={{ color: t.amber }}>{intake.month}</span>
                        <input type="date" value={intake.deadline || ""} onChange={e => {
                          const updated = [...(form.intakes || [])];
                          updated[idx] = { ...updated[idx], deadline: e.target.value };
                          sf("intakes", updated);
                        }} className="flex-1 px-2 py-1 rounded text-xs outline-none" style={is} />
                        <span className="text-[9px]" style={{ color: t.muted }}>ডেডলাইন</span>
                      </div>
                    ))}
                  </div>
                )}
                {(form.intakes || []).length === 0 && <p className="text-[10px]" style={{ color: t.muted }}>ইন্টেক সিলেক্ট করুন — January, April, July, October</p>}
              </div>

              {/* ── Notes ── */}
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নোট / মন্তব্য</label>
                <textarea value={form.notes || ""} onChange={e => sf("notes", e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={is} placeholder="বিশেষ তথ্য, শর্ত, চুক্তি ইত্যাদি..." />
              </div>
            </Card>
          )}
          {/* সার্ভার থেকে ইতিমধ্যে সার্চ ও পেজিনেট করা data এসেছে */}
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
                      <button onClick={() => openEdit(school)} className="ml-1 p-1 rounded opacity-0 group-hover:opacity-100 transition" style={{ color: t.muted }} title="Edit">✏️</button>
                      {deleteSchoolId === school.id ? (
                        <div className="flex gap-1 ml-1">
                          <button onClick={async () => {
                            try { await api.del(`/schools/${school.id}`); toast.success("স্কুল মুছে ফেলা হয়েছে"); fetchSchools(); } catch (err) { toast.error(err.message); }
                            setDeleteSchoolId(null);
                          }} className="text-[9px] px-2 py-0.5 rounded" style={{ background: t.rose, color: "#fff" }}>মুছুন</button>
                          <button onClick={() => setDeleteSchoolId(null)} className="text-[9px] px-1" style={{ color: t.muted }}>না</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteSchoolId(school.id)} className="p-1 rounded opacity-0 group-hover:opacity-100 transition" style={{ color: t.muted }} title="Delete">🗑️</button>
                      )}
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
                  <div className="flex justify-end mb-2">
                    <button onClick={() => setSelectedSchool(school)} className="px-3 py-1 rounded-lg text-[10px] font-medium" style={{ background: `${t.purple}15`, color: t.purple }}>👁 বিস্তারিত দেখুন</button>
                  </div>
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
          {/* ── স্কুল পেজিনেশন ── */}
          {schools.length === 0 && !schoolLoading && (
            <EmptyState icon={Globe} title="কোনো স্কুল পাওয়া যায়নি" subtitle="সার্চ পরিবর্তন করে আবার চেষ্টা করুন" />
          )}
          <Pagination total={schoolTotal} page={schoolPage} pageSize={schoolPageSize}
            onPage={setSchoolPage} onPageSize={setSchoolPageSize} />
        </div>
      )}

      {activeTab === "submissions" && (() => {
        // ── সাবমিশন ফিল্টার, সর্ট ও পেজিনেশন ──
        const subFiltered = submissionsData.filter(sub => {
          const studentName = (sub.student_name || sub.students?.name_en || "").toLowerCase();
          const schoolName = (sub.school_name || sub.schools?.name_en || "").toLowerCase();
          const q = subSearch.toLowerCase();
          return !q || studentName.includes(q) || schoolName.includes(q);
        });
        const subSorted = sortFn(subFiltered);
        const subSafePage = Math.min(subPage, Math.max(1, Math.ceil(subSorted.length / subPageSize)));
        const subPaginated = subSorted.slice((subSafePage - 1) * subPageSize, subSafePage * subPageSize);

        return (
          <div className="space-y-4">
            {/* ── সাবমিশন সার্চ বার ── */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                <Search size={14} style={{ color: t.muted }} />
                <input value={subSearch} onChange={e => { setSubSearch(e.target.value); setSubPage(1); }}
                  className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
                  placeholder="স্টুডেন্ট বা স্কুলের নাম দিয়ে খুঁজুন..." />
              </div>
            </div>

            <Card delay={100}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      <SortHeader label="স্টুডেন্ট" sortKey="student_name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      <SortHeader label="স্কুল" sortKey="school_name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      <SortHeader label="তারিখ" sortKey="submission_date" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      <SortHeader label="#" sortKey="submission_no" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      <SortHeader label="স্ট্যাটাস" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>সমস্যা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subPaginated.map((sub) => {
                      const st = SUB_STATUS[sub.status] || { color: "gray", icon: "•", label: sub.status };
                      return (
                        <tr key={sub.id} style={{ borderBottom: `1px solid ${t.border}` }}
                          onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <td className="py-3 px-4"><p className="font-medium">{sub.student_name || sub.students?.name_en || "—"}</p><p className="text-[9px]" style={{ color: t.muted }}>{sub.student_id}</p></td>
                          <td className="py-3 px-4" style={{ color: t.textSecondary }}>{sub.school_name || sub.schools?.name_en || "—"}</td>
                          <td className="py-3 px-4 font-mono text-[11px]" style={{ color: t.textSecondary }}>{sub.submission_date ? sub.submission_date.slice(0, 10) : "—"}</td>
                          <td className="py-3 px-4"><span className="font-mono font-semibold" style={{ color: t.cyan }}>#{sub.submission_no || sub.id?.slice(0,6)}</span></td>
                          <td className="py-3 px-4"><Badge color={st.color} size="xs">{st.icon} {st.label}</Badge></td>
                          <td className="py-3 px-4">{(sub.feedback || []).length > 0 ? <Badge color={t.rose} size="xs">{sub.feedback.length} সমস্যা</Badge> : <span style={{ color: t.muted }}>—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {subSorted.length === 0 && <EmptyState icon={AlertCircle} title="কোনো সাবমিশন পাওয়া যায়নি" subtitle="সার্চ পরিবর্তন করে আবার চেষ্টা করুন" />}
              {subSorted.length > 0 && (
                <Pagination total={subSorted.length} page={subSafePage} pageSize={subPageSize}
                  onPage={setSubPage} onPageSize={setSubPageSize} />
              )}
            </Card>
          </div>
        );
      })()}

      {activeTab === "rechecks" && (() => {
        // ── রিচেক ফিল্টার ──
        const recheckItems = submissionsData.filter((s) => (s.feedback || []).length > 0).filter(sub => {
          const studentName = (sub.student_name || sub.students?.name_en || "").toLowerCase();
          const schoolName = (sub.school_name || sub.schools?.name_en || "").toLowerCase();
          const q = recheckSearch.toLowerCase();
          return !q || studentName.includes(q) || schoolName.includes(q);
        });

        return (
          <div className="space-y-3">
            {/* ── রিচেক সার্চ বার ── */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                <Search size={14} style={{ color: t.muted }} />
                <input value={recheckSearch} onChange={e => setRecheckSearch(e.target.value)}
                  className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
                  placeholder="স্টুডেন্ট বা স্কুলের নাম দিয়ে খুঁজুন..." />
              </div>
            </div>

            {recheckItems.map((sub, i) => {
              const st = SUB_STATUS[sub.status] || { color: "gray", icon: "•", label: sub.status };
              return (
                <Card key={sub.id} delay={i * 60}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{sub.student_name || sub.students?.name_en || "—"}</p>
                        <Badge color={st.color} size="xs">{st.icon} {st.label}</Badge>
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{sub.school_name || sub.schools?.name_en || "—"} • #{sub.submission_no || ""} • {sub.submission_date ? sub.submission_date.slice(0, 10) : ""}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {sub.feedback.map((fb, j) => (
                      <div key={j} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: `${t.rose}06`, border: `1px solid ${t.rose}15` }}>
                        <AlertCircle size={14} style={{ color: t.rose }} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold" style={{ color: t.rose }}>{fb.doc}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: t.textSecondary }}>{fb.issue}</p>
                          <p className="text-[9px] mt-1" style={{ color: t.muted }}>তারিখ: {fb.date ? fb.date.slice(0, 10) : "—"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
            {recheckItems.length === 0 && (
              <Card delay={0}><EmptyState icon={AlertCircle} title="কোনো রিচেক বাকি নেই" subtitle="সব ডকুমেন্ট গ্রহণযোগ্য" /></Card>
            )}
          </div>
        );
      })()}
    </div>
  );
}
