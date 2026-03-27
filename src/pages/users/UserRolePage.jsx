import { useState } from "react";
import { Plus, Users, CheckCircle, Layers, Building2, Save, X, MapPin, Phone, Mail, User, Shield, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import SortHeader from "../../components/ui/SortHeader";
import useSortable from "../../hooks/useSortable";
import { MOCK_USERS, ALL_ROLES, PERMISSION_MATRIX, INITIAL_BRANCHES, EMPLOYEES } from "../../data/mockData";

const EMPTY_USER = { name: "", email: "", phone: "", branch: "", password: "", roles: [] };
const EMPTY_BRANCH = { name: "", city: "", address: "", phone: "", manager: "" };

export default function UserRolePage() {
  const t = useTheme();
  const toast = useToast();
  const [users, setUsers] = useState(MOCK_USERS);
  const [branches, setBranches] = useState(INITIAL_BRANCHES);
  const [employees] = useState(EMPLOYEES);
  const [activeTab, setActiveTab] = useState("branches");
  const [editingUserId, setEditingUserId] = useState(null);

  // সার্চ ও সর্টিং স্টেট
  const [searchQ, setSearchQ] = useState("");
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("name");

  // User form
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState(EMPTY_USER);

  // Branch form
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchForm, setBranchForm] = useState(EMPTY_BRANCH);
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState(null);
  const [deleteBranchConfirm, setDeleteBranchConfirm] = useState(null);

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  // --- User actions ---
  const toggleRole = (userId, role) => {
    setUsers(prev => prev.map((u) =>
      u.id === userId
        ? { ...u, roles: u.roles.includes(role) ? u.roles.filter((r) => r !== role) : [...u.roles, role] }
        : u
    ));
    toast.updated("Role");
  };

  const saveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim()) { toast.error("নাম ও ইমেইল দিন"); return; }
    if (!userForm.branch) { toast.error("ব্রাঞ্চ নির্বাচন করুন"); return; }
    if (userForm.roles.length === 0) { toast.error("কমপক্ষে একটি রোল দিন"); return; }
    setUsers((prev) => [...prev, {
      id: `U-${String(prev.length + 1).padStart(3, "0")}`,
      ...userForm,
      status: "active",
      lastLogin: "—",
    }]);
    setUserForm(EMPTY_USER);
    setShowUserForm(false);
    toast.success("ইউজার যোগ হয়েছে!");
  };

  const deleteUser = (id) => {
    if (deleteUserConfirm !== id) { setDeleteUserConfirm(id); return; }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleteUserConfirm(null);
    toast.deleted("ইউজার মুছে ফেলা হয়েছে");
  };

  // --- Branch actions ---
  const openAddBranch = () => { setBranchForm(EMPTY_BRANCH); setEditingBranchId(null); setShowBranchForm(true); };
  const openEditBranch = (br) => { setBranchForm({ ...br }); setEditingBranchId(br.id); setShowBranchForm(true); };

  const saveBranch = () => {
    if (!branchForm.name.trim() || !branchForm.city.trim()) { toast.error("নাম ও শহর দিন"); return; }
    if (editingBranchId) {
      setBranches((prev) => prev.map((b) => b.id === editingBranchId ? { ...b, ...branchForm } : b));
      toast.updated("ব্রাঞ্চ আপডেট হয়েছে!");
    } else {
      setBranches((prev) => [...prev, { id: `BR-${String(prev.length + 1).padStart(3, "0")}`, ...branchForm, status: "active", createdAt: new Date().toISOString().slice(0, 10) }]);
      toast.success("ব্রাঞ্চ তৈরি হয়েছে!");
    }
    setShowBranchForm(false);
    setBranchForm(EMPTY_BRANCH);
    setEditingBranchId(null);
  };

  const deleteBranch = (id) => {
    const empCount = employees.filter((e) => e.branch === branches.find((b) => b.id === id)?.name).length;
    if (empCount > 0) { toast.error(`এই branch-এ ${empCount} জন কর্মী আছেন — আগে তাদের স্থানান্তর করুন`); return; }
    if (deleteBranchConfirm !== id) { setDeleteBranchConfirm(id); return; }
    setBranches((prev) => prev.filter((b) => b.id !== id));
    setDeleteBranchConfirm(null);
    toast.deleted("ব্রাঞ্চ মুছে ফেলা হয়েছে");
  };

  // Permission matrix state (Role → Module → { read, write, del })
  const MODULES = [
    { key: "dashboard", label: "ড্যাশবোর্ড" },
    { key: "visitors", label: "ভিজিটর" },
    { key: "students", label: "স্টুডেন্ট" },
    { key: "documents", label: "ডকুমেন্টস" },
    { key: "accounts", label: "একাউন্টস" },
    { key: "reports", label: "রিপোর্ট" },
    { key: "settings", label: "সেটিংস" },
    { key: "users", label: "ইউজার" },
  ];
  const PERM_ROLES = Object.keys(PERMISSION_MATRIX);
  const initMatrix = () => {
    const m = {};
    PERM_ROLES.forEach((role) => {
      m[role] = {};
      MODULES.forEach(({ key }) => {
        const has = PERMISSION_MATRIX[role]?.[key] || false;
        const isAdmin = role === "Owner";
        const isMgr = role === "Branch Manager";
        m[role][key] = {
          read: has,
          write: has && (isAdmin || isMgr),
          del: has && isAdmin,
        };
      });
    });
    return m;
  };
  const [permMatrix, setPermMatrix] = useState(initMatrix);
  const togglePerm = (role, module, perm) => {
    setPermMatrix((prev) => ({
      ...prev,
      [role]: { ...prev[role], [module]: { ...prev[role][module], [perm]: !prev[role][module][perm] } },
    }));
  };

  const managers = employees.filter((e) => ["Owner", "Branch Manager"].includes(e.role));
  const tabs = [
    { key: "branches", label: "🏢 ব্রাঞ্চ" },
    { key: "users", label: "👥 ইউজার" },
    { key: "permissions", label: "🔐 অনুমতি" },
  ];

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">ইউজার ও ব্রাঞ্চ</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>শাখা ব্যবস্থাপনা, ইউজার ও রোল কন্ট্রোল</p>
        </div>
        {activeTab === "branches" && <Button icon={Plus} onClick={openAddBranch}>নতুন ব্রাঞ্চ</Button>}
        {activeTab === "users" && <Button icon={Plus} onClick={() => setShowUserForm(true)}>ইউজার যোগ করুন</Button>}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "মোট ব্রাঞ্চ", value: branches.filter((b) => b.status === "active").length, color: t.cyan, icon: Building2 },
          { label: "মোট ইউজার", value: users.length, color: t.purple, icon: Users },
          { label: "সক্রিয় ইউজার", value: users.filter((u) => u.status === "active").length, color: t.emerald, icon: CheckCircle },
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
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchQ(""); }}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab === tab.key ? `${t.cyan}15` : "transparent",
              color: activeTab === tab.key ? t.cyan : t.muted,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============ BRANCHES TAB ============ */}
      {activeTab === "branches" && (() => {
        // Branch ফিল্টার
        const bq = searchQ.toLowerCase();
        const filteredBranches = branches.filter((br) =>
          !bq || br.name.toLowerCase().includes(bq) || br.city.toLowerCase().includes(bq)
          || (br.manager || "").toLowerCase().includes(bq)
        );

        return (
        <>
          {/* Branch form */}
          {showBranchForm && (
            <Card delay={0}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">{editingBranchId ? "ব্রাঞ্চ সম্পাদনা" : "নতুন ব্রাঞ্চ তৈরি করুন"}</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="xs" icon={X} onClick={() => { setShowBranchForm(false); setEditingBranchId(null); }}>বাতিল</Button>
                  <Button size="xs" icon={Save} onClick={saveBranch}>সংরক্ষণ</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ব্রাঞ্চ নাম <span className="req-star">*</span></label>
                  <input value={branchForm.name} onChange={(e) => setBranchForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="যেমন: ঢাকা (HQ), সিলেট" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>শহর <span className="req-star">*</span></label>
                  <input value={branchForm.city} onChange={(e) => setBranchForm((p) => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="ঢাকা, চট্টগ্রাম..." />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ঠিকানা</label>
                  <input value={branchForm.address} onChange={(e) => setBranchForm((p) => ({ ...p, address: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="পূর্ণ ঠিকানা..." />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ফোন</label>
                  <input value={branchForm.phone} onChange={(e) => setBranchForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="02-XXXXXXX" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ব্রাঞ্চ ম্যানেজার</label>
                  <select value={branchForm.manager} onChange={(e) => setBranchForm((p) => ({ ...p, manager: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option value="">— নির্বাচন করুন —</option>
                    {managers.map((m) => <option key={m.id} value={m.name}>{m.name} ({m.role})</option>)}
                    {employees.filter((e) => !managers.includes(e)).map((e) => <option key={e.id} value={e.name}>{e.name} ({e.role})</option>)}
                  </select>
                </div>
              </div>
            </Card>
          )}

          {/* সার্চ বার */}
          <Card delay={50}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <Search size={14} style={{ color: t.muted }} />
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
                placeholder="ব্রাঞ্চ নাম, শহর বা ম্যানেজার দিয়ে খুঁজুন..." />
            </div>
          </Card>

          {/* Branch list */}
          {filteredBranches.length === 0 && (
            <Card delay={100}>
              <p className="text-center py-6 text-xs" style={{ color: t.muted }}>কোনো ব্রাঞ্চ পাওয়া যায়নি</p>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBranches.map((br, i) => {
              const branchEmployees = employees.filter((e) => e.branch === br.name);
              const branchUsers = users.filter((u) => u.branch === br.name);
              return (
                <Card key={br.id} delay={i * 60}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                        style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                        {br.city.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{br.name}</p>
                        <p className="text-[10px]" style={{ color: t.muted }}>{br.city}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditBranch(br)} className="p-1.5 rounded-lg transition"
                        style={{ color: t.muted }} onMouseEnter={(e) => e.currentTarget.style.color = t.cyan} onMouseLeave={(e) => e.currentTarget.style.color = t.muted}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteBranch(br.id)} className="p-1.5 rounded-lg transition"
                        style={{ color: t.muted }} onMouseEnter={(e) => e.currentTarget.style.color = t.rose} onMouseLeave={(e) => e.currentTarget.style.color = t.muted}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] mb-3" style={{ color: t.textSecondary }}>
                    {br.address && <p className="flex items-center gap-1.5"><MapPin size={10} style={{ color: t.muted }} />{br.address}</p>}
                    {br.phone && <p className="flex items-center gap-1.5"><Phone size={10} style={{ color: t.muted }} />{br.phone}</p>}
                    {br.manager && <p className="flex items-center gap-1.5"><User size={10} style={{ color: t.muted }} />ম্যানেজার: <span className="font-medium">{br.manager}</span></p>}
                  </div>

                  <div className="flex gap-3 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold" style={{ color: t.purple }}>{branchEmployees.length}</p>
                      <p className="text-[9px] uppercase" style={{ color: t.muted }}>কর্মচারী</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold" style={{ color: t.cyan }}>{branchUsers.length}</p>
                      <p className="text-[9px] uppercase" style={{ color: t.muted }}>সিস্টেম ইউজার</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-[10px] font-bold" style={{ color: t.emerald }}>{br.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</p>
                      <p className="text-[9px] uppercase" style={{ color: t.muted }}>স্ট্যাটাস</p>
                    </div>
                  </div>

                  {deleteBranchConfirm === br.id && (
                    <div className="flex items-center gap-3 p-3 rounded-xl mt-3"
                      style={{ background: `${t.rose}10`, border: `1px solid ${t.rose}30` }}>
                      <AlertTriangle size={16} style={{ color: t.rose }} />
                      <div className="flex-1">
                        <p className="text-xs font-semibold" style={{ color: t.rose }}>মুছে ফেলবেন?</p>
                        <p className="text-[10px]" style={{ color: t.muted }}>এই কাজ undo করা যাবে না</p>
                      </div>
                      <button onClick={() => setDeleteBranchConfirm(null)} className="text-xs px-2 py-1" style={{ color: t.muted }}>না</button>
                      <button onClick={() => deleteBranch(br.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{ background: t.rose, color: "#fff" }}>হ্যাঁ, মুছুন</button>
                    </div>
                  )}

                  {branchEmployees.length > 0 && (
                    <div className="mt-3 pt-3 space-y-1" style={{ borderTop: `1px solid ${t.border}` }}>
                      <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: t.muted }}>কর্মচারী তালিকা</p>
                      {branchEmployees.map((emp) => (
                        <div key={emp.id} className="flex items-center justify-between text-xs">
                          <span className="font-medium">{emp.name}</span>
                          <Badge color={emp.role === "Owner" ? t.rose : emp.role === "Branch Manager" ? t.purple : t.cyan} size="xs">{emp.role}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
        );
      })()}

      {/* ============ USERS TAB ============ */}
      {activeTab === "users" && (() => {
        // ইউজার ফিল্টার ও সর্ট
        const q = searchQ.toLowerCase();
        const filteredUsers = users.filter((u) =>
          !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
          || u.branch.toLowerCase().includes(q) || u.roles.join(" ").toLowerCase().includes(q)
        );
        const sortedUsers = sortFn(filteredUsers);

        return (
        <>
          {/* Add User form */}
          {showUserForm && (
            <Card delay={0}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">নতুন সিস্টেম ইউজার যোগ করুন</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="xs" icon={X} onClick={() => { setShowUserForm(false); setUserForm(EMPTY_USER); }}>বাতিল</Button>
                  <Button size="xs" icon={Save} onClick={saveUser}>সংরক্ষণ</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}><User size={9} className="inline mr-1" />নাম <span className="req-star">*</span></label>
                  <input value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="পুরো নাম" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}><Mail size={9} className="inline mr-1" />ইমেইল <span className="req-star">*</span></label>
                  <input value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="user@agency.com" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}><Phone size={9} className="inline mr-1" />ফোন</label>
                  <input value={userForm.phone} onChange={(e) => setUserForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="01XXXXXXXXX" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}><Building2 size={9} className="inline mr-1" />ব্রাঞ্চ <span className="req-star">*</span></label>
                  <select value={userForm.branch} onChange={(e) => setUserForm((p) => ({ ...p, branch: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                    <option value="">— ব্রাঞ্চ নির্বাচন করুন —</option>
                    {branches.filter((b) => b.status === "active").map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পাসওয়ার্ড</label>
                  <input type="password" value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-2" style={{ color: t.muted }}><Shield size={9} className="inline mr-1" />রোল * (এক বা একাধিক)</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_ROLES.map((role) => {
                    const has = userForm.roles.includes(role);
                    return (
                      <button key={role}
                        onClick={() => setUserForm((p) => ({ ...p, roles: has ? p.roles.filter((r) => r !== role) : [...p.roles, role] }))}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition"
                        style={{ background: has ? `${t.emerald}20` : t.inputBg, color: has ? t.emerald : t.muted, border: `1px solid ${has ? `${t.emerald}40` : t.inputBorder}` }}>
                        {has ? "✓ " : ""}{role}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* সার্চ বার */}
          <Card delay={50}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <Search size={14} style={{ color: t.muted }} />
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
                placeholder="নাম, ইমেইল, Branch বা Role দিয়ে খুঁজুন..." />
            </div>
          </Card>

          {/* Users টেবিল */}
          <Card delay={100}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <SortHeader label="নাম" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                    <SortHeader label="ইমেইল" sortKey="email" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                    <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>পদবি</th>
                    <SortHeader label="ব্রাঞ্চ" sortKey="branch" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                    <SortHeader label="স্ট্যাটাস" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                    <th className="text-right py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-xs" style={{ color: t.muted }}>কোনো ইউজার পাওয়া যায়নি</td>
                    </tr>
                  )}
                  {sortedUsers.map((user) => (
                    <tr key={user.id} style={{ borderBottom: `1px solid ${t.border}` }}
                      onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      {/* নাম */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      {/* ইমেইল */}
                      <td className="py-3 px-4" style={{ color: t.textSecondary }}>{user.email}</td>
                      {/* পদবি / Roles */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge key={role} color={role === "Owner" ? t.rose : role.includes("Manager") ? t.purple : t.cyan} size="xs">{role}</Badge>
                          ))}
                        </div>
                      </td>
                      {/* Branch */}
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1" style={{ color: t.textSecondary }}>
                          <Building2 size={11} style={{ color: t.muted }} />{user.branch}
                        </span>
                      </td>
                      {/* স্ট্যাটাস */}
                      <td className="py-3 px-4">
                        <Badge color={user.status === "active" ? t.emerald : t.muted} size="xs">{user.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>
                      </td>
                      {/* অ্যাকশন */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="xs" onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}>
                            রোল
                          </Button>
                          <button onClick={() => deleteUser(user.id)} className="p-1.5 rounded-lg transition"
                            style={{ color: t.muted }} onMouseEnter={(e) => e.currentTarget.style.color = t.rose} onMouseLeave={(e) => e.currentTarget.style.color = t.muted}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {deleteUserConfirm === user.id && (
                      <tr>
                        <td colSpan={6} className="py-0 px-4">
                          <div className="flex items-center gap-3 p-3 rounded-xl my-2"
                            style={{ background: `${t.rose}10`, border: `1px solid ${t.rose}30` }}>
                            <AlertTriangle size={16} style={{ color: t.rose }} />
                            <div className="flex-1">
                              <p className="text-xs font-semibold" style={{ color: t.rose }}>মুছে ফেলবেন?</p>
                              <p className="text-[10px]" style={{ color: t.muted }}>এই কাজ undo করা যাবে না</p>
                            </div>
                            <button onClick={() => setDeleteUserConfirm(null)} className="text-xs px-2 py-1" style={{ color: t.muted }}>না</button>
                            <button onClick={() => deleteUser(user.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium"
                              style={{ background: t.rose, color: "#fff" }}>হ্যাঁ, মুছুন</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  ))}
                </tbody>
              </table>
            </div>

            {/* Role editing panel — সিলেক্ট করা ইউজারের জন্য */}
            {editingUserId && (() => {
              const user = users.find((u) => u.id === editingUserId);
              if (!user) return null;
              return (
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.muted }}>
                    <span className="font-semibold" style={{ color: t.text }}>{user.name}</span> — Role ক্লিক করে assign/remove:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_ROLES.map((role) => {
                      const has = user.roles.includes(role);
                      return (
                        <button key={role} onClick={() => toggleRole(user.id, role)}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition"
                          style={{ background: has ? `${t.emerald}20` : t.inputBg, color: has ? t.emerald : t.muted, border: `1px solid ${has ? `${t.emerald}40` : t.inputBorder}` }}>
                          {has ? "✓ " : ""}{role}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </Card>
        </>
        );
      })()}

      {/* ============ PERMISSIONS TAB ============ */}
      {activeTab === "permissions" && (
        <Card delay={100}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold">অনুমতি ম্যাট্রিক্স</h3>
              <p className="text-[11px] mt-0.5" style={{ color: t.muted }}>R = পড়া, W = লেখা, D = মুছা — ক্লিক করে toggle করুন</p>
            </div>
            <Button icon={Save} size="xs" onClick={() => toast.success("অনুমতি সংরক্ষণ হয়েছে!")}>সংরক্ষণ</Button>
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
                {PERM_ROLES.map((role) => (
                  <tr key={role} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td className="py-2.5 px-3">
                      <Badge color={role === "Owner" ? t.rose : role.includes("Manager") ? t.purple : t.cyan} size="xs">{role}</Badge>
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
                            ].map(({ k, label, activeColor }) => {
                              const on = cell[k];
                              return (
                                <button key={k} onClick={() => togglePerm(role, key, k)}
                                  className="w-5 h-5 rounded text-[8px] font-bold transition"
                                  style={{ background: on ? `${activeColor}25` : `${t.muted}10`, color: on ? activeColor : `${t.muted}60`, border: `1px solid ${on ? `${activeColor}40` : "transparent"}` }}
                                  title={`${role} — ${key} — ${label}`}>
                                  {label}
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

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            {[
              { label: "পড়া (R)", color: t.emerald },
              { label: "লেখা (W)", color: t.amber },
              { label: "মুছা (D)", color: t.rose },
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
