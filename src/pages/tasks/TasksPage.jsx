import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Plus, ClipboardList, Clock, CheckCircle, AlertTriangle, Check, Save, X, Trash2, Search } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import DateInput, { formatDateDisplay } from "../../components/ui/DateInput";
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "../../data/mockData";
import { api } from "../../hooks/useAPI";

const COLUMNS = [
  { key: "todo",        label: "করতে হবে",  icon: ClipboardList, colorKey: "muted"   },
  { key: "in_progress", label: "চলছে",       icon: Clock,         colorKey: "amber"   },
  { key: "done",        label: "সম্পন্ন",   icon: CheckCircle,   colorKey: "emerald" },
];

// সার্চযোগ্য ড্রপডাউন — বড় list থেকে সহজে খুঁজে বের করা
// Portal ব্যবহার করে dropdown Modal-এর overflow-এর বাইরে রেন্ডার
function SearchableSelect({ label, value, options, onChange, placeholder, is, t }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const btnRef = useRef(null);
  const dropRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const selected = options.find(o => o.value === value);
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())).slice(0, 20) : options.slice(0, 20);

  // বাটনের position মেপে dropdown position সেট
  const openDrop = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setQ("");
    setOpen(true);
  };

  // বাইরে click করলে বন্ধ
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current?.contains(e.target) || dropRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{label}</label>
      <button ref={btnRef} type="button" onClick={() => open ? setOpen(false) : openDrop()}
        className="w-full px-3 py-2 rounded-lg text-sm text-left outline-none truncate" style={is}>
        {selected ? selected.label : <span style={{ color: t.muted }}>{placeholder}</span>}
      </button>
      {open && ReactDOM.createPortal(
        <div ref={dropRef} style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}>
          <div className="rounded-xl shadow-2xl" style={{ background: t.cardSolid || t.card, border: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: `1px solid ${t.border}` }}>
              <Search size={13} style={{ color: t.muted }} />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none" style={{ color: t.text }} placeholder="খুঁজুন..." />
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              <button type="button" onClick={() => { onChange(""); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs" style={{ color: t.muted }}
                onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>— নির্বাচন বাতিল —</button>
              {filtered.map(o => (
                <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs truncate"
                  style={{ color: value === o.value ? t.cyan : t.text, fontWeight: value === o.value ? 600 : 400 }}
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {o.label}
                </button>
              ))}
              {filtered.length === 0 && <p className="text-xs text-center py-3" style={{ color: t.muted }}>কিছু পাওয়া যায়নি</p>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function TasksPage({ students = [], schools: schoolsProp }) {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
  const [tasks, setTasks] = useState([]);

  // ── Backend থেকে tasks load ──
  useEffect(() => {
    api.get("/tasks").then(data => {
      if (Array.isArray(data)) setTasks(data.map(tk => ({
        ...tk,
        status: tk.status === "pending" ? "todo" : tk.status === "completed" ? "done" : tk.status,
        dueDate: tk.due_date || tk.dueDate,
        studentName: tk.students?.name_en || "",
      })));
    }).catch((err) => { console.error("[Tasks Load]", err); toast.error("টাস্ক ডাটা লোড করতে সমস্যা হয়েছে"); });
  }, []);
  // স্কুল ও ব্যবহারকারী তালিকা — API থেকে load
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  useEffect(() => {
    api.get("/schools").then(data => {
      const arr = Array.isArray(data) ? data : data?.data || [];
      setSchools(arr);
    }).catch(() => {});
    api.get("/users").then(data => {
      const arr = Array.isArray(data) ? data : data?.data || [];
      setUsers(arr);
    }).catch(() => {});
  }, []);

  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newTask, setNewTask] = useState({ title: "", assignee: "", priority: "medium", dueDate: "", studentId: "", schoolId: "" });

  const todoCount       = tasks.filter(tk => tk.status === "todo").length;
  const inProgressCount = tasks.filter(tk => tk.status === "in_progress").length;
  const doneCount       = tasks.filter(tk => tk.status === "done").length;
  const overdueCount    = tasks.filter(tk => tk.status !== "done" && tk.dueDate && new Date(tk.dueDate) < new Date()).length;

  const cycleStatus = async (id) => {
    setTasks(prev => prev.map(tk => {
      if (tk.id !== id) return tk;
      const next = tk.status === "todo" ? "in_progress" : tk.status === "in_progress" ? "done" : "todo";
      const apiStatus = next === "todo" ? "pending" : next === "done" ? "completed" : "in_progress";
      api.patch(`/tasks/${id}`, { status: apiStatus }).catch((err) => { console.error("[Task Status Update]", err); toast.error("স্ট্যাটাস আপডেট সার্ভারে সেভ ব্যর্থ"); });
      toast.updated(TASK_STATUS_CONFIG[next]?.label || next);
      return { ...tk, status: next };
    }));
  };

  const addTask = async () => {
    if (!newTask.title.trim()) { toast.error("টাস্কের বিবরণ দিন"); return; }
    const student = students.find(s => s.id === newTask.studentId);
    const school = schools.find(s => s.id === newTask.schoolId);
    const payload = { title: newTask.title, priority: newTask.priority, due_date: newTask.dueDate || null, student_id: newTask.studentId || null, school_id: newTask.schoolId || null, status: "pending" };
    try {
      const saved = await api.post("/tasks", payload);
      setTasks(prev => [{ ...saved, status: "todo", studentName: student?.name_en || "", schoolName: school?.name_en || "", dueDate: saved.due_date }, ...prev]);
    } catch (err) {
      console.error("[Task Create]", err);
      toast.error("সার্ভারে সেভ ব্যর্থ");
    }
    setNewTask({ title: "", assignee: "", priority: "medium", dueDate: "", studentId: "", schoolId: "" });
    setShowAddForm(false);
    toast.success("টাস্ক যোগ হয়েছে!");
  };

  const deleteTask = async (id) => {
    try { await api.del(`/tasks/${id}`); } catch (err) { console.error("[Task Delete]", err); toast.error("সার্ভার থেকে মুছতে সমস্যা হয়েছে"); }
    setTasks(prev => prev.filter(tk => tk.id !== id));
    setDeleteTarget(null);
    toast.success("টাস্ক মুছে ফেলা হয়েছে");
  };

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  return (
    <div className="space-y-5 anim-fade">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">টাস্ক</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>টাস্ক ও অ্যাসাইনমেন্ট ম্যানেজমেন্ট</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddForm(v => !v)}>নতুন টাস্ক</Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "করতে হবে", value: todoCount,       color: t.muted,   icon: ClipboardList },
          { label: "চলছে",     value: inProgressCount, color: t.amber,   icon: Clock         },
          { label: "সম্পন্ন", value: doneCount,        color: t.emerald, icon: CheckCircle   },
          { label: "সময় পার",  value: overdueCount,     color: t.rose,    icon: AlertTriangle },
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

      {/* Add form — Modal */}
      <Modal isOpen={!!showAddForm} onClose={() => setShowAddForm(false)} title="নতুন টাস্ক" size="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-3">
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>টাস্কের বিবরণ <span className="req-star">*</span></label>
            <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="কী করতে হবে..." />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>অ্যাসাইনি</label>
            <select value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
              <option value="">নির্বাচন করুন</option>
              {users.map(u => <option key={u.id} value={u.name || u.email}>{u.name || u.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>অগ্রাধিকার</label>
            <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
              <option value="high">জরুরি</option><option value="medium">মাঝারি</option><option value="low">সাধারণ</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>শেষ তারিখ</label>
            <DateInput value={newTask.dueDate} onChange={v => setNewTask(p => ({ ...p, dueDate: v }))} size="md" />
          </div>
          <SearchableSelect label="স্টুডেন্ট লিংক (ঐচ্ছিক)" value={newTask.studentId} placeholder="স্টুডেন্ট খুঁজুন..."
            options={students.map(s => ({ value: s.id, label: `${s.name_en} (${s.id})` }))}
            onChange={v => setNewTask(p => ({ ...p, studentId: v }))} is={is} t={t} />
          <SearchableSelect label="স্কুল লিংক (ঐচ্ছিক)" value={newTask.schoolId} placeholder="স্কুল খুঁজুন..."
            options={schools.map(s => ({ value: s.id, label: s.name_en }))}
            onChange={v => setNewTask(p => ({ ...p, schoolId: v }))} is={is} t={t} />
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" size="xs" icon={X} onClick={() => setShowAddForm(false)}>{tr("common.cancel")}</Button>
          <Button icon={Save} size="xs" onClick={addTask}>{tr("common.save")}</Button>
        </div>
      </Modal>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(tk => tk.status === col.key);
          const colColor = t[col.colorKey];
          return (
            <div key={col.key}>
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <col.icon size={14} style={{ color: colColor }} />
                <span className="text-xs font-bold" style={{ color: colColor }}>{col.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${colColor}15`, color: colColor }}>{colTasks.length}</span>
              </div>

              {/* Column drop zone */}
              <div className="space-y-2 min-h-[120px] rounded-xl p-1" style={{ background: `${colColor}06` }}>
                {colTasks.length === 0 && (
                  <div className="flex items-center justify-center h-24 rounded-lg" style={{ border: `1.5px dashed ${colColor}30` }}>
                    <p className="text-[10px]" style={{ color: t.muted }}>কোনো টাস্ক নেই</p>
                  </div>
                )}
                {colTasks.map(task => {
                  const pr = PRIORITY_CONFIG[task.priority] || { color: t.muted, label: task.priority };
                  const isOverdue = task.status !== "done" && task.dueDate && new Date(task.dueDate) < new Date();
                  return (
                    <div key={task.id} className="p-3 rounded-xl group"
                      style={{ background: t.card, border: `1px solid ${isOverdue ? `${t.rose}40` : t.border}` }}>
                      {/* Delete confirm — DeleteConfirmModal ব্যবহার করা হয়েছে (নিচে) */}

                      <div className="flex items-start gap-2">
                        {/* Cycle button */}
                        <button onClick={() => cycleStatus(task.id)}
                          className="mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                          style={{ borderColor: colColor, background: task.status === "done" ? colColor : "transparent" }}>
                          {task.status === "done" && <Check size={11} className="text-white" />}
                          {task.status === "in_progress" && <div className="h-2 w-2 rounded-sm" style={{ background: colColor }} />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium leading-snug ${task.status === "done" ? "line-through opacity-40" : ""}`}>{task.title}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {task.assignee && task.assignee !== "—" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: t.inputBg, color: t.textSecondary }}>{task.assignee}</span>
                            )}
                            {task.studentName && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${t.cyan}10`, color: t.cyan }}>👤 {task.studentName}</span>
                            )}
                            {(task.schoolName || task.schools?.name_en) && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${t.amber}10`, color: t.amber }}>🏫 {task.schoolName || task.schools?.name_en}</span>
                            )}
                            {task.autoCreated && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${t.purple}10`, color: t.purple }}>⚡ স্বয়ংক্রিয়</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge color={pr.color} size="xs">{pr.label}</Badge>
                            {task.dueDate && (
                              <span className="text-[10px]" style={{ color: isOverdue ? t.rose : t.muted }}>
                                {isOverdue ? "⏰ " : ""}{formatDateDisplay(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete button */}
                        <button onClick={() => setDeleteTarget(task)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded transition shrink-0"
                          style={{ color: t.rose }}>
                          <Trash2 size={12} />
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

      {/* ── ডিলিট কনফার্ম মোডাল ── */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTask(deleteTarget.id)}
        itemName={deleteTarget?.title || ""}
      />
    </div>
  );
}
