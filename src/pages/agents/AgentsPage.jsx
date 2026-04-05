import React, { useState, useEffect } from "react";
import { Plus, Briefcase, Users, CheckCircle, Clock, Phone, MapPin, Save, X, Search, ChevronDown, ChevronRight, Edit3, Trash2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import PhoneInput, { formatPhoneDisplay } from "../../components/ui/PhoneInput";
import { api } from "../../hooks/useAPI";
import useSortable from "../../hooks/useSortable";
import SortHeader from "../../components/ui/SortHeader";
import Pagination from "../../components/ui/Pagination";

export default function AgentsPage() {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
  const [agents, setAgents] = useState([]);

  // ── Backend থেকে agents load ──
  useEffect(() => {
    api.get("/agents").then(data => {
      if (Array.isArray(data)) setAgents(data.map(a => ({ ...a, students: a.students || [], commissionPerStudent: a.commission_per_student || 0 })));
    }).catch((err) => { console.error("[Agents Load]", err); toast.error("এজেন্ট ডাটা লোড করতে সমস্যা হয়েছে"); });
  }, []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", area: "", nid: "", bank: "", commissionPerStudent: "10000" });
  const [payingAgentId, setPayingAgentId] = useState(null);
  const [payForm, setPayForm] = useState({ amount: "", method: "Bank Transfer", note: "" });
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedId, setExpandedId] = useState(null);
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("name");
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  const totalReferred = agents.reduce((s, a) => s + a.students.length, 0);
  const totalFeeDue = agents.reduce((s, a) => s + a.students.filter((st) => !st.feePaid).length * a.commissionPerStudent, 0);
  const totalFeePaid = agents.reduce((s, a) => s + a.students.filter((st) => st.feePaid).length * a.commissionPerStudent, 0);

  // ── ফিল্টার, সর্ট, পেজিনেশন লজিক ──
  const filtered = agents
    .map(a => ({ ...a, referredCount: a.students.length }))
    .filter(a => !searchQ || a.name.toLowerCase().includes(searchQ.toLowerCase()) || (a.area || "").toLowerCase().includes(searchQ.toLowerCase()));
  const sorted = sortFn(filtered);
  const safePage = Math.min(page, Math.max(1, Math.ceil(sorted.length / pageSize)));
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">এজেন্ট</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>এজেন্ট ও শোকাই ফি ম্যানেজমেন্ট</p>
        </div>
        <Button icon={Plus} onClick={() => setShowForm(true)}>এজেন্ট যোগ করুন</Button>
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

      {/* ── এজেন্ট ফর্ম Modal ── */}
      <Modal isOpen={!!showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? "এজেন্ট সম্পাদনা" : "নতুন এজেন্ট যোগ করুন"} size="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "নাম *", key: "name", ph: "Agent name..." },
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
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ফোন *</label>
            <PhoneInput value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} size="md" />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" size="xs" icon={X} onClick={() => { setShowForm(false); setEditingId(null); }}>{tr("common.cancel")}</Button>
          <Button icon={Save} size="xs" onClick={async () => {
            if (!form.name.trim() || !form.phone.trim()) { toast.error("নাম ও ফোন দিন"); return; }
            const payload = { name: form.name, phone: form.phone, area: form.area, nid: form.nid, bank_name: form.bank, commission_per_student: parseInt(form.commissionPerStudent) || 10000, status: "active" };
            try {
              if (editingId) {
                const updated = await api.patch(`/agents/${editingId}`, payload);
                setAgents(prev => prev.map(a => a.id === editingId ? { ...a, ...updated, commissionPerStudent: updated.commission_per_student || a.commissionPerStudent } : a));
                toast.updated("এজেন্ট");
              } else {
                const saved = await api.post("/agents", payload);
                setAgents(prev => [...prev, { ...saved, students: [], commissionPerStudent: saved.commission_per_student }]);
                toast.success("এজেন্ট যোগ হয়েছে!");
              }
            } catch (err) { toast.error(err.message || "সেভ ব্যর্থ"); }
            setForm({ name: "", phone: "", area: "", nid: "", bank: "", commissionPerStudent: "10000" });
            setShowForm(false); setEditingId(null);
          }}>{tr("common.save")}</Button>
        </div>
      </Modal>

      {/* ── সার্চ বার ── */}
      <Card delay={100}>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
            <Search size={14} style={{ color: t.muted }} />
            <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1); }}
              className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
              placeholder={tr("common.search")} />
          </div>
        </div>
      </Card>

      {/* ── এজেন্ট টেবিল ── */}
      <Card delay={150}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium w-8" style={{ color: t.muted }}></th>
                <SortHeader label="নাম" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                <SortHeader label="এলাকা" sortKey="area" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>ফোন</th>
                <SortHeader label="রেফার করেছেন" sortKey="referredCount" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                <SortHeader label="কমিশন" sortKey="commissionPerStudent" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                <SortHeader label="স্ট্যাটাস" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>বাকি</th>
                <th className="text-right py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs" style={{ color: t.muted }}>কোনো এজেন্ট পাওয়া যায়নি</td>
                </tr>
              )}
              {paginated.map((agent) => {
                const totalFee = agent.students.length * agent.commissionPerStudent;
                const paidFee = agent.students.filter((s) => s.feePaid).length * agent.commissionPerStudent;
                const dueFee = totalFee - paidFee;
                const isExpanded = expandedId === agent.id;
                return (
                  <React.Fragment key={agent.id}>
                    {/* ── মূল সারি ── */}
                    <tr
                      style={{ borderBottom: `1px solid ${t.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* বিস্তারিত টগল */}
                      <td className="py-3 px-4">
                        {agent.students.length > 0 ? (
                          <button onClick={() => setExpandedId(isExpanded ? null : agent.id)} className="p-0.5 rounded" style={{ color: t.muted }}>
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        ) : <span style={{ width: 14, display: "inline-block" }} />}
                      </td>

                      {/* নাম */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                            {agent.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="font-semibold">{agent.name}</span>
                        </div>
                      </td>

                      {/* এলাকা */}
                      <td className="py-3 px-4" style={{ color: t.textSecondary }}>
                        <span className="flex items-center gap-1"><MapPin size={10} /> {agent.area || "—"}</span>
                      </td>

                      {/* ফোন */}
                      <td className="py-3 px-4" style={{ color: t.textSecondary }}>
                        <span className="flex items-center gap-1"><Phone size={10} /> {formatPhoneDisplay(agent.phone)}</span>
                      </td>

                      {/* রেফার করেছেন */}
                      <td className="py-3 px-4">
                        <span className="font-bold" style={{ color: t.cyan }}>{agent.students.length}</span>
                      </td>

                      {/* কমিশন */}
                      <td className="py-3 px-4 font-mono">
                        ৳{agent.commissionPerStudent.toLocaleString("en-IN")}
                      </td>

                      {/* স্ট্যাটাস */}
                      <td className="py-3 px-4">
                        <Badge color={agent.status === "active" ? t.emerald : t.muted} size="xs">
                          {agent.status === "active" ? tr("common.active") : tr("common.inactive")}
                        </Badge>
                      </td>

                      {/* বাকি */}
                      <td className="py-3 px-4">
                        <span className="font-bold font-mono" style={{ color: dueFee > 0 ? t.rose : t.emerald }}>
                          {dueFee > 0 ? `৳${(dueFee / 1000).toFixed(0)}K` : "✓"}
                        </span>
                      </td>

                      {/* অ্যাকশন */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 justify-end">
                          {dueFee > 0 && (
                            <button onClick={() => { setPayingAgentId(agent.id); setPayForm({ amount: String(dueFee), method: "Bank Transfer", note: "" }); }}
                              className="text-[10px] px-2.5 py-1.5 rounded-lg font-medium"
                              style={{ background: `${t.emerald}15`, color: t.emerald }}>
                              পরিশোধ
                            </button>
                          )}
                          <button onClick={() => {
                            setForm({ name: agent.name, phone: agent.phone, area: agent.area || "", nid: agent.nid || "", bank: agent.bank_name || "", commissionPerStudent: String(agent.commissionPerStudent || 10000) });
                            setEditingId(agent.id); setShowForm(true);
                          }} className="p-1.5 rounded-lg transition" style={{ color: t.muted }}
                            onMouseEnter={e => e.currentTarget.style.color = t.cyan}
                            onMouseLeave={e => e.currentTarget.style.color = t.muted}
                            title="সম্পাদনা">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(agent)}
                            className="p-1.5 rounded-lg transition" style={{ color: t.muted }}
                            onMouseEnter={e => e.currentTarget.style.color = t.rose}
                            onMouseLeave={e => e.currentTarget.style.color = t.muted}
                            title="মুছুন">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── বিস্তারিত: রেফার করা স্টুডেন্ট তালিকা ── */}
                    {isExpanded && agent.students.length > 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-3" style={{ background: t.hoverBg }}>
                          <div className="space-y-1.5 ml-8">
                            <p className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: t.muted }}>রেফার করা স্টুডেন্ট</p>
                            {agent.students.map((st) => (
                              <div key={st.id} className="flex items-center justify-between text-xs p-2 rounded-lg" style={{ background: t.card }}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{st.name}</span>
                                  <StatusBadge status={st.status} />
                                </div>
                                <Badge color={st.feePaid ? t.emerald : t.rose} size="xs">{st.feePaid ? "✓ পরিশোধিত" : "বাকি"}</Badge>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* ── কমিশন পেমেন্ট ফর্ম ── */}
                    {payingAgentId === agent.id && (
                      <tr>
                        <td colSpan={9} className="px-4 py-3" style={{ background: t.hoverBg }}>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end ml-8">
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
                              <Button variant="ghost" size="xs" onClick={() => setPayingAgentId(null)}>{tr("common.cancel")}</Button>
                              <Button icon={Save} size="xs" onClick={() => {
                                const amt = parseInt(payForm.amount);
                                if (!amt || amt <= 0) { toast.error("পরিমাণ দিন"); return; }
                                setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, commissionPaid: (a.commissionPaid || 0) + amt } : a));
                                setPayingAgentId(null);
                                toast.success(`৳${amt.toLocaleString()} — কমিশন পরিশোধ হয়েছে`);
                              }}>{tr("common.save")}</Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── পেজিনেশন ── */}
        <Pagination total={sorted.length} page={safePage} pageSize={pageSize}
          onPage={setPage} onPageSize={setPageSize} />
      </Card>

      {/* ── ডিলিট কনফার্ম মোডাল ── */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try { await api.patch(`/agents/${deleteTarget.id}`, { status: "inactive" }); setAgents(prev => prev.filter(a => a.id !== deleteTarget.id)); toast.success("এজেন্ট মুছে ফেলা হয়েছে"); }
          catch { toast.error("মুছতে ব্যর্থ"); }
          setDeleteTarget(null);
        }}
        itemName={deleteTarget?.name || ""}
      />
    </div>
  );
}
