import { useState, useEffect } from "react";
import { Plus, Calendar, ClipboardList, AlertTriangle, Users, Save, X, Trash2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { EVENT_TYPES } from "../../data/mockData";
import { api } from "../../hooks/useAPI";

export default function CalendarPage({ students = [] }) {
  const t = useTheme();
  const toast = useToast();
  const [events, setEvents] = useState([]);

  // ── Backend থেকে calendar events load ──
  useEffect(() => {
    api.get("/calendar").then(data => {
      if (Array.isArray(data)) setEvents(data.map(e => ({ ...e, time: e.time || "", staff: "" })));
    }).catch((err) => { console.error("[Calendar Load]", err); toast.error("ক্যালেন্ডার ডাটা লোড করতে সমস্যা হয়েছে"); });
  }, []);
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const emptyForm = { title: "", type: "interview", date: new Date().toISOString().slice(0, 10), time: "10:00", staff: "", studentId: "", notes: "" };
  const [form, setForm] = useState(emptyForm);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });

  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...events].sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.time || "").localeCompare(b.time || ""));
  const filtered = filterType === "all" ? sorted : sorted.filter((e) => e.type === filterType);
  const grouped = filtered.reduce((acc, ev) => { const d = ev.date ? String(ev.date).slice(0, 10) : ""; if (d) { (acc[d] = acc[d] || []).push(ev); } return acc; }, {});
  const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);
  const thisWeek = Object.keys(grouped).filter((d) => d >= today && d <= weekEndStr).length;
  const deadlines = events.filter((e) => e.type === "deadline").length;

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">ক্যালেন্ডার</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>অ্যাপয়েন্টমেন্ট, ইন্টারভিউ ও শিডিউল</p>
        </div>
        <Button icon={Plus} onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}>নতুন ইভেন্ট</Button>
      </div>

      {/* ── ইভেন্ট ফর্ম Modal ── */}
      <Modal isOpen={!!showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? "ইভেন্ট সম্পাদনা" : "নতুন ইভেন্ট"} size="md">
        {(() => {
          const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>টাইটেল <span className="req-star">*</span></label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Event টাইটেল..." />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ধরন</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    {Object.entries(EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>স্টুডেন্ট</label>
                  <select value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option value="">— কেউ নেই —</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.name_en}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>স্টাফ</label>
                  <select value={form.staff} onChange={e => setForm(p => ({ ...p, staff: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option value="">—</option><option>Mina</option><option>Sadia</option><option>Karim</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>তারিখ <span className="req-star">*</span></label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>সময়</label>
                  <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নোট</label>
                  <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="ঐচ্ছিক বিবরণ..." />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="ghost" size="xs" icon={X} onClick={() => { setShowForm(false); setEditingId(null); }}>বাতিল</Button>
                <Button icon={Save} size="xs" onClick={async () => {
                  if (!form.title.trim() || !form.date) { toast.error("টাইটেল ও তারিখ দিন"); return; }
                  const payload = { title: form.title, date: form.date, time: form.time || null, type: form.type, description: form.notes || "", student_id: form.studentId || null };
                  try {
                    if (editingId) {
                      const updated = await api.patch(`/calendar/${editingId}`, payload);
                      setEvents(prev => prev.map(e => e.id === editingId ? { ...e, ...updated } : e));
                      toast.updated("ইভেন্ট");
                    } else {
                      const linked = students.find((s) => s.id === form.studentId);
                      const saved = await api.post("/calendar", payload);
                      setEvents(prev => [...prev, { ...saved, students: linked ? [linked.name_en] : [] }]);
                      toast.success("ইভেন্ট যোগ হয়েছে!");
                    }
                  } catch (err) { toast.error(err.message || "সমস্যা"); }
                  setForm(emptyForm); setShowForm(false); setEditingId(null);
                }}>সংরক্ষণ</Button>
              </div>
            </>
          );
        })()}
      </Modal>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "এই সপ্তাহে", value: thisWeek + " দিনে ইভেন্ট", color: t.cyan, icon: Calendar },
          { label: "মোট ইভেন্ট", value: events.length, color: t.purple, icon: ClipboardList },
          { label: "ডেডলাইন", value: deadlines, color: t.rose, icon: AlertTriangle },
          { label: "আগামী ইন্টারভিউ", value: events.filter((e) => e.type === "interview").length, color: t.amber, icon: Users },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 50}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setFilterType("all")}
          className="px-3 py-1.5 rounded-lg text-xs transition"
          style={{ background: filterType === "all" ? (t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0") : "transparent", color: filterType === "all" ? t.text : t.muted, fontWeight: filterType === "all" ? 600 : 400 }}>
          সব
        </button>
        {Object.entries(EVENT_TYPES).map(([key, et]) => (
          <button key={key} onClick={() => setFilterType(key)}
            className="px-2.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1"
            style={{ background: filterType === key ? `${et.color}20` : "transparent", color: filterType === key ? et.color : t.muted, fontWeight: filterType === key ? 600 : 400 }}>
            {et.icon} {et.label}
          </button>
        ))}
      </div>

      {/* Mini Calendar Grid */}
      <Card delay={100}>
        {(() => {
          const { year, month } = calMonth;
          const firstDay = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const monthName = new Date(year, month, 1).toLocaleString("bn-BD", { month: "long", year: "numeric" });
          const cells = [];
          for (let i = 0; i < firstDay; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(d);
          const DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
          return (
            <>
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setCalMonth((p) => { const d = new Date(p.year, p.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
                  className="p-1.5 rounded-lg" style={{ color: t.muted }}
                  onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>‹</button>
                <p className="text-xs font-bold">{monthName}</p>
                <button onClick={() => setCalMonth((p) => { const d = new Date(p.year, p.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
                  className="p-1.5 rounded-lg" style={{ color: t.muted }}
                  onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>›</button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((d) => <div key={d} className="text-center text-[9px] font-semibold py-1" style={{ color: t.muted }}>{d}</div>)}
                {cells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const hasEvent = events.some((ev) => ev.date === dateStr);
                  const isToday = dateStr === today;
                  return (
                    <button key={day}
                      onClick={() => { setForm((p) => ({ ...p, date: dateStr })); setShowForm(true); }}
                      className="relative h-8 w-full rounded-lg text-xs font-medium transition flex flex-col items-center justify-center"
                      style={{ background: isToday ? `${t.cyan}25` : "transparent", color: isToday ? t.cyan : t.text, fontWeight: isToday ? 700 : 400 }}
                      onMouseEnter={(e) => { if (!isToday) e.currentTarget.style.background = t.hoverBg; }}
                      onMouseLeave={(e) => { if (!isToday) e.currentTarget.style.background = "transparent"; }}>
                      {day}
                      {hasEvent && <span className="absolute bottom-0.5 h-1 w-1 rounded-full" style={{ background: t.cyan }} />}
                    </button>
                  );
                })}
              </div>
            </>
          );
        })()}
      </Card>

      <div className="space-y-5">
        {Object.entries(grouped).map(([date, events], gi) => {
          const isToday = date === today; // today is dynamic now
          return (
            <div key={date} className="anim-fade" style={{ animationDelay: `${gi * 60}ms` }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: isToday ? `${t.cyan}20` : `${t.muted}15`, color: isToday ? t.cyan : t.muted }}>
                  {date.split("-")[2]}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: isToday ? t.cyan : t.text }}>
                    {isToday ? "আজ" : ""} {date.slice(0, 10)}
                  </p>
                  <p className="text-[10px]" style={{ color: t.muted }}>{events.length} টি ইভেন্ট</p>
                </div>
              </div>
              <div className="ml-11 space-y-2">
                {events.map((ev) => {
                  const et = EVENT_TYPES[ev.type] || { icon: "📅", label: ev.type || "Event", color: t.cyan };
                  return (
                    <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl transition-all" style={{ background: `${et.color}06`, border: `1px solid ${et.color}15` }}>
                      <span className="text-lg">{et.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold">{ev.title}</p>
                          <Badge color={et.color} size="xs">{et.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {ev.time !== "—" && <span className="text-[10px] flex items-center gap-1" style={{ color: t.textSecondary }}>🕐 {ev.time}</span>}
                          {ev.staff && <span className="text-[10px] flex items-center gap-1" style={{ color: t.textSecondary }}>👤 {ev.staff}</span>}
                          {ev.students && ev.students.length > 0 && <span className="text-[10px]" style={{ color: t.cyan }}>{ev.students.join(", ")}</span>}
                          {ev.notes && <span className="text-[10px]" style={{ color: t.muted }}>{ev.notes}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => {
                          setForm({ title: ev.title || "", type: ev.type || "interview", date: String(ev.date || "").slice(0, 10), time: ev.time || "", staff: ev.staff || "", studentId: ev.student_id || "", notes: ev.description || ev.notes || "" });
                          setEditingId(ev.id); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" });
                        }} className="p-1.5 rounded-lg transition" style={{ color: t.muted }}
                          onMouseEnter={e => e.currentTarget.style.color = t.cyan}
                          onMouseLeave={e => e.currentTarget.style.color = t.muted} title="সম্পাদনা">
                          ✏️
                        </button>
                        <button onClick={async () => {
                          try { await api.patch(`/calendar/${ev.id}`, { status: "deleted" }); setEvents(prev => prev.filter(e => e.id !== ev.id)); toast.success("ইভেন্ট মুছে ফেলা হয়েছে"); }
                          catch { toast.error("মুছতে ব্যর্থ"); }
                        }} className="p-1.5 rounded-lg transition" style={{ color: t.muted }}
                          onMouseEnter={e => e.currentTarget.style.color = t.rose}
                          onMouseLeave={e => e.currentTarget.style.color = t.muted} title="মুছুন">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
