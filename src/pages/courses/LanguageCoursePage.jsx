import { useState, useEffect } from "react";
import { Plus, Layers, Users, CheckCircle, Star, BookOpen, Calendar, User, ChevronRight, Save, X, Clock, Edit3, Trash2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import DateInput, { formatDateDisplay } from "../../components/ui/DateInput";
import { batches as batchesApi } from "../../lib/api";
import { api } from "../../hooks/useAPI";
import BatchDetailView from "./BatchDetailView";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";

// ═══════════════════════════════════════════════════════
// সপ্তাহের দিনগুলোর label — checkbox-এ ব্যবহার হয়
// ═══════════════════════════════════════════════════════
const WEEKDAYS = [
  { key: "Sun", labelKey: "courses.daySun" }, { key: "Mon", labelKey: "courses.dayMon" }, { key: "Tue", labelKey: "courses.dayTue" },
  { key: "Wed", labelKey: "courses.dayWed" }, { key: "Thu", labelKey: "courses.dayThu" }, { key: "Fri", labelKey: "courses.dayFri" }, { key: "Sat", labelKey: "courses.daySat" },
];

// ═══════════════════════════════════════════════════════
// Frontend-এ auto-calculate — ক্লাসের দিন/ঘণ্টা থেকে preview
// start_date, end_date, class_days, class_hours_per_day → weekly, total classes, total hours
// ═══════════════════════════════════════════════════════
function calcSchedulePreview(startDate, endDate, classDays, hoursPerDay) {
  if (!startDate || !endDate || !classDays.length) return { weeklyHours: 0, totalClasses: 0, totalHours: 0 };
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return { weeklyHours: 0, totalClasses: 0, totalHours: 0 };
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const classDayNums = classDays.map(d => dayMap[d]).filter(n => n !== undefined);
  let totalDays = 0;
  const cur = new Date(start);
  while (cur <= end) { if (classDayNums.includes(cur.getDay())) totalDays++; cur.setDate(cur.getDate() + 1); }
  const h = parseFloat(hoursPerDay) || 2;
  return { weeklyHours: classDays.length * h, totalClasses: totalDays, totalHours: totalDays * h };
}

// ── Time slot options — ক্লাসের সময় dropdown-এর জন্য ──
const TIME_SLOTS = [
  "08:00 - 10:00", "09:00 - 11:00", "10:00 - 12:00", "11:00 - 13:00",
  "13:00 - 15:00", "14:00 - 16:00", "15:00 - 17:00", "16:00 - 18:00",
  "18:00 - 20:00", "19:00 - 21:00",
];

function NewBatchForm({ onSave, onCancel, initialData }) {
  const t = useTheme();
  const { t: tr } = useLanguage();
  const isEdit = !!initialData;
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  // ── Users (শিক্ষক) ও Branches API থেকে load ──
  const [staffList, setStaffList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  useEffect(() => {
    api.get("/users").then(d => { if (Array.isArray(d)) setStaffList(d); }).catch(() => {});
    api.get("/branches").then(d => { if (Array.isArray(d)) setBranchesList(d); }).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    name: initialData?.name || "", country: initialData?.country || "Japan", level: initialData?.level || "N5", branch: initialData?.branch || "",
    startDate: initialData?.start_date || initialData?.startDate || "", endDate: initialData?.end_date || initialData?.endDate || "",
    capacity: String(initialData?.capacity || "20"),
    schedule: initialData?.schedule || "", teacher: initialData?.teacher || "",
    class_days: initialData?.class_days || [],
    class_hours_per_day: initialData?.class_hours_per_day || 2,
    class_time: initialData?.class_time || "",
    status: initialData?.status || "active",
  });
  const [err, setErr] = useState({});
  const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); if (err[k]) setErr(prev => ({ ...prev, [k]: null })); };

  // ── Auto-calculated preview — class_days/hours/dates পরিবর্তনে আপডেট হয় ──
  const preview = calcSchedulePreview(form.startDate, form.endDate, form.class_days, form.class_hours_per_day);

  const save = () => {
    const e = {};
    if (!form.name.trim()) e.name = tr("courses.errBatchName");
    if (!form.startDate) e.startDate = tr("courses.errStartDate");
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({
      ...form,
      id: `B-${Date.now()}`,
      capacity: parseInt(form.capacity) || 20,
    });
  };

  // ── ক্লাসের দিন toggle helper ──
  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      class_days: prev.class_days.includes(day)
        ? prev.class_days.filter(d => d !== day)
        : [...prev.class_days, day],
    }));
  };

  return (
    <Card delay={0}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold">{isEdit ? `${tr("common.edit")} — ${initialData.name}` : tr("courses.createNewBatch")}</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="xs" icon={X} onClick={onCancel}>{tr("common.cancel")}</Button>
          <Button icon={Save} size="xs" onClick={save}>{isEdit ? tr("common.save") : tr("courses.saveBatch")}</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("courses.batchName")} <span className="req-star">*</span></label>
          <input value={form.name} onChange={e => set("name", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ ...is, borderColor: err.name ? t.rose : t.inputBorder }} placeholder="Batch April 2026..." />
          {err.name && <p className="text-[10px] mt-1" style={{ color: t.rose }}>{err.name}</p>}
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("courses.country")}</label>
          <select value={form.country} onChange={e => set("country", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
            <option>Japan</option><option>Germany</option><option>Korea</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("courses.level")}</label>
          <select value={form.level} onChange={e => set("level", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
            <option>N5</option><option>N5→N4</option><option>N4</option><option>N4→N3</option><option>A1</option><option>A1→A2</option><option>A2</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("courses.startDate")} <span className="req-star">*</span></label>
          <DateInput value={form.startDate} onChange={v => set("startDate", v)} size="md" error={!!err.startDate} />
          {err.startDate && <p className="text-[10px] mt-1" style={{ color: t.rose }}>{err.startDate}</p>}
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("courses.endDate")}</label>
          <DateInput value={form.endDate} onChange={v => set("endDate", v)} size="md" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("courses.maxStudents")}</label>
          <input type="number" value={form.capacity} onChange={e => set("capacity", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="20" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("courses.teacher")}</label>
          <select value={form.teacher} onChange={e => set("teacher", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
            <option value="">{tr("courses.selectTeacher")}</option>
            {staffList.map(u => <option key={u.id} value={u.name}>{u.name} ({u.role})</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("courses.branch")}</label>
          <select value={form.branch} onChange={e => set("branch", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
            <option value="">{tr("courses.selectBranch")}</option>
            {branchesList.map(b => <option key={b.id} value={b.name}>{b.name}{b.city ? ` (${b.city})` : ""}</option>)}
          </select>
        </div>

        {/* ── ক্লাস শিডিউল সেকশন ── */}
        <div className="md:col-span-3 mt-2 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} style={{ color: t.cyan }} />
            <p className="text-xs font-semibold">{tr("courses.classSchedule")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* ক্লাসের দিন — multi-select checkboxes */}
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: t.muted }}>{tr("courses.classDays")}</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(({ key, labelKey }) => {
                  const active = form.class_days.includes(key);
                  return (
                    <button key={key} type="button" onClick={() => toggleDay(key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: active ? `${t.cyan}20` : t.inputBg,
                        border: `1px solid ${active ? t.cyan : t.inputBorder}`,
                        color: active ? t.cyan : t.muted,
                      }}>
                      {tr(labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* প্রতিদিন ঘণ্টা */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("courses.hoursPerDay")}</label>
              <input type="number" value={form.class_hours_per_day} step="0.5" min="0.5" max="12"
                onChange={e => set("class_hours_per_day", Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
            </div>
            {/* ক্লাসের সময় */}
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("courses.classTime")}</label>
              <select value={form.class_time} onChange={e => set("class_time", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                <option value="">{tr("courses.selectTime")}</option>
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* ── Auto-calculated preview — সাপ্তাহিক/মোট ঘণ্টা (read-only) ── */}
          {(form.class_days.length > 0 && form.startDate && form.endDate) && (
            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg mt-3" style={{ background: t.inputBg }}>
              <div>
                <p className="text-[10px]" style={{ color: t.muted }}>{tr("courses.weeklyHours")}</p>
                <p className="text-sm font-bold" style={{ color: t.cyan }}>{preview.weeklyHours}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: t.muted }}>{tr("courses.totalClasses")}</p>
                <p className="text-sm font-bold" style={{ color: t.emerald }}>{preview.totalClasses}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: t.muted }}>{tr("courses.totalHours")}</p>
                <p className="text-sm font-bold" style={{ color: t.purple }}>{preview.totalHours}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function LanguageCoursePage({ students }) {
  const t = useTheme();
  const { t: tr } = useLanguage();
  const toast = useToast();
  // ── ব্যাচ তালিকা: API থেকে load ──
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [activeTab, setActiveTab] = useState("students");
  const [showNewBatch, setShowNewBatch] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null); // edit mode — batch object
  const [deleteBatch, setDeleteBatch] = useState(null); // delete confirm — batch object
  const [actionLoading, setActionLoading] = useState(false);
  const [batchFilter, setBatchFilter] = useState({ teacher: "", level: "", branch: "", class_time: "", status: "" });

  // ── ফিল্টার করা ব্যাচ — dropdown অনুযায়ী ──
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
  const filteredBatches = [...batches]
    .filter(b => !batchFilter.teacher || b.teacher === batchFilter.teacher)
    .filter(b => !batchFilter.level || b.level === batchFilter.level)
    .filter(b => !batchFilter.branch || b.branch === batchFilter.branch)
    .filter(b => !batchFilter.class_time || b.class_time === batchFilter.class_time)
    .filter(b => !batchFilter.status || b.status === batchFilter.status)
    .sort((a, b) => (b.created_at || b.start_date || "").localeCompare(a.created_at || a.start_date || ""));

  // ── প্রথম load-এ API থেকে batches আনো ──
  useEffect(() => {
    batchesApi.list().then(data => {
      if (Array.isArray(data)) setBatches(data);
    }).catch((err) => { console.error("[Batches Load]", err); toast.error(tr("courses.batchLoadError")); });
  }, []);

  // ── ব্যাচ আপডেট ──
  const handleUpdateBatch = async (updatedData) => {
    setActionLoading(true);
    const lid = toast.loading(tr("common.saving") || "Saving...");
    try {
      const saved = await batchesApi.update(editingBatch.id, updatedData);
      setBatches(prev => prev.map(b => b.id === editingBatch.id ? { ...b, ...saved } : b));
      setEditingBatch(null);
      setShowNewBatch(false);
      toast.dismiss(lid);
      toast.updated(tr("courses.batchCount"));
    } catch (err) {
      toast.dismiss(lid);
      toast.error(err.message || tr("courses.saveFailed"));
    } finally { setActionLoading(false); }
  };

  // ── ব্যাচ ডিলিট ──
  const handleDeleteBatch = async () => {
    if (!deleteBatch) return;
    setActionLoading(true);
    const lid = toast.loading(`${deleteBatch.name} — deleting...`);
    try {
      await api.del(`/batches/${deleteBatch.id}`);
      setBatches(prev => prev.filter(b => b.id !== deleteBatch.id));
      toast.dismiss(lid);
      toast.deleted(deleteBatch.name);
      setDeleteBatch(null);
    } catch (err) {
      toast.dismiss(lid);
      toast.error(err.message || "Delete failed");
    } finally { setActionLoading(false); }
  };

  if (selectedBatch) {
    const live = batches.find(b => b.id === selectedBatch.id) || selectedBatch;
    return <BatchDetailView batch={live} students={students} onBack={() => setSelectedBatch(null)} activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  // ── KPI: students prop থেকে হিসাব (mock batchStudents সরানো হয়েছে) ──
  const totalStudents = batches.reduce((s, b) => s + (b.enrolledCount || 0), 0) || (students || []).filter(s => s.batch).length;
  const avgAttendance = 0; // attendance API থেকে আসবে পরে
  const passedExam = batches.reduce((s, b) => s + (b.passedCount || 0), 0) || (students || []).filter(s => s.status === "EXAM_PASSED" || s.status === "DOC_COLLECTION").length;

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{tr("courses.title")}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{tr("courses.subtitle")}</p>
        </div>
        <Button icon={Plus} onClick={() => setShowNewBatch(true)}>{tr("courses.newBatch")}</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: tr("courses.totalBatches"), value: batches.length, color: t.cyan, icon: Layers },
          { label: tr("courses.totalStudents"), value: totalStudents, color: t.purple, icon: Users },
          { label: tr("courses.avgAttendance"), value: `${avgAttendance}%`, color: avgAttendance >= 80 ? t.emerald : t.amber, icon: CheckCircle },
          { label: tr("courses.examPassed"), value: passedExam, color: t.emerald, icon: Star },
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
          initialData={editingBatch}
          onCancel={() => { setShowNewBatch(false); setEditingBatch(null); }}
          onSave={async (newBatch) => {
            const payload = {
              name: newBatch.name,
              country: newBatch.country || "Japan",
              level: newBatch.level || "N5",
              start_date: newBatch.startDate || newBatch.start_date,
              end_date: newBatch.endDate || newBatch.end_date,
              capacity: newBatch.capacity || 20,
              schedule: newBatch.schedule || "",
              teacher: newBatch.teacher || "",
              status: newBatch.status || "active",
              class_days: newBatch.class_days || [],
              class_hours_per_day: newBatch.class_hours_per_day || 2,
              class_time: newBatch.class_time || "",
              branch: newBatch.branch || "",
            };
            if (editingBatch) {
              // ── Update mode ──
              handleUpdateBatch(payload);
            } else {
              // ── Create mode ──
              try {
                const saved = await batchesApi.create(payload);
                setBatches(prev => [...prev, saved]);
                setShowNewBatch(false);
                toast.success(`${newBatch.name} — ${tr("courses.batchCreated")}`);
              } catch (err) {
                toast.error(err.message || tr("courses.batchCreateFailed"));
              }
            }
          }}
        />
      )}

      {/* ── ব্যাচ ফিল্টার — শিক্ষক, সময়, লেভেল, ব্রাঞ্চ, স্ট্যাটাস ── */}
      <Card delay={50}>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={batchFilter.teacher} onChange={e => setBatchFilter(p => ({ ...p, teacher: e.target.value }))}
            className="px-2.5 py-1.5 rounded-xl text-xs outline-none" style={is}>
            <option value="">{tr("courses.allTeachers")}</option>
            {[...new Set(batches.map(b => b.teacher).filter(Boolean))].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={batchFilter.level} onChange={e => setBatchFilter(p => ({ ...p, level: e.target.value }))}
            className="px-2.5 py-1.5 rounded-xl text-xs outline-none" style={is}>
            <option value="">{tr("courses.allLevels")}</option>
            {[...new Set(batches.map(b => b.level).filter(Boolean))].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={batchFilter.branch} onChange={e => setBatchFilter(p => ({ ...p, branch: e.target.value }))}
            className="px-2.5 py-1.5 rounded-xl text-xs outline-none" style={is}>
            <option value="">{tr("courses.allBranches")}</option>
            {[...new Set(batches.map(b => b.branch).filter(Boolean))].map(br => <option key={br} value={br}>{br}</option>)}
          </select>
          <select value={batchFilter.class_time} onChange={e => setBatchFilter(p => ({ ...p, class_time: e.target.value }))}
            className="px-2.5 py-1.5 rounded-xl text-xs outline-none" style={is}>
            <option value="">{tr("courses.allTimes")}</option>
            {[...new Set(batches.map(b => b.class_time).filter(Boolean))].map(ct => <option key={ct} value={ct}>{ct}</option>)}
          </select>
          <select value={batchFilter.status} onChange={e => setBatchFilter(p => ({ ...p, status: e.target.value }))}
            className="px-2.5 py-1.5 rounded-xl text-xs outline-none" style={is}>
            <option value="">{tr("courses.allStatuses")}</option>
            <option value="active">{tr("courses.statusActive")}</option>
            <option value="completed">{tr("courses.statusCompleted")}</option>
            <option value="upcoming">{tr("courses.statusUpcoming")}</option>
          </select>
          {Object.values(batchFilter).some(v => v) && (
            <button onClick={() => setBatchFilter({ teacher: "", level: "", branch: "", class_time: "", status: "" })}
              className="text-[10px] px-2 py-1 rounded-lg" style={{ color: t.rose, background: `${t.rose}10` }}>✕ Clear</button>
          )}
          <span className="text-[10px] ml-auto" style={{ color: t.muted }}>
            {filteredBatches.length}/{batches.length} {tr("courses.batchCount")}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredBatches.map((batch, i) => {
          // ── ব্যাচের students: students prop থেকে batch name মিলিয়ে ──
          const bStudents = (students || []).filter(s => s.batch === batch.name || s.batch_id === batch.id);
          const enrollCount = batch.enrolledCount || bStudents.length;
          const bPassed = batch.passedCount || bStudents.filter(s => s.status === "EXAM_PASSED").length;
          const countryColor = batch.country === "Japan" ? t.rose : batch.country === "Germany" ? t.amber : t.cyan;
          // সাপ্তাহিক ঘণ্টা — DB value অথবা class_days × hours_per_day থেকে calculate
          const wHours = batch.weekly_hours || ((batch.class_days || []).length * (parseFloat(batch.class_hours_per_day) || 2)) || 0;
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
                      { icon: Users, text: `${enrollCount}/${batch.capacity || 20} ${tr("courses.learners")}` },
                      { icon: BookOpen, text: batch.level || "—" },
                      { icon: Calendar, text: formatDateDisplay(batch.start_date || batch.startDate) },
                      { icon: User, text: batch.teacher || "—" },
                      // ক্লাস শিডিউল — সময় ও সাপ্তাহিক ঘণ্টা
                      ...(batch.class_time ? [{ icon: Clock, text: batch.class_time }] : []),
                      ...(wHours > 0 ? [{ icon: Clock, text: `${wHours} ${tr("courses.hoursPerWeek")}` }] : []),
                    ].map((item, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-[11px]" style={{ color: t.textSecondary }}>
                        <item.icon size={12} /> {item.text}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                    <div className="flex gap-3">
                      <span className="text-[10px]" style={{ color: t.textSecondary }}>{tr("courses.learners")}: <span className="font-bold" style={{ color: t.cyan }}>{enrollCount}</span></span>
                      <span className="text-[10px]" style={{ color: t.textSecondary }}>{tr("courses.pass")}: <span className="font-bold" style={{ color: bPassed > 0 ? t.emerald : t.muted }}>{bPassed}</span></span>
                      {batch.class_days && batch.class_days.length > 0 && (
                        <span className="text-[10px]" style={{ color: t.textSecondary }}>{tr("courses.classLabel")}: <span className="font-bold">{batch.class_days.join(", ")}</span></span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setEditingBatch(batch); setShowNewBatch(true); }}
                        className="p-1.5 rounded-lg transition opacity-0 group-hover:opacity-100" style={{ color: t.cyan }}
                        onMouseEnter={e => e.currentTarget.style.background = `${t.cyan}15`}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        title={tr("common.edit")}><Edit3 size={13} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteBatch(batch); }}
                        className="p-1.5 rounded-lg transition opacity-0 group-hover:opacity-100" style={{ color: t.rose }}
                        onMouseEnter={e => e.currentTarget.style.background = `${t.rose}15`}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        title={tr("common.delete")}><Trash2 size={13} /></button>
                      <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" style={{ color: t.muted }} />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── ডিলিট কনফার্ম মোডাল ── */}
      <DeleteConfirmModal
        isOpen={!!deleteBatch}
        onClose={() => setDeleteBatch(null)}
        onConfirm={handleDeleteBatch}
        itemName={deleteBatch?.name || ""}
        loading={actionLoading}
      />
    </div>
  );
}
