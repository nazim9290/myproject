import { useState, useEffect } from "react";
import { Plus, Users, CheckCircle, Layers, Building2, Save, X, MapPin, Phone, Mail, User, Shield, Pencil, Trash2, Search } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PhoneInput from "../../components/ui/PhoneInput";
import SortHeader from "../../components/ui/SortHeader";
import useSortable from "../../hooks/useSortable";
import { users as usersApi, auth } from "../../lib/api";

/**
 * UserRolePage — ইউজার, ব্রাঞ্চ ও রোল ম্যানেজমেন্ট
 * API থেকে real data — CRUD
 */

const ALL_ROLES = ["owner", "admin", "branch_manager", "counselor", "accountant", "teacher", "viewer"];
const ROLE_LABELS = { owner: "মালিক", admin: "অ্যাডমিন", branch_manager: "ব্রাঞ্চ ম্যানেজার", counselor: "কাউন্সেলর", accountant: "একাউন্ট্যান্ট", teacher: "শিক্ষক", viewer: "ভিউয়ার" };

const MODULES = [
  { key: "dashboard", label: "Dashboard" }, { key: "visitors", label: "Visitors" },
  { key: "students", label: "Students" }, { key: "documents", label: "Documents" },
  { key: "accounts", label: "Accounts" }, { key: "reports", label: "Reports" },
  { key: "settings", label: "Settings" }, { key: "users", label: "Users" },
];

const EMPTY_USER = { name: "", email: "", phone: "", branch: "", password: "", role: "counselor" };

