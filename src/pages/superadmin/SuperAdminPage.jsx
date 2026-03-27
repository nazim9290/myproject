import { useState, useEffect } from "react";
import { Building, Plus, Users, GraduationCap, TrendingUp, Edit3, Trash2, Save, X, Eye, Shield, Globe, Check, AlertTriangle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { API_URL } from "../../lib/api";

/**
 * SuperAdminPage — Platform-level agency management
 * শুধুমাত্র super_admin role দেখতে পাবে
 * Agency তৈরি, ম্যানেজ, plan পরিবর্তন, stats দেখা
 */

const PLANS = [
  { id: "free", label: "Free", color: "#94a3b8", limit: "২০ students, ২ users" },
  { id: "starter", label: "Starter", color: "#22d3ee", limit: "১০০ students, ৫ users" },
  { id: "pro", label: "Pro", color: "#a855f7", limit: "৫০০ students, ১৫ users" },
  { id: "enterprise", label: "Enterprise", color: "#f59e0b", limit: "Unlimited" },
];

export default function SuperAdminPage() {
  const t = useTheme();
  const toast = useToast();
  const token = localStorage.getItem("agencyos_token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [agencies, setAgencies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [detailAgency, setDetailAgency] = useState(null);

  const [form, setForm] = useState({
    name: "", name_bn: "", subdomain: "", phone: "", email: "", address: "",
    plan: "free", admin_name: "", admin_email: "", admin_password: "", dedicated: false,
  });

  // ── ডাটা লোড ──
  const loadData = async () => {
    try {
      const [agRes, stRes] = await Promise.all([
        fetch(`${API_URL}/super-admin/agencies`, { headers }),
        fetch(`${API_URL}/super-admin/stats`, { headers }),
      ]);
      if (agRes.ok) setAgencies(await agRes.json());
      if (stRes.ok) setStats(await stRes.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // ── Agency তৈরি ──
  const createAgency = async () => {
    if (!form.name.trim()) { toast.error("এজেন্সির নাম দিন"); return; }
    if (!form.subdomain.trim()) { toast.error("Subdomain দিন"); return; }
    if (!form.admin_email.trim()) { toast.error("Admin email দিন"); return; }
    if (!form.admin_password || form.admin_password.length < 6) { toast.error("Admin password কমপক্ষে ৬ অক্ষর"); return; }

    try {
      const res = await fetch(`${API_URL}/super-admin/agencies`, {
        method: "POST", headers, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "তৈরি ব্যর্থ"); return; }
      toast.success(`${form.name} — এজেন্সি তৈরি হয়েছে!`);
      setShowCreateForm(false);
      setForm({ name: "", name_bn: "", subdomain: "", phone: "", email: "", address: "", plan: "free", admin_name: "", admin_email: "", admin_password: "", dedicated: false });
      loadData();
    } catch { toast.error("সার্ভার ত্রুটি"); }
  };

  // ── Agency update ──
  const updateAgency = async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/super-admin/agencies/${id}`, {
        method: "PATCH", headers, body: JSON.stringify(updates),
      });
      if (res.ok) { toast.success("আপডেট হয়েছে"); loadData(); setEditingId(null); }
      else { const d = await res.json(); toast.error(d.error || "ব্যর্থ"); }
    } catch { toast.error("সার্ভার ত্রুটি"); }
  };

  // ── Agency delete ──
  const deleteAgency = async (id) => {
    try {
      const res = await fetch(`${API_URL}/super-admin/agencies/${id}`, { method: "DELETE", headers });
      if (res.ok) { toast.success("মুছে ফেলা হয়েছে"); loadData(); setDeleteConfirmId(null); }
      else { const d = await res.json(); toast.error(d.error || "ব্যর্থ"); }
    } catch { toast.error("সার্ভার ত্রুটি"); }
  };

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  if (loading) return <div className="text-center py-20 text-xs" style={{ color: t.muted }}>লোড হচ্ছে...</div>;

  return (
    <div className="space-y-5 anim-fade">
      {/* ── হেডার ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield size={20} style={{ color: t.purple }} /> Super Admin Panel
          </h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>সব এজেন্সি ম্যানেজমেন্ট — শুধু আপনার জন্য</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateForm(!showCreateForm)}>নতুন এজেন্সি</Button>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "মোট এজেন্সি", value: stats.totalAgencies, color: t.cyan, icon: Building },
            { label: "সক্রিয়", value: stats.activeAgencies, color: t.emerald, icon: Check },
            { label: "মোট স্টুডেন্ট", value: stats.totalStudents, color: t.purple, icon: GraduationCap },
            { label: "মোট User", value: stats.totalUsers, color: t.amber, icon: Users },
          ].map((kpi, i) => (
            <Card key={i} delay={i * 40}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                </div>
                <kpi.icon size={20} style={{ color: `${kpi.color}40` }} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Plan breakdown ── */}
      {stats && (
        <div className="flex gap-2">
          {PLANS.map(p => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: `${p.color}15`, color: p.color }}>
              <span className="font-bold">{stats.planBreakdown?.[p.id] || 0}</span>
              <span>{p.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── নতুন এজেন্সি তৈরি ── */}
      {showCreateForm && (
        <Card delay={0}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2"><Plus size={14} /> নতুন এজেন্সি তৈরি করুন</h3>
            <Button variant="ghost" size="xs" icon={X} onClick={() => setShowCreateForm(false)}>বাতিল</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>এজেন্সির নাম *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="ABC Education" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নাম (বাংলা)</label>
              <input value={form.name_bn} onChange={e => setForm(p => ({ ...p, name_bn: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="এবিসি এডুকেশন" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Subdomain * <span className="text-[9px] normal-case" style={{ color: t.cyan }}>.agencybook.net</span></label>
              <input value={form.subdomain} onChange={e => setForm(p => ({ ...p, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono" style={is} placeholder="abc-education" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ফোন</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ইমেইল</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="info@agency.com" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Plan</label>
              <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                {PLANS.map(p => <option key={p.id} value={p.id}>{p.label} — {p.limit}</option>)}
              </select>
            </div>
          </div>

          {/* Admin user */}
          <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.cyan }}>এজেন্সি Admin User</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Admin নাম</label>
              <input value={form.admin_name} onChange={e => setForm(p => ({ ...p, admin_name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Agency Owner" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Admin Email *</label>
              <input value={form.admin_email} onChange={e => setForm(p => ({ ...p, admin_email: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="owner@agency.com" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Password *</label>
              <input value={form.admin_password} onChange={e => setForm(p => ({ ...p, admin_password: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="কমপক্ষে ৬ অক্ষর" />
            </div>
          </div>

          {/* Dedicated toggle */}
          <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-4" style={{ background: t.inputBg }}>
            <input type="checkbox" checked={form.dedicated} onChange={e => setForm(p => ({ ...p, dedicated: e.target.checked }))}
              className="w-4 h-4 rounded" style={{ accentColor: t.purple }} />
            <div>
              <p className="text-xs font-semibold">Dedicated Mode</p>
              <p className="text-[10px]" style={{ color: t.muted }}>এই এজেন্সি নিজে কোনো sub-agency তৈরি করতে পারবে না — শুধু নিজের জন্য</p>
            </div>
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreateForm(false)}>বাতিল</Button>
            <Button icon={Save} onClick={createAgency}>এজেন্সি তৈরি করুন</Button>
          </div>
        </Card>
      )}

      {/* ── এজেন্সি তালিকা ── */}
      <Card delay={100}>
        <h3 className="text-sm font-semibold mb-4">সব এজেন্সি ({agencies.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                {["এজেন্সি", "Subdomain", "Plan", "Students", "Users", "Status", ""].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agencies.map(agency => {
                const planInfo = PLANS.find(p => p.id === agency.plan) || PLANS[0];
                const isDedicated = agency.settings?.dedicated;
                return (
                  <tr key={agency.id} style={{ borderBottom: `1px solid ${t.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: `${t.cyan}15`, color: t.cyan }}>
                          {(agency.name || "A").charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{agency.name}</p>
                          <p className="text-[9px]" style={{ color: t.muted }}>{agency.name_bn || ""} {isDedicated ? "• Dedicated" : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px]" style={{ color: t.cyan }}>{agency.subdomain}.agencybook.net</td>
                    <td className="py-3 px-4"><Badge color={planInfo.color} size="xs">{planInfo.label}</Badge></td>
                    <td className="py-3 px-4 font-mono font-bold">{agency.studentCount || 0}</td>
                    <td className="py-3 px-4 font-mono">{agency.userCount || 0}</td>
                    <td className="py-3 px-4">
                      <Badge color={agency.status === "active" ? t.emerald : agency.status === "suspended" ? t.rose : t.amber} size="xs">
                        {agency.status === "active" ? "সক্রিয়" : agency.status === "suspended" ? "স্থগিত" : agency.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <select value={agency.plan} onChange={e => updateAgency(agency.id, { plan: e.target.value })}
                          className="px-2 py-1 rounded text-[10px] outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                          {PLANS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                        {agency.status === "active" ? (
                          <button onClick={() => updateAgency(agency.id, { status: "suspended" })}
                            className="px-2 py-1 rounded text-[10px]" style={{ color: t.rose }}>স্থগিত</button>
                        ) : (
                          <button onClick={() => updateAgency(agency.id, { status: "active" })}
                            className="px-2 py-1 rounded text-[10px]" style={{ color: t.emerald }}>সক্রিয়</button>
                        )}
                        {deleteConfirmId === agency.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => deleteAgency(agency.id)} className="px-2 py-1 rounded text-[10px] text-white" style={{ background: t.rose }}>মুছুন</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 rounded text-[10px]" style={{ color: t.muted }}>না</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(agency.id)} style={{ color: t.muted }}><Trash2 size={12} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {agencies.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center" style={{ color: t.muted }}>কোনো এজেন্সি নেই — উপরে "নতুন এজেন্সি" থেকে তৈরি করুন</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
