import { useState, useEffect } from "react";
import { Plus, Briefcase, Users, CheckCircle, Clock, Phone, MapPin, DollarSign, Save, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { AGENTS_DATA } from "../../data/mockData";
import { api } from "../../hooks/useAPI";

export default function AgentsPage() {
  const t = useTheme();
  const toast = useToast();
  const [agents, setAgents] = useState(AGENTS_DATA);

  useEffect(() => {
    api.get("/agents").then(data => { if (Array.isArray(data) && data.length > 0) setAgents(data.map(a => ({ ...a, students: a.students || [], commissionPerStudent: a.commission_per_student || 0 }))); }).catch(() => {});
  }, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", area: "", nid: "", bank: "", commissionPerStudent: "10000" });
  const [payingAgentId, setPayingAgentId] = useState(null);
  const [payForm, setPayForm] = useState({ amount: "", method: "Bank Transfer", note: "" });
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  const totalReferred = agents.reduce((s, a) => s + a.students.length, 0);
  const totalFeeDue = agents.reduce((s, a) => s + a.students.filter((st) => !st.feePaid).length * a.commissionPerStudent, 0);
  const totalFeePaid = agents.reduce((s, a) => s + a.students.filter((st) => st.feePaid).length * a.commissionPerStudent, 0);

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Agents</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>এজেন্ট ও শোকাই ফি ম্যানেজমেন্ট</p>
        </div>
        <Button icon={Plus} onClick={() => setShowForm(true)}>Add Agent</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "মোট এজেন্ট", value: agents.filter((a) => a.status === "active").length, color: t.cyan, icon: Briefcase },
          { label: "মোট রেফার", value: totalReferred, color: t.purple, icon: Users },
          { label: "ফি দেওয়া হয়েছে", value: `৳${(totalFeePaid / 1000).toFixed(0)}K`, color: t.emerald, icon: CheckCircle },
          { label: "ফি বাকি আছে", value: `৳${(totalFeeDue / 1000).toFixed(0)}K`, color: t.rose, icon: Clock },
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

      {showForm && (
        <Card delay={0}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">নতুন Agent যোগ করুন</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="xs" icon={X} onClick={() => setShowForm(false)}>বাতিল</Button>
              <Button icon={Save} size="xs" onClick={async () => {
                if (!form.name.trim() || !form.phone.trim()) { toast.error("নাম ও ফোন দিন"); return; }
                const newAgent = { name: form.name, phone: form.phone, area: form.area, nid: form.nid, bank_name: form.bank, commission_per_student: parseInt(form.commissionPerStudent) || 10000, status: "active" };
                try { const saved = await api.post("/agents", newAgent); setAgents(prev => [...prev, { ...saved, students: [], commissionPerStudent: saved.commission_per_student }]); }
                catch { setAgents(prev => [...prev, { id: `AG-${Date.now()}`, ...form, commissionPerStudent: parseInt(form.commissionPerStudent) || 10000, status: "active", students: [] }]); }
                setForm({ name: "", phone: "", area: "", nid: "", bank: "", commissionPerStudent: "10000" });
                setShowForm(false);
                toast.success("Agent যোগ হয়েছে!");
              }}>Save</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: "নাম *", key: "name", ph: "Agent name..." },
              { label: "ফোন *", key: "phone", ph: "01XXXXXXXXX" },
              { label: "এলাকা", key: "area", ph: "ঢাকা, সিলেট..." },
              { label: "NID", key: "nid", ph: "NID নম্বর" },
              { label: "ব্যাংক অ্যাকাউন্ট", key: "bank", ph: "ব্যাংক ও A/C নম্বর" },
              { label: "কমিশন/স্টুডেন্ট (৳)", key: "commissionPerStudent", ph: "10000", type: "number" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label}</label>
                <input type={f.type || "text"} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder={f.ph} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {agents.map((agent, i) => {
          const totalFee = agent.students.length * agent.commissionPerStudent;
          const paidFee = agent.students.filter((s) => s.feePaid).length * agent.commissionPerStudent;
          const dueFee = totalFee - paidFee;
          const conversionRate = agent.students.length > 0 ? Math.round((agent.students.filter((s) => ["VISA_GRANTED", "ARRIVED", "COMPLETED"].includes(s.status)).length / agent.students.length) * 100) : 0;
          return (
            <Card key={agent.id} delay={200 + i * 60}>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                  {agent.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold">{agent.name}</p>
                    <Badge color={agent.status === "active" ? t.emerald : t.muted} size="xs">{agent.status === "active" ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]" style={{ color: t.textSecondary }}>
                    <span className="flex items-center gap-1"><Phone size={10} /> {agent.phone}</span>
                    <span className="flex items-center gap-1"><MapPin size={10} /> {agent.area}</span>
                    <span className="flex items-center gap-1"><DollarSign size={10} /> ৳{agent.commissionPerStudent.toLocaleString()}/student</span>
                  </div>

                  {agent.students.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {agent.students.map((st) => (
                        <div key={st.id} className="flex items-center justify-between text-xs p-2 rounded-lg" style={{ background: t.hoverBg }}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{st.name}</span>
                            <StatusBadge status={st.status} />
                          </div>
                          <Badge color={st.feePaid ? t.emerald : t.rose} size="xs">{st.feePaid ? "✓ Paid" : "Due"}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0 space-y-1.5">
                  <div>
                    <p className="text-[9px] uppercase" style={{ color: t.muted }}>রেফার</p>
                    <p className="text-lg font-bold" style={{ color: t.cyan }}>{agent.students.length}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase" style={{ color: t.muted }}>বাকি</p>
                    <p className="text-sm font-bold font-mono" style={{ color: dueFee > 0 ? t.rose : t.emerald }}>{dueFee > 0 ? `৳${(dueFee / 1000).toFixed(0)}K` : "✓"}</p>
                  </div>
                  {dueFee > 0 && (
                    <button onClick={() => { setPayingAgentId(agent.id); setPayForm({ amount: String(dueFee), method: "Bank Transfer", note: "" }); }}
                      className="text-[10px] px-2.5 py-1.5 rounded-lg font-medium"
                      style={{ background: `${t.emerald}15`, color: t.emerald }}>
                      💳 পরিশোধ
                    </button>
                  )}
                </div>
              </div>

              {/* Commission payment form */}
              {payingAgentId === agent.id && (
                <div className="mt-3 pt-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-end" style={{ borderTop: `1px solid ${t.border}` }}>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পরিমাণ (৳)</label>
                    <input type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পদ্ধতি</label>
                    <select value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                      <option>Bank Transfer</option><option>Cash</option><option>Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নোট</label>
                    <input value={payForm.note} onChange={e => setPayForm(p => ({ ...p, note: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="কমিশন পেমেন্ট..." />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="xs" onClick={() => setPayingAgentId(null)}>বাতিল</Button>
                    <Button icon={Save} size="xs" onClick={() => {
                      const amt = parseInt(payForm.amount);
                      if (!amt || amt <= 0) { toast.error("পরিমাণ দিন"); return; }
                      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, commissionPaid: (a.commissionPaid || 0) + amt } : a));
                      setPayingAgentId(null);
                      toast.success(`৳${amt.toLocaleString()} — কমিশন পরিশোধ হয়েছে`);
                    }}>সংরক্ষণ</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
