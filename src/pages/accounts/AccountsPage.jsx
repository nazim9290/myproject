import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Clock, FileText, Download, Plus, Save, X, Check } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { CATEGORY_CONFIG, FEE_CATEGORIES } from "../../data/mockData";
import { api } from "../../hooks/useAPI";

const INCOME_CATS = ["course_fee", "doc_processing", "service_charge", "partner_service"];
const EXPENSE_CATS = ["salary", "rent", "marketing", "agent_fee", "utility", "office_supply", "misc"];

function AddEntryForm({ type, onSave, onCancel }) {
  const t = useTheme();
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
  const [form, setForm] = useState(
    type === "income"
      ? { studentName: "", studentId: "", category: "course_fee", amount: "", installments: "1", dueDate: "" }
      : { category: "salary", description: "", amount: "", date: new Date().toISOString().slice(0, 10) }
  );
  const [err, setErr] = useState({});
  const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); if (err[k]) setErr(prev => ({ ...prev, [k]: null })); };

  const save = () => {
    const e = {};
    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) e.amount = "সঠিক পরিমাণ দিন";
    if (type === "income" && !form.studentName.trim()) e.studentName = "স্টুডেন্টের নাম দিন";
    if (type === "expense" && !form.description.trim()) e.description = "বিবরণ দিন";
    setErr(e);
    if (Object.keys(e).length) return;
    const amt = parseInt(form.amount);
    if (type === "income") {
      const tax = ["course_fee"].includes(form.category) ? Math.round(amt * 0.15) : 0;
      const installments = parseInt(form.installments) || 1;
      onSave({
        id: `INC-${Date.now()}`, studentId: form.studentId || "—", studentName: form.studentName,
        category: form.category, amount: amt, tax, installments, paid: 0, paidAmount: 0,
        dueDate: form.dueDate || null, status: "unpaid",
      });
    } else {
      onSave({
        id: `EXP-${Date.now()}`, category: form.category,
        description: form.description, amount: amt,
        date: form.date || new Date().toISOString().slice(0, 10),
      });
    }
  };

  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;

  return (
    <Card delay={0}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold">{type === "income" ? "নতুন আয় এন্ট্রি" : "নতুন ব্যয় এন্ট্রি"}</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="xs" icon={X} onClick={onCancel}>বাতিল</Button>
          <Button icon={Save} size="xs" onClick={save}>Save</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ক্যাটাগরি</label>
          <select value={form.category} onChange={e => set("category", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
            {cats.map(c => <option key={c} value={c}>{CATEGORY_CONFIG[c]?.icon} {CATEGORY_CONFIG[c]?.label || c}</option>)}
          </select>
        </div>

        {type === "income" ? (
          <>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>স্টুডেন্টের নাম <span className="req-star">*</span></label>
              <input value={form.studentName} onChange={e => set("studentName", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ ...is, borderColor: err.studentName ? t.rose : t.inputBorder }} placeholder="Student name..." />
              {err.studentName && <p className="text-[10px] mt-1" style={{ color: t.rose }}>{err.studentName}</p>}
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Student ID</label>
              <input value={form.studentId} onChange={e => set("studentId", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="S-2026-001" />
            </div>
          </>
        ) : (
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>বিবরণ <span className="req-star">*</span></label>
            <input value={form.description} onChange={e => set("description", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ ...is, borderColor: err.description ? t.rose : t.inputBorder }} placeholder="খরচের বিবরণ..." />
            {err.description && <p className="text-[10px] mt-1" style={{ color: t.rose }}>{err.description}</p>}
          </div>
        )}

        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পরিমাণ (৳) <span className="req-star">*</span></label>
          <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ ...is, borderColor: err.amount ? t.rose : t.inputBorder }} placeholder="45000" />
          {err.amount && <p className="text-[10px] mt-1" style={{ color: t.rose }}>{err.amount}</p>}
          {type === "income" && INCOME_CATS.includes(form.category) && form.amount && (
            <p className="text-[10px] mt-1" style={{ color: t.purple }}>ট্যাক্স (15%): ৳{Math.round(+form.amount * 0.15).toLocaleString()}</p>
          )}
        </div>

        {type === "income" ? (
          <>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>কিস্তি সংখ্যা</label>
              <select value={form.installments} onChange={e => set("installments", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                <option value="1">১ কিস্তি (একসাথে)</option>
                <option value="2">২ কিস্তি</option>
                <option value="3">৩ কিস্তি</option>
                <option value="4">৪ কিস্তি</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Due তারিখ</label>
              <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
            </div>
          </>
        ) : (
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>তারিখ</label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
          </div>
        )}
      </div>
    </Card>
  );
}

export default function AccountsPage({ students = [] }) {
  const t = useTheme();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddForm, setShowAddForm] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);

  // ── Backend থেকে payments ও expenses load ──
  useEffect(() => {
    api.get("/accounts/payments").then(data => {
      if (Array.isArray(data)) setIncomeData(data.map(p => ({ ...p, studentName: p.students?.name_en || p.student_id, status: p.status === "paid" ? "collected" : p.status })));
    }).catch(() => {});
    api.get("/accounts/expenses").then(data => {
      if (Array.isArray(data)) setExpenseData(data);
    }).catch(() => {});
  }, []);

  // ── Student fee data — students prop থেকে (যদি fees embedded থাকে) ──
  const studentFeeRows = (students || []).flatMap(s =>
    (s.fees?.payments || []).map(p => ({
      paymentId: p.id, studentId: s.id, studentName: s.name_en,
      date: p.date || "", amount: p.amount || 0, category: p.category, method: p.method, note: p.note || "",
    }))
  ).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  // Per-student summary
  const studentFeeSummary = (students || []).map(s => {
    const totalDue = (s.fees?.items || []).reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalCollected = (s.fees?.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    return { id: s.id, name: s.name_en, status: s.status, branch: s.branch, totalDue, totalCollected, balance: totalDue - totalCollected };
  });

  const catBreakdown = {};
  studentFeeRows.forEach(r => { catBreakdown[r.category] = (catBreakdown[r.category] || 0) + r.amount; });

  const studentCollected = studentFeeRows.reduce((s, r) => s + r.amount, 0);
  const studentDue = studentFeeSummary.reduce((s, r) => s + Math.max(0, r.balance), 0);

  // income API data: paid_amount (DB) বা paidAmount (legacy)
  const totalIncome = incomeData.reduce((s, i) => s + (i.paid_amount || i.paidAmount || i.amount || 0), 0) + studentCollected;
  const totalExpense = expenseData.reduce((s, e) => s + (e.amount || 0), 0);
  const totalDue = incomeData.reduce((s, i) => s + (i.amount - i.paidAmount), 0) + studentDue;
  const totalTax = incomeData.filter((i) => i.status === "paid" || i.status === "partial").reduce((s, i) => s + i.tax, 0);
  const profit = totalIncome - totalExpense;
  const fmt = (v) => v >= 100000 ? `৳${(v / 100000).toFixed(1)}L` : v >= 1000 ? `৳${(v / 1000).toFixed(0)}K` : `৳${v}`;

  const collectPayment = (incId) => {
    setIncomeData(prev => prev.map(inc => {
      if (inc.id !== incId) return inc;
      const installmentAmt = Math.round(inc.amount / inc.installments);
      const newPaid = inc.paid + 1;
      const newPaidAmount = Math.min(inc.paidAmount + installmentAmt, inc.amount);
      const status = newPaidAmount >= inc.amount ? "paid" : "partial";
      return { ...inc, paid: newPaid, paidAmount: newPaidAmount, status };
    }));
    toast.success("কিস্তি কালেক্ট হয়েছে!");
  };

  const [showExportMenu, setShowExportMenu] = useState(false);
  const doExportIncome = () => {
    const rows = incomeData.map(r => `"${r.studentName}","${r.studentId}","${CATEGORY_CONFIG[r.category]?.label || r.category}",${r.amount},${r.paidAmount},${r.tax},"${r.status}","${r.dueDate || ""}"`);
    const csv = "স্টুডেন্ট,ID,খাত,মোট,পরিশোধিত,ট্যাক্স,স্ট্যাটাস,Due Date\n" + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `Income_${new Date().toISOString().slice(0,10)}.csv` }).click();
    toast.exported(`Income (${incomeData.length} records)`);
  };
  const doExportExpense = () => {
    const rows = expenseData.map(r => `"${r.date}","${CATEGORY_CONFIG[r.category]?.label || r.category}","${r.description}",${r.amount}`);
    const csv = "তারিখ,খাত,বিবরণ,পরিমাণ\n" + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `Expense_${new Date().toISOString().slice(0,10)}.csv` }).click();
    toast.exported(`Expense (${expenseData.length} records)`);
  };
  const doExportPL = () => {
    const csv = `P&L Report — ${new Date().toISOString().slice(0,10)}\n\nমোট আয়,${totalIncome}\nমোট ব্যয়,${totalExpense}\nনেট লাভ,${profit}\nট্যাক্স,${totalTax}\nবাকি,${totalDue}`;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `PL_Report_${new Date().toISOString().slice(0,10)}.csv` }).click();
    toast.exported("P&L Report");
  };

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Accounts & Finance</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>আয়, ব্যয়, ট্যাক্স ও লাভ-ক্ষতি</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button variant="ghost" icon={Download} size="xs" onClick={() => setShowExportMenu(v => !v)}>Export ▾</Button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden min-w-[170px]" style={{ background: t.cardSolid, border: `1px solid ${t.border}`, boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}>
                {[
                  { label: "💰 Income CSV", fn: doExportIncome },
                  { label: "💸 Expense CSV", fn: doExportExpense },
                  { label: "📊 P&L Report", fn: doExportPL },
                ].map(({ label, fn }) => (
                  <button key={label} onClick={() => { fn(); setShowExportMenu(false); }} className="w-full px-4 py-2.5 text-xs text-left transition"
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <Button icon={Plus} onClick={() => setShowAddMenu(v => !v)}>নতুন এন্ট্রি ▾</Button>
            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden min-w-[180px]" style={{ background: t.cardSolid, border: `1px solid ${t.border}`, boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}>
                <button onClick={() => { setShowAddForm("income"); setActiveTab("income"); setShowAddMenu(false); }} className="w-full flex items-center gap-2 px-4 py-3 text-xs text-left transition"
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ color: t.emerald }}>💰</span> আয় এন্ট্রি
                </button>
                <button onClick={() => { setShowAddForm("expense"); setActiveTab("expense"); setShowAddMenu(false); }} className="w-full flex items-center gap-2 px-4 py-3 text-xs text-left transition"
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ color: t.rose }}>💸</span> ব্যয় এন্ট্রি
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "মোট আয়", value: fmt(totalIncome), color: t.emerald, icon: TrendingUp },
          { label: "মোট ব্যয়", value: fmt(totalExpense), color: t.rose, icon: TrendingDown },
          { label: "লাভ", value: fmt(profit), color: profit > 0 ? t.emerald : t.rose, icon: DollarSign },
          { label: "বকেয়া", value: fmt(totalDue), color: t.amber, icon: Clock },
          { label: "ট্যাক্স (15%)", value: fmt(totalTax), color: t.purple, icon: FileText },
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

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "student_fees", label: "🎓 স্টুডেন্ট ফি" },
          { key: "income", label: "💰 অন্যান্য আয়" },
          { key: "expense", label: "💸 ব্যয়" },
          { key: "dues", label: "⏰ বকেয়া" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
            style={{ background: activeTab === tab.key ? (t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#ffffff") : "transparent", color: activeTab === tab.key ? t.text : t.muted, boxShadow: activeTab === tab.key && t.mode === "light" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {showAddForm && (
        <AddEntryForm
          type={showAddForm}
          onCancel={() => setShowAddForm(null)}
          onSave={(entry) => {
            if (showAddForm === "income") {
              setIncomeData(prev => [entry, ...prev]);
              toast.success("আয় এন্ট্রি যোগ হয়েছে!");
            } else {
              setExpenseData(prev => [entry, ...prev]);
              toast.success("ব্যয় এন্ট্রি যোগ হয়েছে!");
            }
            setShowAddForm(null);
          }}
        />
      )}

      {activeTab === "overview" && (
        <div className="grid grid-cols-12 gap-5">
          <Card className="col-span-12 lg:col-span-8" delay={200}>
            <h3 className="text-sm font-semibold mb-4">Monthly P&L</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MONTHLY_REVENUE}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
                <XAxis dataKey="month" tick={{ fill: t.chartAxisTick, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: t.chartAxisTick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: t.text }} formatter={(v) => [fmt(v)]} />
                <Bar dataKey="income" fill={t.emerald} radius={[4, 4, 0, 0]} barSize={20} name="আয়" />
                <Bar dataKey="expense" fill={t.rose} radius={[4, 4, 0, 0]} barSize={20} name="ব্যয়" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="col-span-12 lg:col-span-4" delay={250}>
            <h3 className="text-sm font-semibold mb-4">আয়ের খাত (স্টুডেন্ট ফি)</h3>
            <div className="space-y-2.5">
              {Object.entries(catBreakdown).length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: t.muted }}>কোনো পেমেন্ট রেকর্ড নেই</p>
              ) : Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                const conf = CATEGORY_CONFIG[cat] || { label: cat, color: "#94a3b8", icon: "💰" };
                const pct = Math.round((amount / Math.max(studentCollected, 1)) * 100);
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1.5"><span>{conf.icon}</span><span style={{ color: t.textSecondary }}>{conf.label}</span></span>
                      <span className="font-semibold">{fmt(amount)} <span style={{ color: t.muted }}>({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${t.muted}15` }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: conf.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "student_fees" && (
        <div className="space-y-5">
          {/* Category breakdown */}
          <Card delay={80}>
            <h3 className="text-sm font-semibold mb-4">খাত অনুযায়ী আয় (স্টুডেন্ট ফি)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {FEE_CATEGORIES.map(cat => {
                const collected = catBreakdown[cat.id] || 0;
                const totalCharged = studentFeeSummary.flatMap(s =>
                  (students.find(st => st.id === s.id)?.fees?.items || []).filter(i => i.category === cat.id)
                ).reduce((sum, i) => sum + i.amount, 0);
                if (!totalCharged && !collected) return null;
                const pct = totalCharged > 0 ? Math.min(100, (collected / totalCharged) * 100) : 100;
                return (
                  <div key={cat.id} className="p-3 rounded-xl" style={{ background: t.inputBg }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span>{cat.icon}</span>
                      <span className="text-[11px] font-semibold flex-1">{cat.label}</span>
                    </div>
                    <p className="text-base font-bold" style={{ color: cat.color }}>৳{collected.toLocaleString()}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>মোট: ৳{totalCharged.toLocaleString()}</p>
                    <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: t.border }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </Card>

          {/* Per-student summary */}
          <Card delay={100}>
            <h3 className="text-sm font-semibold mb-3">স্টুডেন্ট ওয়াইজ সারসংক্ষেপ</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["স্টুডেন্ট", "Branch", "মোট নির্ধারিত", "কালেক্ট হয়েছে", "বাকি", "অগ্রগতি"].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentFeeSummary.map(row => {
                    const pct = row.totalDue > 0 ? Math.min(100, (row.totalCollected / row.totalDue) * 100) : 0;
                    return (
                      <tr key={row.id} style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td className="py-3 px-3">
                          <p className="font-medium">{row.name}</p>
                          <p className="text-[9px]" style={{ color: t.muted }}>{row.id}</p>
                        </td>
                        <td className="py-3 px-3 text-[10px]" style={{ color: t.muted }}>{row.branch || "—"}</td>
                        <td className="py-3 px-3 font-mono font-semibold">৳{row.totalDue.toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono font-semibold" style={{ color: t.emerald }}>৳{row.totalCollected.toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono" style={{ color: row.balance > 0 ? t.rose : t.muted }}>{row.balance > 0 ? `৳${row.balance.toLocaleString()}` : "—"}</td>
                        <td className="py-3 px-3 min-w-[100px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: t.border }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? t.emerald : pct >= 50 ? t.cyan : t.amber }} />
                            </div>
                            <span style={{ color: t.muted }}>{Math.round(pct)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Payment transaction log */}
          <Card delay={120}>
            <h3 className="text-sm font-semibold mb-3">পেমেন্ট লেজার (সর্বশেষ)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["তারিখ", "স্টুডেন্ট", "খাত", "পদ্ধতি", "পরিমাণ", "নোট"].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentFeeRows.slice(0, 50).map(row => {
                    const cat = CATEGORY_CONFIG[row.category] || { label: row.category, color: "#94a3b8", icon: "💰" };
                    return (
                      <tr key={row.paymentId} style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td className="py-2.5 px-3 font-mono text-[10px]" style={{ color: t.muted }}>{row.date}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-medium">{row.studentName}</p>
                          <p className="text-[9px]" style={{ color: t.muted }}>{row.studentId}</p>
                        </td>
                        <td className="py-2.5 px-3"><Badge color={cat.color} size="xs">{cat.icon} {cat.label}</Badge></td>
                        <td className="py-2.5 px-3 text-[10px]" style={{ color: t.muted }}>{row.method}</td>
                        <td className="py-2.5 px-3 font-semibold font-mono" style={{ color: t.emerald }}>৳{row.amount.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-[10px]" style={{ color: t.muted }}>{row.note || "—"}</td>
                      </tr>
                    );
                  })}
                  {studentFeeRows.length === 0 && (
                    <tr><td colSpan="6" className="py-6 text-center text-xs" style={{ color: t.muted }}>কোনো পেমেন্ট রেকর্ড নেই</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "income" && (
        <Card delay={100}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["স্টুডেন্ট", "ক্যাটাগরি", "মোট", "ট্যাক্স", "পরিশোধিত", "বাকি", "কিস্তি", "স্ট্যাটাস"].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incomeData.map((inc) => {
                  const cat = CATEGORY_CONFIG[inc.category];
                  const due = inc.amount - inc.paidAmount;
                  return (
                    <tr key={inc.id} style={{ borderBottom: `1px solid ${t.border}` }}
                      onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td className="py-3 px-3">
                        <p className="font-medium">{inc.studentName}</p>
                        <p className="text-[9px]" style={{ color: t.muted }}>{inc.studentId}</p>
                      </td>
                      <td className="py-3 px-3"><Badge color={cat?.color || t.muted} size="xs">{cat?.icon} {cat?.label}</Badge></td>
                      <td className="py-3 px-3 font-semibold font-mono">৳{inc.amount.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono" style={{ color: inc.tax > 0 ? t.purple : t.muted }}>{inc.tax > 0 ? `৳${inc.tax.toLocaleString()}` : "—"}</td>
                      <td className="py-3 px-3 font-semibold font-mono" style={{ color: t.emerald }}>৳{inc.paidAmount.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono" style={{ color: due > 0 ? t.amber : t.muted }}>{due > 0 ? `৳${due.toLocaleString()}` : "—"}</td>
                      <td className="py-3 px-3" style={{ color: t.textSecondary }}>{inc.paid}/{inc.installments}</td>
                      <td className="py-3 px-3">
                        <Badge color={inc.status === "paid" ? t.emerald : inc.status === "partial" ? t.amber : t.rose} size="xs">
                          {inc.status === "paid" ? "পরিশোধিত" : inc.status === "partial" ? "আংশিক" : "অপরিশোধিত"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "expense" && (
        <Card delay={100}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["তারিখ", "ক্যাটাগরি", "বিবরণ", "পরিমাণ"].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...expenseData].sort((a, b) => b.date.localeCompare(a.date)).map((exp) => {
                  const cat = CATEGORY_CONFIG[exp.category];
                  return (
                    <tr key={exp.id} style={{ borderBottom: `1px solid ${t.border}` }}
                      onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td className="py-3 px-3 font-mono text-[11px]" style={{ color: t.textSecondary }}>{exp.date}</td>
                      <td className="py-3 px-3"><Badge color={cat?.color || t.muted} size="xs">{cat?.icon} {cat?.label}</Badge></td>
                      <td className="py-3 px-3" style={{ color: t.textSecondary }}>{exp.description}</td>
                      <td className="py-3 px-3 font-semibold font-mono" style={{ color: t.rose }}>৳{exp.amount.toLocaleString()}</td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop: `2px solid ${t.border}` }}>
                  <td colSpan="3" className="py-3 px-3 text-right font-semibold">মোট খরচ:</td>
                  <td className="py-3 px-3 font-bold font-mono" style={{ color: t.rose }}>৳{totalExpense.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "dues" && (
        <Card delay={100}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">বকেয়া পেমেন্ট</h3>
            <Badge color={t.rose}>{incomeData.filter((i) => i.status !== "paid").length} জন</Badge>
          </div>
          <div className="space-y-3">
            {incomeData.filter((i) => i.status !== "paid").sort((a, b) => (a.dueDate || "z").localeCompare(b.dueDate || "z")).map((inc) => {
              const due = inc.amount - inc.paidAmount;
              const cat = CATEGORY_CONFIG[inc.category];
              const isOverdue = inc.dueDate && new Date(inc.dueDate) < new Date();
              const canCollect = inc.paid < inc.installments;
              return (
                <div key={inc.id} className="flex items-center gap-4 p-3.5 rounded-xl transition-all" style={{ background: isOverdue ? `${t.rose}06` : "transparent", border: `1px solid ${isOverdue ? `${t.rose}20` : t.border}` }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{inc.studentName}</p>
                      <Badge color={cat?.color} size="xs">{cat?.label}</Badge>
                      {isOverdue && <Badge color={t.rose} size="xs">Overdue!</Badge>}
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>
                      কিস্তি: {inc.paid}/{inc.installments} পরিশোধিত
                      {inc.dueDate && ` • Due: ${inc.dueDate}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono" style={{ color: t.amber }}>৳{due.toLocaleString()}</p>
                    <p className="text-[9px]" style={{ color: t.muted }}>বাকি</p>
                  </div>
                  {canCollect ? (
                    <button onClick={() => collectPayment(inc.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-medium transition shrink-0 flex items-center gap-1"
                      style={{ background: `${t.emerald}15`, color: t.emerald }}>
                      <Check size={11} /> কালেক্ট
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg text-[10px] font-medium shrink-0" style={{ background: `${t.muted}10`, color: t.muted }}>Done</span>
                  )}
                </div>
              );
            })}
            {incomeData.filter((i) => i.status !== "paid").length === 0 && (
              <div className="text-center py-8" style={{ color: t.muted }}>
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm">সমস্ত পেমেন্ট সম্পন্ন!</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
