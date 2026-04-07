import { useState, useEffect } from "react";
import { Plus, Phone, Save, X, Search, Trash2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import DateInput, { formatDateDisplay } from "../../components/ui/DateInput";
import { COMM_TYPES } from "../../data/mockData";
import { api } from "../../hooks/useAPI";

const BLANK = { studentId: "", type: "phone", direction: "outbound", notes: "", follow_up_date: "", user: "" };

export default function CommunicationPage({ students = [] }) {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
  const [logs, setLogs] = useState([]);

  // ── Backend থেকে communication logs load ──
  useEffect(() => {
    api.get("/communications").then(data => {
      if (Array.isArray(data)) setLogs(data.map(c => ({
        id: c.id, studentId: c.student_id, studentName: c.students?.name_en || "", type: c.type, direction: c.direction,
        notes: c.notes, follow_up_date: c.follow_up_date, date: c.created_at?.slice(0, 10), user: "Staff"
      })));
    }).catch((err) => { console.error("[Communication Load]", err); toast.error("যোগাযোগ লগ লোড করতে সমস্যা হয়েছে"); });
  }, []);
  // ── ব্যবহারকারী তালিকা — API থেকে ──
  const [users, setUsers] = useState([]);
  useEffect(() => {
    api.get("/users").then(data => {
      const arr = Array.isArray(data) ? data : data?.data || [];
      setUsers(arr);
    }).catch(() => {});
  }, []);

  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.studentId && !form.notes.trim()) { toast.error("স্টুডেন্ট ও নোট দিন"); return; }
    if (!form.notes.trim()) { toast.error("নোট লিখুন"); return; }
    const student = students.find(s => s.id === form.studentId);
    const now = new Date();
    const entry = {
      student_id: form.studentId || null,
      type: form.type, direction: form.direction,
      notes: form.notes, content: form.notes,
      follow_up_date: form.follow_up_date || null,
    };
    try {
      const saved = await api.post("/communications", entry);
      setLogs(prev => [{ ...saved, studentName: student?.name_en || "—", summary: saved.notes || saved.content, date: (saved.created_at || "").slice(0, 10) }, ...prev]);
    } catch (err) {
      console.error("[Communication Save]", err);
      toast.error("সার্ভারে সেভ ব্যর্থ, লোকালে রাখা হয়েছে");
      setLogs(prev => [{ id: `LOG-${Date.now()}`, ...entry, studentName: student?.name_en || "—", summary: form.notes, date: now.toISOString().slice(0, 10) }, ...prev]);
    }
    setForm(BLANK);
    setShowForm(false);
    toast.success("যোগাযোগ লগ যোগ হয়েছে!");
  };

  const deleteLog = async (id) => {
    try { await api.del(`/communications/${id}`); } catch (err) { console.error("[Communication Delete]", err); toast.error("সার্ভার থেকে মুছতে সমস্যা হয়েছে"); }
    setLogs(prev => prev.filter(l => l.id !== id));
    setDeleteTarget(null);
    toast.success("মুছে ফেলা হয়েছে");
  };

  const filtered = logs
    .filter(l => filterType === "all" || l.type === filterType)
    .filter(l => !search || (l.studentName || "").toLowerCase().includes(search.toLowerCase()) || (l.summary || "").toLowerCase().includes(search.toLowerCase()));

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5 anim-fade">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">যোগাযোগ লগ</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>Phone, WhatsApp, Email, SMS, Visit — এক জায়গায়</p>
        </div>
        <Button icon={Plus} onClick={() => setShowForm(v => !v)}>নতুন লগ</Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(COMM_TYPES).map(([key, ct], i) => (
          <Card key={key} delay={i * 40}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{ct.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: ct.color }}>{logs.filter(l => l.type === key).length}</p>
              </div>
              <span className="text-xl">{ct.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Add form — Modal */}
      <Modal isOpen={!!showForm} onClose={() => setShowForm(false)} title="নতুন যোগাযোগ লগ" size="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>স্টুডেন্ট</label>
            <select value={form.studentId} onChange={e => sf("studentId", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
              <option value="">— স্টুডেন্ট নির্বাচন করুন —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name_en} ({s.id})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ধরন</label>
            <select value={form.type} onChange={e => sf("type", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
              {Object.entries(COMM_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>দিক</label>
            <select value={form.direction} onChange={e => sf("direction", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
              <option value="outbound">→ আউটবাউন্ড (আমরা করলাম)</option>
              <option value="inbound">← ইনবাউন্ড (তারা করল)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>স্টাফ</label>
            <select value={form.user} onChange={e => sf("user", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
              <option value="">নির্বাচন করুন</option>
              {users.map(u => <option key={u.id} value={u.name || u.email}>{u.name || u.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ফলোআপ তারিখ</label>
            <DateInput value={form.follow_up_date} onChange={v => sf("follow_up_date", v)} size="md" min={today} />
          </div>
          <div className="md:col-span-3">
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নোট <span className="req-star">*</span></label>
            <textarea value={form.notes} onChange={e => sf("notes", e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={is} placeholder="কথোপকথনের সারসংক্ষেপ..." />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" size="xs" icon={X} onClick={() => setShowForm(false)}>{tr("common.cancel")}</Button>
          <Button icon={Save} size="xs" onClick={save}>{tr("common.save")}</Button>
        </div>
      </Modal>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 min-w-[180px]" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
          <Search size={13} style={{ color: t.muted }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="flex-1 bg-transparent text-xs outline-none" style={{ color: t.text }} placeholder={tr("common.search")} />
          {search && <button onClick={() => setSearch("")}><X size={12} style={{ color: t.muted }} /></button>}
        </div>
        <button onClick={() => { setFilterType("all"); setPage(1); }}
          className="px-3 py-1.5 rounded-lg text-xs transition"
          style={{ background: filterType === "all" ? `${t.cyan}20` : "transparent", color: filterType === "all" ? t.cyan : t.muted, fontWeight: filterType === "all" ? 600 : 400 }}>
          {tr("common.all")} ({logs.length})
        </button>
        {Object.entries(COMM_TYPES).map(([key, ct]) => (
          <button key={key} onClick={() => { setFilterType(key); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1"
            style={{ background: filterType === key ? `${ct.color}20` : "transparent", color: filterType === key ? ct.color : t.muted }}>
            {ct.icon} {ct.label}
          </button>
        ))}
      </div>

      {/* Log list */}
      <Card delay={100}>
        <div className="space-y-2">
          {paginated.length === 0 && <EmptyState icon={Phone} title="কোনো লগ নেই" subtitle="ফিল্টার পরিবর্তন করুন বা নতুন লগ যোগ করুন" />}
          {paginated.map((log) => {
            const ct = COMM_TYPES[log.type] || { icon: "📞", label: log.type, color: t.muted };
            const isFollowUpDue = log.follow_up_date && log.follow_up_date <= today;
            return (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl group"
                style={{ background: t.inputBg, border: `1px solid ${t.border}` }}>
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: `${ct.color}15` }}>{ct.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold" style={{ color: t.cyan }}>{log.studentName || "—"}</p>
                        <Badge color={ct.color} size="xs">{ct.label}</Badge>
                        <Badge color={log.direction === "inbound" ? t.emerald : t.amber} size="xs">{log.direction === "inbound" ? "← ইনবাউন্ড" : "→ আউটবাউন্ড"}</Badge>
                        {log.follow_up_date && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: isFollowUpDue ? `${t.rose}15` : `${t.amber}15`, color: isFollowUpDue ? t.rose : t.amber }}>
                            {isFollowUpDue ? "⚠️" : "📅"} ফলোআপ: {formatDateDisplay(log.follow_up_date)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: t.textSecondary }}>{log.summary}</p>
                      <p className="text-[10px] mt-1" style={{ color: t.muted }}>👤 {log.user} • {formatDateDisplay(log.date)} {log.time}</p>
                    </div>
                    <button onClick={() => setDeleteTarget(log)} className="opacity-0 group-hover:opacity-100 p-1 rounded transition shrink-0" style={{ color: t.rose }}>
                      <Trash2 size={13} />
                    </button>
              </div>
            );
          })}
        </div>
        <Pagination total={filtered.length} page={safePage} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </Card>

      {/* ── ডিলিট কনফার্ম মোডাল ── */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteLog(deleteTarget.id)}
        itemName={deleteTarget?.studentName || ""}
      />
    </div>
  );
}