export default function UserRolePage() {
  const t = useTheme();
  const toast = useToast();

  // ── Data state ──
  const [usersList, setUsersList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [editingUserId, setEditingUserId] = useState(null);

  // ── Search, sort ──
  const [searchQ, setSearchQ] = useState("");
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("name");

  // ── User form ──
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [saving, setSaving] = useState(false);

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  // ── API থেকে data লোড ──
  const loadData = async () => {
    try {
      const [usersData, branchData] = await Promise.all([
        usersApi.list(),
        usersApi.branches(),
      ]);
      setUsersList(Array.isArray(usersData) ? usersData : []);
      setBranches(Array.isArray(branchData) ? branchData : []);
    } catch (err) {
      console.error("Users load error:", err);
      toast.error("ইউজার ডাটা লোড করতে সমস্যা হয়েছে");
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // ── User CRUD ──
  const saveUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) { toast.error("নাম ও ইমেইল দিন"); return; }
    if (!userForm.password || userForm.password.length < 6) { toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর"); return; }
    setSaving(true);
    try {
      await auth.register({
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        role: userForm.role || "counselor",
        branch: userForm.branch || "",
      });
      toast.success("User যোগ হয়েছে!");
      setShowUserForm(false);
      setUserForm(EMPTY_USER);
      loadData();
    } catch (err) {
      toast.error(err.message || "সমস্যা হয়েছে");
    }
    setSaving(false);
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await usersApi.update(userId, { role: newRole });
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.updated("Role");
    } catch (err) {
      toast.error(err.message || "আপডেট করতে সমস্যা");
    }
  };

  const toggleUserActive = async (userId, isActive) => {
    try {
      await usersApi.update(userId, { is_active: !isActive });
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, is_active: !isActive } : u));
      toast.updated("User");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Password Reset ──
  const [resetPasswordId, setResetPasswordId] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const resetPassword = async () => {
    if (newPassword.length < 8) { toast.error("Password কমপক্ষে ৮ অক্ষর"); return; }
    try {
      await usersApi.update(resetPasswordId, { password: newPassword });
      toast.success("পাসওয়ার্ড রিসেট হয়েছে");
      setResetPasswordId(null); setNewPassword("");
    } catch (err) { toast.error(err.message || "রিসেট ব্যর্থ"); }
  };

  const deleteUser = async (id) => {
    try {
      await usersApi.remove(id);
      setUsersList(prev => prev.filter(u => u.id !== id));
      toast.success("User মুছে ফেলা হয়েছে");
    } catch (err) {
      toast.error(err.message || "মুছতে সমস্যা");
    }
  };

  // ── Permission matrix (local state — save button-এ API-তে পাঠাবে) ──
  const initMatrix = () => {
    const m = {};
    ALL_ROLES.forEach(role => {
      m[role] = {};
      MODULES.forEach(({ key }) => {
        const isAdmin = role === "owner" || role === "admin";
        const isMgr = role === "branch_manager";
        m[role][key] = {
          read: true,
          write: isAdmin || isMgr || key === "visitors" || key === "students",
          del: isAdmin,
        };
      });
    });
    return m;
  };
  const [permMatrix, setPermMatrix] = useState(initMatrix);
  const togglePerm = (role, module, perm) => {
    setPermMatrix(prev => ({
      ...prev,
      [role]: { ...prev[role], [module]: { ...prev[role][module], [perm]: !prev[role][module][perm] } },
    }));
  };

  const tabs = [
    { key: "users", label: "👥 ইউজার" },
    { key: "branches", label: "🏢 ব্রাঞ্চ" },
    { key: "permissions", label: "🔐 পারমিশন" },
  ];

  // ── ফিল্টার ──
  const q = searchQ.toLowerCase();
  const filteredUsers = usersList.filter(u =>
    !q || (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
    || (u.branch || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q)
  );
  const sortedUsers = sortFn(filteredUsers);

  const activeUsers = usersList.filter(u => u.is_active !== false).length;

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">ইউজার ও রোল</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>শাখা ব্যবস্থাপনা, ইউজার ও রোল কন্ট্রোল</p>
        </div>
        {activeTab === "users" && <Button icon={Plus} onClick={() => setShowUserForm(true)}>নতুন User</Button>}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "মোট ব্রাঞ্চ", value: branches.length, color: t.cyan, icon: Building2 },
          { label: "মোট ইউজার", value: usersList.length, color: t.purple, icon: Users },
          { label: "সক্রিয় ইউজার", value: activeUsers, color: t.emerald, icon: CheckCircle },
          { label: "মোট রোল", value: ALL_ROLES.length, color: t.amber, icon: Layers },
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchQ(""); }}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab === tab.key ? (t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#ffffff") : "transparent",
              color: activeTab === tab.key ? t.text : t.muted,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ USERS TAB ═══ */}
      {activeTab === "users" && (
        <>
          {/* Add User Form */}
          {showUserForm && (
            <Card delay={0}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">নতুন System User যোগ করুন</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="xs" icon={X} onClick={() => { setShowUserForm(false); setUserForm(EMPTY_USER); }}>বাতিল</Button>
                  <Button size="xs" icon={Save} onClick={saveUser} disabled={saving}>{saving ? "..." : "সংরক্ষণ"}</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: "name", label: "নাম *", ph: "পুরো নাম", icon: User },
                  { key: "email", label: "ইমেইল *", ph: "user@agency.com", icon: Mail },
                  { key: "password", label: "পাসওয়ার্ড *", ph: "কমপক্ষে ৬ অক্ষর", type: "password" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label}</label>
                    <input type={f.type || "text"} value={userForm[f.key]}
                      onChange={e => setUserForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder={f.ph} />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ফোন</label>
                  <PhoneInput value={userForm.phone} onChange={v => setUserForm(p => ({ ...p, phone: v }))} size="md" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Branch</label>
                  <select value={userForm.branch} onChange={e => setUserForm(p => ({ ...p, branch: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option value="">— নির্বাচন করুন —</option>
                    {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Role</label>
                  <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>
            </Card>
          )}

          {/* Search */}
          <Card delay={50}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <Search size={14} style={{ color: t.muted }} />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
                placeholder="নাম, ইমেইল, Branch বা Role দিয়ে খুঁজুন..." />
            </div>
          </Card>

          {/* Users Table */}
          <Card delay={100}>
            {loading ? (
              <div className="py-10 text-center text-xs" style={{ color: t.muted }}>লোড হচ্ছে...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      <SortHeader label="নাম" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      <SortHeader label="ইমেইল" sortKey="email" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      <SortHeader label="Role" sortKey="role" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      <SortHeader label="Branch" sortKey="branch" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                      <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>স্ট্যাটাস</th>
                      <th className="text-right py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-8 text-xs" style={{ color: t.muted }}>কোনো ইউজার পাওয়া যায়নি</td></tr>
                    )}
                    {sortedUsers.map(user => (
                      <tr key={user.id} style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                              style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                              {(user.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4" style={{ color: t.textSecondary }}>{user.email}</td>
                        <td className="py-3 px-4">
                          <Badge color={user.role === "owner" ? t.rose : user.role === "admin" ? t.purple : t.cyan} size="xs">
                            {ROLE_LABELS[user.role] || user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1" style={{ color: t.textSecondary }}>
                            <Building2 size={11} style={{ color: t.muted }} />{user.branch || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => toggleUserActive(user.id, user.is_active !== false)}>
                            <Badge color={user.is_active !== false ? t.emerald : t.muted} size="xs">
                              {user.is_active !== false ? "Active" : "Inactive"}
                            </Badge>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="xs" onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}>
                              Role
                            </Button>
                            <button onClick={() => { setResetPasswordId(resetPasswordId === user.id ? null : user.id); setNewPassword(""); }}
                              className="p-1.5 rounded-lg text-[10px] transition"
                              style={{ color: t.amber }}
                              title="পাসওয়ার্ড রিসেট">
                              🔑
                            </button>
                            <button onClick={() => toggleUserActive(user.id, user.is_active)}
                              className="p-1.5 rounded-lg transition"
                              style={{ color: user.is_active !== false ? t.emerald : t.muted }}
                              title={user.is_active !== false ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}>
                              {user.is_active !== false ? "✅" : "⏸️"}
                            </button>
                            <button onClick={() => deleteUser(user.id)} className="p-1.5 rounded-lg transition"
                              style={{ color: t.muted }} onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                              onMouseLeave={e => e.currentTarget.style.color = t.muted}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                          {/* Password reset inline */}
                          {resetPasswordId === user.id && (
                            <div className="flex items-center gap-2 mt-2 p-2 rounded-lg" style={{ background: `${t.amber}10`, border: `1px solid ${t.amber}30` }}>
                              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                placeholder="নতুন পাসওয়ার্ড (৮+ অক্ষর)" className="flex-1 px-2 py-1 rounded text-xs outline-none"
                                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                              <button onClick={resetPassword} className="px-2 py-1 rounded text-xs font-medium"
                                style={{ background: t.amber, color: "#000" }}>রিসেট</button>
                              <button onClick={() => setResetPasswordId(null)} className="text-xs" style={{ color: t.muted }}>✕</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Role editing panel */}
            {editingUserId && (() => {
              const user = usersList.find(u => u.id === editingUserId);
              if (!user) return null;
              return (
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.muted }}>
                    <span className="font-semibold" style={{ color: t.text }}>{user.name}</span> — Role পরিবর্তন:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_ROLES.map(role => {
                      const has = user.role === role;
                      return (
                        <button key={role} onClick={() => updateUserRole(user.id, role)}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition"
                          style={{ background: has ? `${t.emerald}20` : t.inputBg, color: has ? t.emerald : t.muted,
                            border: `1px solid ${has ? `${t.emerald}40` : t.inputBorder}` }}>
                          {has ? "✓ " : ""}{ROLE_LABELS[role]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </Card>
        </>
      )}

      {/* ═══ BRANCHES TAB ═══ */}
      {activeTab === "branches" && (
        <>
          {loading ? (
            <Card><div className="py-10 text-center text-xs" style={{ color: t.muted }}>লোড হচ্ছে...</div></Card>
          ) : branches.length === 0 ? (
            <Card><div className="py-10 text-center text-xs" style={{ color: t.muted }}>কোনো Branch পাওয়া যায়নি</div></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((br, i) => (
                <Card key={br.name} delay={i * 60}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                      {br.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{br.name}</p>
                      <p className="text-[10px]" style={{ color: t.muted }}>Branch</p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold" style={{ color: t.purple }}>{br.employeeCount || 0}</p>
                      <p className="text-[9px] uppercase" style={{ color: t.muted }}>কর্মচারী</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold" style={{ color: t.cyan }}>{br.userCount || 0}</p>
                      <p className="text-[9px] uppercase" style={{ color: t.muted }}>System User</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold" style={{ color: t.emerald }}>{br.studentCount || 0}</p>
                      <p className="text-[9px] uppercase" style={{ color: t.muted }}>স্টুডেন্ট</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ PERMISSIONS TAB ═══ */}
      {activeTab === "permissions" && (
        <Card delay={100}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold">পারমিশন ম্যাট্রিক্স</h3>
              <p className="text-[11px] mt-0.5" style={{ color: t.muted }}>R = দেখা, W = লেখা, D = মুছা — ক্লিক করে toggle করুন</p>
            </div>
            <Button icon={Save} size="xs" onClick={async () => {
              try {
                // প্রতিটি role-specific user-এর জন্য permissions update
                // permMatrix → backend-এ agency-level settings হিসেবে save
                await api.post("/users/permissions", { permissions: permMatrix });
                toast.success("পারমিশন সংরক্ষণ হয়েছে!");
              } catch {
                // Fallback: প্রতিটি user-এর permissions individually update
                for (const user of usersList) {
                  const rolePerm = permMatrix[user.role];
                  if (rolePerm) {
                    try { await usersApi.update(user.id, { permissions: rolePerm }); } catch (err) { console.error("[Permission Update]", err); }
                  }
                }
                toast.success("পারমিশন সংরক্ষণ হয়েছে!");
              }
            }}>সংরক্ষণ</Button>
          </div>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  <th className="text-left py-2 px-3 text-[10px] uppercase font-medium" style={{ color: t.muted, minWidth: 140 }}>Role</th>
                  {MODULES.map(({ key, label }) => (
                    <th key={key} className="text-center py-2 px-1 text-[9px] uppercase font-medium" style={{ color: t.muted, minWidth: 72 }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_ROLES.map(role => (
                  <tr key={role} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td className="py-2.5 px-3">
                      <Badge color={role === "owner" ? t.rose : role === "admin" ? t.purple : t.cyan} size="xs">{ROLE_LABELS[role]}</Badge>
                    </td>
                    {MODULES.map(({ key }) => {
                      const cell = permMatrix[role]?.[key] || { read: false, write: false, del: false };
                      return (
                        <td key={key} className="py-2 px-1 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {[
                              { k: "read", label: "R", activeColor: t.emerald },
                              { k: "write", label: "W", activeColor: t.amber },
                              { k: "del", label: "D", activeColor: t.rose },
                            ].map(({ k, label: lbl, activeColor }) => {
                              const on = cell[k];
                              return (
                                <button key={k} onClick={() => togglePerm(role, key, k)}
                                  className="w-5 h-5 rounded text-[8px] font-bold transition"
                                  style={{ background: on ? `${activeColor}25` : `${t.muted}10`, color: on ? activeColor : `${t.muted}60`,
                                    border: `1px solid ${on ? `${activeColor}40` : "transparent"}` }}>
                                  {lbl}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            {[
              { label: "Read (R)", color: t.emerald },
              { label: "Write (W)", color: t.amber },
              { label: "Delete (D)", color: t.rose },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-[10px]" style={{ color: t.muted }}>
                <div className="h-2.5 w-2.5 rounded" style={{ background: `${color}25`, border: `1px solid ${color}40` }} />
                {label}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
