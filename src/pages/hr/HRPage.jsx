import { useState, useEffect } from "react";
import { DollarSign, Users, CheckCircle, Building, Plus, Save, X, Search } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import SortHeader from "../../components/ui/SortHeader";
import useSortable from "../../hooks/useSortable";
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
  const [searchQ, setSearchQ] = useState("");
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("name");
  const branches = INITIAL_BRANCHES.filter((b) => b.status === "active");
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

  const handleAdd = () => {
    if (!newEmp.name.trim()) { toast.error("নাম দিন"); return; }
    if (!newEmp.role) { toast.error("পদবি নির্বাচন করুন"); return; }
    if (!newEmp.branch) { toast.error("ব্রাঞ্চ নির্বাচন করুন"); return; }
    const emp = {
      id: `EMP-${String(employees.length + 1).padStart(3, "0")}`,
      ...newEmp,
      salary: parseInt(newEmp.salary) || 0,
      status: "active",
      joinDate: new Date().toISOString().slice(0, 10),
      leaves: { total: 18, used: 0 },
    };
    setEmployees(prev => [...prev, emp]);
    setNewEmp({ name: "", role: "", branch: "", salary: "", phone: "", email: "" });
    setShowAddForm(false);
    toast.success("কর্মচারী যোগ হয়েছে!");
  };

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">এইচআর ও বেতন</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>কর্মী ব্যবস্থাপনা ও বেতন</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddForm(!showAddForm)}>কর্মী যোগ করুন</Button>
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
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleAdd}>যোগ করুন</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>বাতিল</Button>
          </div>
        </Card>
      )}

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
          placeholder="কর্মী খুঁজুন..." />
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
                      <Badge color={emp.status === "active" ? t.emerald : t.muted} size="xs">{emp.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>
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
                        <Badge color={emp.status === "active" ? t.emerald : t.muted} size="xs">{emp.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>
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
        // ছুটি ট্যাবে active ও সার্চ ফিল্টার করা কর্মী
        const leaveEmps = filteredEmps.filter((e) => e.status === "active");
        return (
          <Card delay={100}>
            <h3 className="text-sm font-semibold mb-3">ছুটির তালিকা</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <SortHeader label="কর্মী" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                    <SortHeader label="পদবি" sortKey="role" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                    <SortHeader label="ব্রাঞ্চ" sortKey="branch" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                    <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>মোট ছুটি</th>
                    <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>ব্যবহৃত</th>
                    <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>বাকি</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveEmps.map((emp) => {
                    const leaves = emp.leaves || { total: 18, used: 0 };
                    const total = leaves.total || 18;
                    const used = leaves.used || 0;
                    const remaining = total - used;
                    const pct = Math.round((remaining / total) * 100);
                    return (
                      <tr key={emp.id} style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td className="py-3 px-4 font-medium">{emp.name}</td>
                        <td className="py-3 px-4" style={{ color: t.muted }}>{emp.role}</td>
                        <td className="py-3 px-4" style={{ color: t.muted }}>{emp.branch}</td>
                        <td className="py-3 px-4">{total}</td>
                        <td className="py-3 px-4" style={{ color: t.amber }}>{used}</td>
                        <td className="py-3 px-4 font-bold" style={{ color: pct >= 50 ? t.emerald : t.amber }}>{remaining}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {leaveEmps.length === 0 && (
                <p className="text-center text-xs py-6" style={{ color: t.muted }}>কোনো কর্মী পাওয়া যায়নি</p>
              )}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
