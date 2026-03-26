import { useState, useEffect } from "react";
import { DollarSign, Users, CheckCircle, Building, Plus, Save, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { INITIAL_BRANCHES, ALL_ROLES } from "../../data/mockData";
import { api } from "../../hooks/useAPI";

export default function HRPage() {
  const t = useTheme();
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState("employees");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: "", role: "", branch: "", salary: "", phone: "", email: "" });
  const [salaryHistory, setSalaryHistory] = useState([]);

  // ── Backend থেকে employees ও salary history load ──
  useEffect(() => {
    api.get("/hr/employees").then(data => { if (Array.isArray(data)) setEmployees(data); }).catch(() => {});
    api.get("/hr/salary").then(data => { if (Array.isArray(data)) setSalaryHistory(data); }).catch(() => {});
  }, []);
  const [payingEmpId, setPayingEmpId] = useState(null);
  const [payForm, setPayForm] = useState({ month: "", amount: "", method: "Bank Transfer", note: "" });
  const branches = INITIAL_BRANCHES.filter((b) => b.status === "active");
  const currentMonth = new Date().toISOString().slice(0, 7);

  const activeEmps = employees.filter((e) => e.status === "active");
  const totalSalary = activeEmps.reduce((s, e) => s + (e.salary || 0), 0);

  const handleAdd = () => {
    if (!newEmp.name.trim()) { toast.error("নাম দিন"); return; }
    if (!newEmp.role) { toast.error("পদবি নির্বাচন করুন"); return; }
    if (!newEmp.branch) { toast.error("Branch নির্বাচন করুন"); return; }
    const emp = {
      id: `EMP-${String(employees.length + 1).padStart(3, "0")}`,
      ...newEmp,
      salary: parseInt(newEmp.salary) || 0,
      status: "active",
      joinDate: new Date().toISOString().slice(0, 10),
      leaves: { total: 18, used: 0 },
    };
    setEmployees([...employees, emp]);
    setNewEmp({ name: "", role: "", branch: "", salary: "", phone: "", email: "" });
    setShowAddForm(false);
    toast.success("কর্মচারী যোগ হয়েছে!");
  };

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">HR & Payroll</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>কর্মী ব্যবস্থাপনা ও বেতন</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddForm(!showAddForm)}>Add Employee</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "মোট কর্মী", value: employees.length, color: t.cyan, Icon: Users },
          { label: "Active", value: activeEmps.length, color: t.emerald, Icon: CheckCircle },
          { label: "মাসিক বেতন", value: `৳${totalSalary.toLocaleString()}`, color: t.amber, Icon: DollarSign },
          { label: "Branches", value: [...new Set(employees.map((e) => e.branch))].length, color: t.purple, Icon: Building },
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

      {showAddForm && (
        <Card delay={0}>
          <h3 className="text-sm font-semibold mb-3">নতুন কর্মী যোগ করুন</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: "name", label: "নাম *", placeholder: "কর্মচারীর পুরো নাম" },
              { key: "phone", label: "ফোন", placeholder: "01XXXXXXXXX" },
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
              <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পদবি / Role <span className="req-star">*</span></label>
              <select value={newEmp.role} onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                <option value="">— পদবি নির্বাচন করুন —</option>
                {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Branch <span className="req-star">*</span></label>
              <select value={newEmp.branch} onChange={(e) => setNewEmp({ ...newEmp, branch: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                <option value="">— Branch নির্বাচন করুন —</option>
                {branches.map((b) => <option key={b.id} value={b.name}>{b.name} ({b.city})</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleAdd}>যোগ করুন</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>বাতিল</Button>
          </div>
        </Card>
      )}

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {[
          { key: "employees", label: "👥 Employees" },
          { key: "salary", label: "💰 Salary" },
          { key: "leave", label: "🏖️ Leave" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab === tab.key ? (t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#ffffff") : "transparent",
              color: activeTab === tab.key ? t.text : t.muted,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "employees" && (
        <div className="space-y-2">
          {employees.map((emp, i) => (
            <Card key={emp.id} delay={i * 40} className="!p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                  {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{emp.name}</p>
                    <Badge color={emp.status === "active" ? t.emerald : t.muted} size="xs">{emp.status}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] mt-0.5" style={{ color: t.muted }}>
                    <span>{emp.role}</span>
                    <span>🏢 {emp.branch}</span>
                    {emp.phone && <span>📞 {emp.phone}</span>}
                    {emp.joinDate && <span>📅 {emp.joinDate}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold font-mono" style={{ color: t.emerald }}>৳{(emp.salary || 0).toLocaleString()}</p>
                  <p className="text-[9px]" style={{ color: t.muted }}>মাসিক</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "salary" && (
        <div className="space-y-3">
          <Card delay={100}>
            <h3 className="text-sm font-semibold mb-3">বেতন তালিকা</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["কর্মী", "পদবি", "Branch", "মূল বেতন", "Status", ""].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-[10px] uppercase font-medium" style={{ color: t.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${t.border}` }}
                      onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td className="py-2.5 px-3 font-medium">{emp.name}</td>
                      <td className="py-2.5 px-3" style={{ color: t.muted }}>{emp.role}</td>
                      <td className="py-2.5 px-3" style={{ color: t.muted }}>{emp.branch}</td>
                      <td className="py-2.5 px-3 font-mono font-bold" style={{ color: t.emerald }}>৳{(emp.salary || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <Badge color={emp.status === "active" ? t.emerald : t.muted} size="xs">{emp.status}</Badge>
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
                    <td className="py-2.5 px-3 font-mono font-bold text-sm" style={{ color: t.amber }}>৳{totalSalary.toLocaleString()}</td>
                    <td /><td />
                  </tr>
                </tfoot>
              </table>
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
                  <Button variant="ghost" size="xs" onClick={() => setPayingEmpId(null)}>বাতিল</Button>
                  <Button icon={Save} size="xs" onClick={() => {
                    const amt = parseInt(payForm.amount);
                    if (!payForm.month) { toast.error("মাস নির্বাচন করুন"); return; }
                    if (!amt || amt <= 0) { toast.error("সঠিক পরিমাণ দিন"); return; }
                    const record = {
                      id: `SAL-${Date.now()}`,
                      empId: emp.id,
                      empName: emp.name,
                      month: payForm.month,
                      amount: amt,
                      method: payForm.method,
                      note: payForm.note,
                      date: new Date().toISOString().slice(0, 10),
                      paid: true,
                    };
                    setSalaryHistory((prev) => [record, ...prev]);
                    setPayingEmpId(null);
                    toast.success(`${emp.name} — ৳${amt.toLocaleString()} বেতন পরিশোধ হয়েছে`);
                  }}>সংরক্ষণ</Button>
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
                      <Badge color={rec.paid ? t.emerald : t.amber} size="xs">{rec.paid ? "Paid" : "Pending"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "leave" && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-3">ছুটির তালিকা</h3>
          <div className="space-y-2">
            {employees.filter((e) => e.status === "active").map((emp, i) => {
              const leaves = emp.leaves || { total: 18, used: 0 };
              const remaining = (leaves.total || 18) - (leaves.used || 0);
              const total = leaves.total || 18;
              const pct = Math.round((remaining / total) * 100);
              return (
                <div key={emp.id} className="p-3 rounded-lg" style={{ background: t.inputBg }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold">{emp.name}</p>
                      <p className="text-[10px]" style={{ color: t.muted }}>{emp.role} — {emp.branch}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: pct >= 50 ? t.emerald : t.amber }}>{remaining} দিন বাকি</p>
                      <p className="text-[9px]" style={{ color: t.muted }}>মোট {total} দিন</p>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${t.muted}20` }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 50 ? t.emerald : t.amber }} />
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px]" style={{ color: t.muted }}>
                    <span>মোট: {total}</span>
                    <span>ব্যবহৃত: {leaves.used || 0}</span>
                    <span>বাকি: {remaining}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
