import { useState } from "react";
import { Plus, Layers, Users, CheckCircle, Star, BookOpen, Calendar, User, ChevronRight, Save, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { BATCHES, BATCH_STUDENTS } from "../../data/mockData";
import BatchDetailView from "./BatchDetailView";

function NewBatchForm({ onSave, onCancel }) {
  const t = useTheme();
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
  const [form, setForm] = useState({
    name: "", country: "Japan", level: "N5",
    startDate: "", endDate: "", capacity: "20",
    schedule: "", teacher: "",
  });
  const [err, setErr] = useState({});
  const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); if (err[k]) setErr(prev => ({ ...prev, [k]: null })); };

  const save = () => {
    const e = {};
    if (!form.name.trim()) e.name = "ব্যাচের নাম দিন";
    if (!form.startDate) e.startDate = "শুরুর তারিখ দিন";
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({
      ...form,
      id: `B-${Date.now()}`,
      capacity: parseInt(form.capacity) || 20,
    });
  };

  return (
    <Card delay={0}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold">নতুন ব্যাচ তৈরি করুন</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="xs" icon={X} onClick={onCancel}>বাতিল</Button>
          <Button icon={Save} size="xs" onClick={save}>Save Batch</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ব্যাচের নাম *</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ ...is, borderColor: err.name ? t.rose : t.inputBorder }} placeholder="Batch April 2026..." />
          {err.name && <p className="text-[10px] mt-1" style={{ color: t.rose }}>{err.name}</p>}
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>দেশ</label>
          <select value={form.country} onChange={e => set("country", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
            <option>Japan</option><option>Germany</option><option>Korea</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>লেভেল</label>
          <select value={form.level} onChange={e => set("level", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
            <option>N5</option><option>N5→N4</option><option>N4</option><option>N4→N3</option><option>A1</option><option>A1→A2</option><option>A2</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>শুরুর তারিখ *</label>
          <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ ...is, borderColor: err.startDate ? t.rose : t.inputBorder }} />
          {err.startDate && <p className="text-[10px] mt-1" style={{ color: t.rose }}>{err.startDate}</p>}
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>শেষের তারিখ</label>
          <input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>সর্বোচ্চ স্টুডেন্ট</label>
          <input type="number" value={form.capacity} onChange={e => set("capacity", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="20" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>শিক্ষক</label>
          <input value={form.teacher} onChange={e => set("teacher", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Tanaka Sensei..." />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>সময়সূচী</label>
          <input value={form.schedule} onChange={e => set("schedule", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Sun-Thu, 10AM-1PM" />
        </div>
      </div>
    </Card>
  );
}

export default function LanguageCoursePage({ students }) {
  const t = useTheme();
  const toast = useToast();
  const [batches, setBatches] = useState(BATCHES);
  const [batchStudents] = useState(BATCH_STUDENTS);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [activeTab, setActiveTab] = useState("students");
  const [showNewBatch, setShowNewBatch] = useState(false);

  if (selectedBatch) {
    const live = batches.find(b => b.id === selectedBatch.id) || selectedBatch;
    return <BatchDetailView batch={live} students={students} onBack={() => setSelectedBatch(null)} activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  const allBatchStudents = Object.values(batchStudents).flat();
  const totalStudents = allBatchStudents.length;
  const avgAttendance = Math.round(allBatchStudents.reduce((s, st) => s + st.attendance, 0) / Math.max(totalStudents, 1));
  const passedExam = allBatchStudents.filter((s) => s.jlptStatus === "Passed").length;

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Language Course</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>ব্যাচ, অ্যাটেনডেন্স, পরীক্ষা ও ফলাফল</p>
        </div>
        <Button icon={Plus} onClick={() => setShowNewBatch(true)}>New Batch</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "মোট ব্যাচ", value: batches.length, color: t.cyan, icon: Layers },
          { label: "মোট স্টুডেন্ট", value: totalStudents, color: t.purple, icon: Users },
          { label: "গড় উপস্থিতি", value: `${avgAttendance}%`, color: avgAttendance >= 80 ? t.emerald : t.amber, icon: CheckCircle },
          { label: "পরীক্ষায় পাস", value: passedExam, color: t.emerald, icon: Star },
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

      {showNewBatch && (
        <NewBatchForm
          onCancel={() => setShowNewBatch(false)}
          onSave={(newBatch) => {
            setBatches(prev => [...prev, newBatch]);
            setShowNewBatch(false);
            toast.success(`${newBatch.name} — Batch created!`);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {batches.map((batch, i) => {
          const bStudents = batchStudents[batch.id] || [];
          const bAvgAtt = bStudents.length > 0 ? Math.round(bStudents.reduce((s, st) => s + st.attendance, 0) / bStudents.length) : 0;
          const bPassed = bStudents.filter((s) => s.jlptStatus === "Passed").length;
          const countryColor = batch.country === "Japan" ? t.rose : batch.country === "Germany" ? t.amber : t.cyan;
          return (
            <Card key={batch.id} delay={200 + i * 60} className="cursor-pointer group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 !p-0 overflow-hidden">
              <div onClick={() => { setSelectedBatch(batch); setActiveTab("students"); }}>
                <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${countryColor}, ${t.purple})` }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold group-hover:text-cyan-400 transition">{batch.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{batch.schedule || "—"}</p>
                    </div>
                    <Badge color={countryColor} size="xs">{batch.country}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { icon: Users, text: `${bStudents.length}/${batch.capacity} students` },
                      { icon: BookOpen, text: batch.level },
                      { icon: Calendar, text: batch.startDate || "—" },
                      { icon: User, text: batch.teacher || "—" },
                    ].map((item, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-[11px]" style={{ color: t.textSecondary }}>
                        <item.icon size={12} /> {item.text}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                    <div className="flex gap-3">
                      <span className="text-[10px]" style={{ color: bAvgAtt >= 80 ? t.emerald : t.amber }}>উপস্থিতি: <span className="font-bold">{bAvgAtt}%</span></span>
                      <span className="text-[10px]" style={{ color: t.emerald }}>পাস: <span className="font-bold">{bPassed}</span></span>
                    </div>
                    <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" style={{ color: t.muted }} />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
