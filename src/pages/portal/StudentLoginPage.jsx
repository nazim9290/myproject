import { useState } from "react";
import { GraduationCap, Phone, Lock, AlertTriangle, ArrowLeft } from "lucide-react";
import { useTheme, getGlobalStyles } from "../../context/ThemeContext";
import { API_URL } from "../../lib/api";

/**
 * StudentLoginPage — স্টুডেন্ট পোর্টাল লগইন
 * ফোন নম্বর + পাসওয়ার্ড দিয়ে লগইন করবে
 * Admin portal access enable করলেই student login করতে পারবে
 */
export default function StudentLoginPage({ onLogin, onBackToStaff }) {
  const t = useTheme();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // API_URL — centralized import থেকে আসে

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) { setError("ফোন নম্বর ও পাসওয়ার্ড দিন"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/student-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "লগইন ব্যর্থ");

      // Token ও user info save
      localStorage.setItem("agencyos_student_token", data.token);
      localStorage.setItem("agencyos_student_user", JSON.stringify(data.user));
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center" style={{ background: t.bg }}>
      <style>{getGlobalStyles(t)}</style>
      <div className="relative w-full max-w-sm mx-4">
        {/* গ্লো ইফেক্ট */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${t.emerald}, transparent)` }} />

        <div className="relative anim-fade rounded-2xl border p-8" style={{ background: t.card, borderColor: t.border }}>
          {/* লোগো */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-3"
              style={{ background: `linear-gradient(135deg, ${t.emerald}, ${t.cyan})` }}>
              <GraduationCap size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">স্টুডেন্ট পোর্টাল</h1>
            <p className="text-xs mt-1" style={{ color: t.muted }}>আপনার তথ্য পূরণ ও অগ্রগতি দেখুন</p>
          </div>

          {/* ফর্ম */}
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
                style={{ background: `${t.rose}15`, border: `1px solid ${t.rose}30`, color: t.rose }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: t.muted }}>ফোন নম্বর</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                <Phone size={14} style={{ color: t.muted }} />
                <input value={phone} onChange={e => { setPhone(e.target.value); setError(""); }}
                  className="flex-1 bg-transparent text-sm outline-none" style={{ color: t.text }}
                  placeholder="01XXXXXXXXX" onKeyDown={e => e.key === "Enter" && handleLogin()} />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: t.muted }}>পাসওয়ার্ড</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                <Lock size={14} style={{ color: t.muted }} />
                <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                  className="flex-1 bg-transparent text-sm outline-none" style={{ color: t.text }}
                  placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} />
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${t.emerald}, ${t.cyan})` }}>
              {loading ? "লগইন হচ্ছে..." : "লগইন করুন"}
            </button>
          </div>

          {/* স্টাফ লগইনে ফিরে যান */}
          <button onClick={onBackToStaff}
            className="flex items-center justify-center gap-1.5 w-full mt-4 text-[11px] py-2 rounded-lg transition"
            style={{ color: t.muted }}
            onMouseEnter={e => e.currentTarget.style.color = t.cyan}
            onMouseLeave={e => e.currentTarget.style.color = t.muted}>
            <ArrowLeft size={12} /> স্টাফ লগইন
          </button>

          <p className="text-center text-[10px] mt-4" style={{ color: t.muted }}>
            পোর্টাল অ্যাক্সেস পেতে আপনার এজেন্সিতে যোগাযোগ করুন
          </p>
        </div>
      </div>
    </div>
  );
}
