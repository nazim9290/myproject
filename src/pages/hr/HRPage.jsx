import { useState, useEffect } from "react";
import { DollarSign, Users, CheckCircle, Building, Plus, Save, X, Search, Edit3, Trash2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PhoneInput from "../../components/ui/PhoneInput";
import SortHeader from "../../components/ui/SortHeader";
import useSortable from "../../hooks/useSortable";
import { ALL_ROLES } from "../../data/mockData";
import { api } from "../../hooks/useAPI";

export default function HRPage() {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState("employees");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [newEmp, setNewEmp] = useState({ name: "", role: "", branch: "", salary: "", phone: "", email: "" });
  const [salaryHistory, setSalaryHistory] = useState([]);

  // ── ছুটি state ──
  const [leaveList, setLeaveList] = useState([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ employee_id: "", type: "casual", start_date: "", end_date: "", reason: "" });

  // ── Backend থেকে employees, salary, leaves load ──
  useEffect(() => {
    api.get("/hr/employees").then(data => { if (Array.isArray(data)) setEmployees(data); }).catch((err) => { console.error("[HR Employees Load]", err); toast.error("কর্মচারী ডাটা লোড করতে সমস্যা হয়েছে"); });
    api.get("/hr/salary").then(data => { if (Array.isArray(data)) setSalaryHistory(data); }).catch((err) => { console.error("[HR Salary Load]", err); });
    api.get("/hr/leaves").then(data => { if (Array.isArray(data)) setLeaveList(data); }).catch((err) => { console.error("[HR Leaves Load]", err); });
  }, []);
  const [payingEmpId, setPayingEmpId] = useState(null);
  const [payForm, setPayForm] = useState({ month: "", amount: "", method: "Bank Transfer", note: "" });
  const [searchQ, setSearchQ] = useState("");
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("name");
  const [branches, setBranches] = useState([]);
  useEffect(() => { api.get("/branches").then(d => { if (Array.isArray(d)) setBranches(d); }).catch(() => {}); }, []);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const activeEmps = employees.filter((e) => e.status === "active");
  const totalSalary = activeEmps.reduce((s, e) => s + (e.salary || 0), 0);

  // সার্চ ফিল্টার — নাম বা ফোন দিয়ে কর্মী খুঁজুন
  const filteredEmps = sortFn(
    employees.filter((e) =>
      !searchQ ||
      e.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      (e.phone || "").includes(searchQ)
    )
  );

  const emptyEmp = { name: "", role: "", branch: "", salary: "", phone: "", email: "", password: "", systemRole: "counselor", createAccount: false };

  const handleAdd = async () => {
    if (!newEmp.name.trim()) { toast.error("নাম দিন"); return; }
    if (newEmp.createAccount && !newEmp.email.trim()) { toast.error("লগইন অ্যাকাউন্টের জন্য ইমেইল দিন"); return; }
    if (newEmp.createAccount && (!newEmp.password || newEmp.password.length < 8)) { toast.error("পাসওয়ার্ড কমপক্ষে ৮ অক্ষর দিন"); return; }

    const empData = { name: newEmp.name, designation: newEmp.role, role: newEmp.role, branch: newEmp.branch, salary: parseInt(newEmp.salary) || 0, phone: newEmp.phone || "", email: newEmp.email || "" };
    try {
      if (editingId) {
        const updated = await api.patch(`/hr/employees/${editingId}`, empData);
        setEmployees(prev => prev.map(e => e.id === editingId ? { ...e, ...updated } : e));
        toast.updated("কর্মচারী");
      } else {
        // 1. Employee তৈরি
        const saved = await api.post("/hr/employees", empData);
        setEmployees(prev => [...prev, saved]);

        // 2. System login account তৈরি (checkbox checked হলে)
        if (newEmp.createAccount && newEmp.email) {
          try {
            await api.post("/auth/register", {
              name: newEmp.name, email: newEmp.email, password: newEmp.password,
              role: newEmp.systemRole || "counselor", branch: newEmp.branch,
            });
            toast.success(`কর্মচারী + লগইন অ্যাকাউন্ট তৈরি হয়েছে (${newEmp.email})`);
          } catch (err) {
            toast.success("কর্মচারী যোগ হয়েছে!");
            toast.error("লগইন অ্যাকাউন্ট তৈরি ব্যর্থ: " + (err.message || "email ব্যবহৃত"));
          }
        } else {
          toast.success("কর্মচারী যোগ হয়েছে!");
        }
      }
    } catch (err) { toast.error(err.message || "সমস্যা হয়েছে"); }
    setNewEmp(emptyEmp); setShowAddForm(false); setEditingId(null);
  };

  const openEdit = (emp) => {
    setNewEmp({ name: emp.name || "", role: emp.designation || emp.role || "", branch: emp.branch || "", salary: String(emp.salary || ""), phone: emp.phone || "", email: emp.email || "" });
    setEditingId(emp.id); setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.patch(`/hr/employees/${id}`, { status: "inactive" });
      setEmployees(prev => prev.filter(e => e.id !== id));
      toast.success("কর্মচারী মুছে ফেলা হয়েছে");
    } catch { toast.error("মুছতে ব্যর্থ"); }
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{tr("hr.title")}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>কর্মী ব্যবস্থাপনা ও বেতন</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddForm(!showAddForm)}>{tr("hr.addEmployee")}</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "মোট কর্মী", value: employees.length, color: t.cyan, Icon: Users },
          { label: "সক্রিয়", value: activeEmps.length, color: t.emerald, Icon: CheckCircle },
          { label: "মাসিক বেতন", value: `৳${totalSalary.toLocaleString()}`, color: t.amber, Icon: DollarSign },
          { label: "ব্রাঞ্চ", value: [...new Set(employees.map((e) => e.branch))].length, color: t.purple, Icon: Building },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 50}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.Icon size={16} style={{ color: kpi.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── কর্মী যোগ/সম্পাদনা Modal ── */}
      <Modal isOpen={!!showAddForm} onClose={() => { setShowAddForm(false); setEditingId(null); }} title={editingId ? tr("hr.editEmployee") : tr("hr.addEmployee")} size="xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: "name", label: "নাম *", placeholder: "কর্মচারীর পুরো নাম" },
              { key: "email", label: "ইমেইল", placeholder: "user@agency.com" },
              { key: "salary", label: "মাসিক বেতন (৳)", placeholder: "25000", type: "number" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: t.muted }}>{field.label}</label>
                <input
                  type={field.type || "text"}
                  value={newEmp[field.key]}
                  onChange={(e) => setNewEmp({ ...newEmp, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                />
              </div>
            ))}
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: t.muted }}>ফোন</label>
              <PhoneInput value={newEmp.phone} onChange={v => setNewEmp({ ...newEmp, phone: v })} size="sm" className="mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পদবি <span className="req-star">*</span></label>
              <select value={newEmp.role} onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                <option value="">— পদবি নির্বাচন করুন —</option>
                {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ব্রাঞ্চ <span className="req-star">*</span></label>
              <select value={newEmp.branch} onChange={(e) => setNewEmp({ ...newEmp, branch: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                <option value="">— ব্রাঞ্চ নির্বাচন করুন —</option>
                {branches.map((b) => <option key={b.id} value={b.name}>{b.name} ({b.city})</option>)}
              </select>
            </div>
          </div>

          {/* ── লগইন অ্যাকাউন্ট সেকশন ── */}
          {!editingId && (
            <div className="mt-4 p-3 rounded-xl" style={{ background: `${t.cyan}08`, border: `1px solid ${t.cyan}20` }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newEmp.createAccount} onChange={e => setNewEmp({ ...newEmp, createAccount: e.target.checked })}
                  className="rounded" />
                <span className="text-xs font-medium">🔑 লগইন অ্যাকাউন্ট তৈরি করুন (সিস্টেমে ঢুকতে পারবে)</span>
              </label>
              {newEmp.createAccount && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: t.muted }}>লগইন ইমেইল *</label>
                    <input type="email" value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })}
                      placeholder="staff@agency.com" className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: t.muted }}>পাসওয়ার্ড * (৮+ অক্ষর)</label>
                    <input type="password" value={newEmp.password} onChange={e => setNewEmp({ ...newEmp, password: e.target.value })}
                      placeholder="********" className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: t.muted }}>সিস্টেম রোল</label>
                    <select value={newEmp.systemRole} onChange={e => setNewEmp({ ...newEmp, systemRole: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                      <option value="counselor">কাউন্সেলর</option>
                      <option value="admission_officer">ভর্তি অফিসার</option>
                      <option value="language_teacher">ভাষা শিক্ষক</option>
                      <option value="document_collector">ডক কালেক্টর</option>
                      <option value="document_processor">ডক প্রসেসর</option>
                      <option value="accounts">একাউন্ট্যান্ট</option>
                      <option value="follow-up_executive">ফলোআপ এক্সিকিউটিভ</option>
                      <option value="branch_manager">ব্রাঞ্চ ম্যানেজার</option>
                      <option value="admin">অ্যাডমিন</option>
                      <option value="viewer">ভিউয়ার (শুধু দেখতে পারবে)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleAdd}>{editingId ? tr("common.save") : tr("common.add")}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setEditingId(null); }}>{tr("common.cancel")}</Button>
          </div>
      </Modal>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {[
          { key: "employees", label: "👥 কর্মীতালিকা" },
          { key: "salary", label: "💰 বেতন" },
          { key: "leave", label: "🏖️ ছুটি" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab === tab.key ? `${t.cyan}15` : "transparent",
              color: activeTab === tab.key ? t.cyan : t.muted,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* সার্চ বার */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
        style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
        <Search size={14} style={{ color: t.muted }} />
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
          placeholder={tr("common.search")} />
      </div>

      {activeTab === "employees" && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-3">কর্মী তালিকা</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  <SortHeader label="নাম" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="পদবি" sortKey="role" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="ব্রাঞ্চ" sortKey="branch" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>ফোন</th>
                  <SortHeader label="যোগদান" sortKey="joinDate" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="বেতন" sortKey="salary" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="স্ট্যাটাস" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <th className="text-right py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmps.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: `1px solid ${t.border}` }}
                    onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                          {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-medium">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4" style={{ color: t.muted }}>{emp.role}</td>
                    <td className="py-3 px-4" style={{ color: t.muted }}>{emp.branch}</td>
                    <td className="py-3 px-4" style={{ color: t.muted }}>{emp.phone || "—"}</td>
                    <td className="py-3 px-4" style={{ color: t.muted }}>{emp.joinDate || "—"}</td>
                    <td className="py-3 px-4 font-mono font-bold" style={{ color: t.emerald }}>৳{(emp.salary || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge color={emp.status === "active" ? t.emerald : t.muted} size="xs">{emp.status === "active" ? tr("common.active") : tr("common.inactive")}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg transition" style={{ color: t.muted }}
                          onMouseEnter={e => e.currentTarget.style.color = t.cyan} onMouseLeave={e => e.currentTarget.style.color = t.muted} title="সম্পাদনা">
                          <Edit3 size={14} />
                        </button>
                        {deleteConfirmId === emp.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(emp.id)} className="text-[10px] px-2 py-1 rounded font-medium" style={{ background: t.rose, color: "#fff" }}>হ্যাঁ</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="text-[10px] px-2 py-1 rounded" style={{ color: t.muted }}>না</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(emp.id)} className="p-1.5 rounded-lg transition" style={{ color: t.muted }}
                            onMouseEnter={e => e.currentTarget.style.color = t.rose} onMouseLeave={e => e.currentTarget.style.color = t.muted} title="মুছুন">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEmps.length === 0 && (
              <p className="text-center text-xs py-6" style={{ color: t.muted }}>কোনো কর্মী পাওয়া যায়নি</p>
            )}
          </div>
        </Card>
      )}

      {activeTab === "salary" && (
        <div className="space-y-3">
          <Card delay={100}>
            <h3 className="text-sm font-semibold mb-3">বেতন তালিকা</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <SortHeader label="কর্মী" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                    <SortHeader label="পদবি" sortKey="role" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                    <SortHeader label="ব্রাঞ্চ" sortKey="branch" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                    <SortHeader label="মূল বেতন" sortKey="salary" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                    <SortHeader label="স্ট্যাটাস" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                    <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmps.map((emp) => (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${t.border}` }}
                      onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td className="py-2.5 px-3 font-medium">{emp.name}</td>
                      <td className="py-2.5 px-3" style={{ color: t.muted }}>{emp.role}</td>
                      <td className="py-2.5 px-3" style={{ color: t.muted }}>{emp.branch}</td>
                      <td className="py-2.5 px-3 font-mono font-bold" style={{ color: t.emerald }}>৳{(emp.salary || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <Badge color={emp.status === "active" ? t.emerald : t.muted} size="xs">{emp.status === "active" ? tr("common.active") : tr("common.inactive")}</Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        {emp.status === "active" && (
                          <button
                            onClick={() => { setPayingEmpId(emp.id); setPayForm({ month: currentMonth, amount: String(emp.salary || ""), method: "Bank Transfer", note: "" }); }}
                            className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition"
                            style={{ background: `${t.amber}15`, color: t.amber }}>
                            💰 বেতন দিন
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${t.border}` }}>
                    <td colSpan={3} className="py-2.5 px-3 font-bold text-xs">মোট মাসিক বেতন</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-sm" style={{ color: t.amber }}>
                      ৳{filteredEmps.reduce((s, e) => s + (e.salary || 0), 0).toLocaleString()}
                    </td>
                    <td /><td />
                  </tr>
                </tfoot>
              </table>
              {filteredEmps.length === 0 && (
                <p className="text-center text-xs py-6" style={{ color: t.muted }}>কোনো কর্মী পাওয়া যায়নি</p>
              )}
            </div>
          </Card>

          {/* Salary Payment Form */}
          {payingEmpId && (() => {
            const emp = employees.find((e) => e.id === payingEmpId);
            if (!emp) return null;
            const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
            return (
              <Card delay={0}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">💰 বেতন পরিশোধ — <span style={{ color: t.cyan }}>{emp.name}</span></h3>
                  <Button variant="ghost" size="xs" icon={X} onClick={() => setPayingEmpId(null)}>বাতিল</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>মাস</label>
                    <input type="month" value={payForm.month} onChange={(e) => setPayForm((p) => ({ ...p, month: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পরিমাণ (৳)</label>
                    <input type="number" value={payForm.amount} onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পদ্ধতি</label>
                    <select value={payForm.method} onChange={(e) => setPayForm((p) => ({ ...p, method: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                      <option>Bank Transfer</option><option>Cash</option><option>Cheque</option><option>Mobile Banking</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নোট</label>
                    <input value={payForm.note} onChange={(e) => setPayForm((p) => ({ ...p, note: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="ঐচ্ছিক নোট..." />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="ghost" size="xs" onClick={() => setPayingEmpId(null)}>{tr("common.cancel")}</Button>
                  <Button icon={Save} size="xs" onClick={async () => {
                    const amt = parseInt(payForm.amount);
                    if (!payForm.month) { toast.error("মাস নির্বাচন করুন"); return; }
                    if (!amt || amt <= 0) { toast.error("সঠিক পরিমাণ দিন"); return; }
                    const salaryData = { employee_id: emp.id, month: payForm.month, amount: amt, method: payForm.method, note: payForm.note };
                    let record = { id: `SAL-${Date.now()}`, empId: emp.id, empName: emp.name, ...salaryData, date: new Date().toISOString().slice(0, 10), paid: true };
                    try { const saved = await api.post("/hr/salary", salaryData); if (saved) record = { ...record, ...saved }; } catch (err) { console.error("[Salary Save]", err); toast.error("বেতন সার্ভারে সেভ ব্যর্থ"); }
                    setSalaryHistory((prev) => [record, ...prev]);
                    setPayingEmpId(null);
                    toast.success(`${emp.name} — ৳${amt.toLocaleString()} বেতন পরিশোধ হয়েছে`);
                  }}>{tr("common.save")}</Button>
                </div>
              </Card>
            );
          })()}

          {salaryHistory.length > 0 && (
            <Card delay={200}>
              <h4 className="text-xs font-semibold mb-3" style={{ color: t.muted }}>বেতন ইতিহাস</h4>
              <div className="space-y-1.5">
                {salaryHistory.map((rec, i) => (
                  <div key={rec.id || i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: t.inputBg }}>
                    <div>
                      <p className="text-xs font-medium">{rec.empName || rec.month}</p>
                      <p className="text-[10px]" style={{ color: t.muted }}>{rec.month}{rec.method && ` • ${rec.method}`}{rec.note && ` • ${rec.note}`}</p>
                      {rec.totalBonus > 0 && <p className="text-[10px]" style={{ color: t.amber }}>বোনাস: ৳{rec.totalBonus.toLocaleString()}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold font-mono" style={{ color: t.emerald }}>৳{(rec.amount || rec.totalSalary || 0).toLocaleString()}</p>
                      <Badge color={rec.paid ? t.emerald : t.amber} size="xs">{rec.paid ? "পরিশোধিত" : "বকেয়া"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "leave" && (() => {
        const LEAVE_TYPES = { casual: "নৈমিত্তিক", sick: "অসুস্থতা", annual: "বার্ষিক", emergency: "জরুরি", maternity: "মাতৃত্বকালীন", other: "অন্যান্য" };
        const STATUS_COLORS = { pending: t.amber, approved: t.emerald, rejected: t.rose };
        const STATUS_LABELS = { pending: "অপেক্ষমাণ", approved: "অনুমোদিত", rejected: "বাতিল" };
        return (
          <Card delay={100}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">🏖️ ছুটি ব্যবস্থাপনা</h3>
              <Button size="xs" icon={Plus} onClick={() => setShowLeaveForm(!showLeaveForm)}>{tr("hr.leaveApplication")}</Button>
            </div>

            {/* ── ছুটি আবেদন Modal ── */}
            <Modal isOpen={!!showLeaveForm} onClose={() => setShowLeaveForm(false)} title={tr("hr.leaveApplication")} size="md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>কর্মচারী *</label>
                    <select value={leaveForm.employee_id} onChange={e => setLeaveForm({ ...leaveForm, employee_id: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                      <option value="">— নির্বাচন —</option>
                      {employees.filter(e => e.status === "active").map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>ছুটির ধরন</label>
                    <select value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                      {Object.entries(LEAVE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>শুরু *</label>
                    <input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>শেষ *</label>
                    <input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>কারণ</label>
                  <input value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    placeholder="ছুটির কারণ লিখুন..." className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="xs" onClick={async () => {
                    if (!leaveForm.employee_id || !leaveForm.start_date || !leaveForm.end_date) { toast.error("কর্মচারী ও তারিখ দিন"); return; }
                    try {
                      const saved = await api.post("/hr/leaves", leaveForm);
                      setLeaveList(prev => [saved, ...prev]);
                      toast.success("ছুটি আবেদন যোগ হয়েছে");
                      setLeaveForm({ employee_id: "", type: "casual", start_date: "", end_date: "", reason: "" });
                      setShowLeaveForm(false);
                    } catch (err) { toast.error(err.message || "সমস্যা"); }
                  }}>{tr("common.save")}</Button>
                  <Button size="xs" variant="ghost" onClick={() => setShowLeaveForm(false)}>{tr("common.cancel")}</Button>
                </div>
            </Modal>

            {/* ── ছুটি তালিকা ── */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["কর্মচারী", "ধরন", "শুরু", "শেষ", "দিন", "কারণ", "স্ট্যাটাস", "অ্যাকশন"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaveList.map(l => (
                    <tr key={l.id} style={{ borderBottom: `1px solid ${t.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td className="py-3 px-4 font-medium">{l.employees?.name || "—"}</td>
                      <td className="py-3 px-4"><Badge color={t.cyan} size="xs">{LEAVE_TYPES[l.type] || l.type}</Badge></td>
                      <td className="py-3 px-4 font-mono">{l.start_date?.slice(0, 10)}</td>
                      <td className="py-3 px-4 font-mono">{l.end_date?.slice(0, 10)}</td>
                      <td className="py-3 px-4 font-bold" style={{ color: t.cyan }}>{l.days}</td>
                      <td className="py-3 px-4" style={{ color: t.muted }}>{l.reason || "—"}</td>
                      <td className="py-3 px-4"><Badge color={STATUS_COLORS[l.status] || t.muted} size="xs">{STATUS_LABELS[l.status] || l.status}</Badge></td>
                      <td className="py-3 px-4">
                        {l.status === "pending" && (
                          <div className="flex gap-1">
                            <button onClick={async () => {
                              try { const u = await api.patch(`/hr/leaves/${l.id}`, { status: "approved" }); setLeaveList(prev => prev.map(x => x.id === l.id ? { ...x, ...u } : x)); toast.success("অনুমোদিত"); } catch { toast.error("ব্যর্থ"); }
                            }} className="px-2 py-0.5 rounded text-[10px]" style={{ color: t.emerald, background: `${t.emerald}15` }}>✓ অনুমোদন</button>
                            <button onClick={async () => {
                              try { const u = await api.patch(`/hr/leaves/${l.id}`, { status: "rejected" }); setLeaveList(prev => prev.map(x => x.id === l.id ? { ...x, ...u } : x)); toast.success("বাতিল করা হয়েছে"); } catch { toast.error("ব্যর্থ"); }
                            }} className="px-2 py-0.5 rounded text-[10px]" style={{ color: t.rose, background: `${t.rose}15` }}>✗ বাতিল</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leaveList.length === 0 && <p className="text-center text-xs py-8" style={{ color: t.muted }}>কোনো ছুটির আবেদন নেই</p>}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
