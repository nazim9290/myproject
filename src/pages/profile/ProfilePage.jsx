import { useState, useRef, useEffect } from "react";
import { Save, LogOut, Lock, Eye, EyeOff, Bell, Globe, Shield, Camera, User, Phone, Mail, Briefcase, Building2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { API_URL } from "../../lib/api";

export default function ProfilePage({ currentUser, setCurrentUser, onLogout, isDark, setIsDark }) {
  const t = useTheme();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [info, setInfo] = useState({ ...currentUser });
  const [passwords, setPasswords] = useState({ old: "", next: "", confirm: "" });
  const [showOld, setShowOld] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
  const initials = (info.name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || "");
  // currentUser update হলে avatar sync
  useEffect(() => { if (currentUser.avatar_url) setAvatarUrl(currentUser.avatar_url); }, [currentUser.avatar_url]);

  // ── প্রোফাইল ছবি আপলোড ──
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("ফাইল সাইজ সর্বোচ্চ 2MB"); return; }
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const token = localStorage.getItem("agencyos_token");
      const res = await fetch(`${API_URL}/auth/upload-avatar`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await res.json();
      if (res.ok && data.avatar_url) {
        setAvatarUrl(data.avatar_url);
        setCurrentUser(prev => ({ ...prev, avatar_url: data.avatar_url }));
        toast.success("ছবি আপলোড হয়েছে!");
      } else { toast.error(data.error || "আপলোড ব্যর্থ"); }
    } catch { toast.error("আপলোড করতে সমস্যা হয়েছে"); }
  };

  const saveProfile = async () => {
    try {
      const token = localStorage.getItem("agencyos_token");
      const res = await fetch(`${API_URL}/users/${currentUser.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: info.name, phone: info.phone }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(prev => ({ ...prev, ...data }));
        toast.success("প্রোফাইল আপডেট হয়েছে!");
      } else { toast.error("আপডেট ব্যর্থ"); }
    } catch { toast.error("সার্ভার ত্রুটি"); }
  };

  const changePassword = async () => {
    if (!passwords.old) { toast.error("পুরানো পাসওয়ার্ড দিন"); return; }
    if (passwords.next.length < 8) { toast.error("নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে"); return; }
    if (passwords.next !== passwords.confirm) { toast.error("পাসওয়ার্ড দুটি মিলছে না"); return; }
    try {
      const token = localStorage.getItem("agencyos_token");
      const res = await fetch(`${API_URL}/users/${currentUser.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: passwords.next }),
      });
      if (res.ok) {
        setPasswords({ old: "", next: "", confirm: "" });
        toast.success("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!");
      } else { const d = await res.json(); toast.error(d.error || "পরিবর্তন ব্যর্থ"); }
    } catch { toast.error("সার্ভার ত্রুটি"); }
  };

  const savePrefs = () => {
    setCurrentUser((prev) => ({ ...prev, notifications: info.notifications, language: info.language }));
    toast.success("পছন্দ সংরক্ষণ হয়েছে!");
  };

  const tabs = [
    { key: "profile", label: "প্রোফাইল" },
    { key: "security", label: "নিরাপত্তা" },
    { key: "preferences", label: "পছন্দ" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 anim-fade">

      {/* Profile header */}
      <Card delay={0}>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl.startsWith("http") ? avatarUrl : `${API_URL.replace("/api", "")}${avatarUrl}`}
                alt="Avatar" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, #06b6d4, #a855f7)" }}>
                {initials}
              </div>
            )}
            <input ref={avatarRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleAvatarUpload} className="hidden" />
            <button
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center shadow"
              style={{ background: t.cyan, color: "#fff" }}
              title="ছবি পরিবর্তন"
              onClick={() => avatarRef.current?.click()}
            >
              <Camera size={11} />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{currentUser.name}</h2>
            <p className="text-xs mt-0.5 truncate" style={{ color: t.muted }}>
              {currentUser.email} · {currentUser.branch || "Main"}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${t.cyan}20`, color: t.cyan }}>
                {{ owner: "মালিক", admin: "অ্যাডমিন", branch_manager: "ব্রাঞ্চ ম্যানেজার", counselor: "কাউন্সেলর", super_admin: "সুপার অ্যাডমিন" }[currentUser.role] || currentUser.role}
              </span>
              <span className="text-[10px]" style={{ color: t.muted }}>
                যোগদান: {(currentUser.created_at || currentUser.joined || "").slice(0, 10)}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition"
            style={{ background: "#ef444415", color: "#ef4444", border: "1px solid #ef444430" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#ef444425")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ef444415")}
          >
            <LogOut size={13} /> লগআউট
          </button>
        </div>
      </Card>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: activeTab === tab.key
                ? t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#fff"
                : "transparent",
              color: activeTab === tab.key ? t.text : t.muted,
              boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* === PROFILE TAB === */}
      {activeTab === "profile" && (
        <Card delay={50}>
          <h3 className="text-sm font-bold mb-4">ব্যক্তিগত তথ্য</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>
                <User size={9} className="inline mr-1" />পুরো নাম (ইংরেজি)
              </label>
              <input
                value={info.name}
                onChange={(e) => setInfo((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={is}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>
                <User size={9} className="inline mr-1" />নাম (বাংলা)
              </label>
              <input
                value={info.name_bn}
                onChange={(e) => setInfo((p) => ({ ...p, name_bn: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={is}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>
                <Mail size={9} className="inline mr-1" />ইমেইল
              </label>
              <input
                value={info.email}
                onChange={(e) => setInfo((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={is}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>
                <Phone size={9} className="inline mr-1" />ফোন নম্বর
              </label>
              <input
                value={info.phone}
                onChange={(e) => setInfo((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={is}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>
                <Briefcase size={9} className="inline mr-1" />পদবি / Designation
              </label>
              <input
                value={info.designation}
                onChange={(e) => setInfo((p) => ({ ...p, designation: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={is}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>
                <Building2 size={9} className="inline mr-1" />শাখা / Branch
              </label>
              <input
                value={info.branch}
                onChange={(e) => setInfo((p) => ({ ...p, branch: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={is}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ভূমিকা / Role</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${t.cyan}20`, color: t.cyan }}>{info.role}</span>
                <span className="text-[10px]" style={{ color: t.muted }}>— Admin দ্বারা নিয়ন্ত্রিত</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-5">
            <Button icon={Save} onClick={saveProfile}>সংরক্ষণ করুন</Button>
          </div>
        </Card>
      )}

      {/* === SECURITY TAB === */}
      {activeTab === "security" && (
        <Card delay={50}>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Shield size={14} style={{ color: t.cyan }} /> পাসওয়ার্ড পরিবর্তন
          </h3>
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পুরানো পাসওয়ার্ড</label>
              <div className="flex items-center rounded-lg overflow-hidden" style={is}>
                <input
                  type={showOld ? "text" : "password"}
                  value={passwords.old}
                  onChange={(e) => setPasswords((p) => ({ ...p, old: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-transparent text-sm outline-none"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  data-form-type="other"
                />
                <button className="px-3 py-2" onClick={() => setShowOld((v) => !v)} style={{ color: t.muted }}>
                  {showOld ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নতুন পাসওয়ার্ড</label>
              <div className="flex items-center rounded-lg overflow-hidden" style={is}>
                <input
                  type={showNext ? "text" : "password"}
                  value={passwords.next}
                  onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-transparent text-sm outline-none"
                  placeholder="কমপক্ষে ৮ অক্ষর"
                  autoComplete="new-password"
                  data-form-type="other"
                />
                <button className="px-3 py-2" onClick={() => setShowNext((v) => !v)} style={{ color: t.muted }}>
                  {showNext ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {passwords.next.length > 0 && (
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{
                        background: passwords.next.length >= i * 3
                          ? i <= 1 ? "#ef4444" : i <= 2 ? "#f59e0b" : i <= 3 ? "#06b6d4" : "#10b981"
                          : t.inputBorder,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                autoComplete="new-password"
                data-form-type="other"
                style={{
                  ...is,
                  border: passwords.confirm && passwords.confirm !== passwords.next
                    ? "1px solid #ef4444"
                    : is.border,
                }}
                placeholder="••••••••"
              />
              {passwords.confirm && passwords.confirm !== passwords.next && (
                <p className="text-[10px] mt-1" style={{ color: "#ef4444" }}>পাসওয়ার্ড মিলছে না</p>
              )}
            </div>
            <Button icon={Lock} onClick={changePassword}>পাসওয়ার্ড পরিবর্তন করুন</Button>
          </div>
        </Card>
      )}

      {/* === PREFERENCES TAB === */}
      {activeTab === "preferences" && (
        <Card delay={50}>
          <h3 className="text-sm font-bold mb-4">অ্যাপ পছন্দ</h3>
          <div className="space-y-1">

            {/* Theme */}
            <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
              <div>
                <p className="text-sm font-medium">থিম</p>
                <p className="text-[11px] mt-0.5" style={{ color: t.muted }}>Dark বা Light মোড বেছে নিন</p>
              </div>
              <div className="flex gap-1 p-1 rounded-lg" style={{ background: t.inputBg }}>
                {["dark", "light"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setIsDark(mode === "dark")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: (isDark ? "dark" : "light") === mode
                        ? t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#fff"
                        : "transparent",
                      color: (isDark ? "dark" : "light") === mode ? t.text : t.muted,
                    }}
                  >
                    {mode === "dark" ? "🌙 ডার্ক" : "☀️ লাইট"}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Bell size={13} style={{ color: t.cyan }} /> নোটিফিকেশন
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: t.muted }}>Follow-up ও deadline রিমাইন্ডার</p>
              </div>
              <button
                onClick={() => setInfo((p) => ({ ...p, notifications: !p.notifications }))}
                className="relative h-6 w-11 rounded-full transition-all duration-300 shrink-0"
                style={{ background: info.notifications ? t.cyan : t.inputBorder }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300"
                  style={{ left: info.notifications ? "calc(100% - 1.375rem)" : "2px" }}
                />
              </button>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Globe size={13} style={{ color: t.cyan }} /> ভাষা / Language
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: t.muted }}>ইন্টারফেস ভাষা নির্বাচন করুন</p>
              </div>
              <select
                value={info.language || "bn"}
                onChange={(e) => setInfo((p) => ({ ...p, language: e.target.value }))}
                className="px-3 py-1.5 rounded-lg text-xs outline-none"
                style={is}
              >
                <option value="bn">বাংলা</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button icon={Save} onClick={savePrefs}>সংরক্ষণ করুন</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
