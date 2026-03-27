import { useState, useEffect } from "react";
import { GraduationCap, Mail, Lock, AlertTriangle } from "lucide-react";
import { useTheme, getGlobalStyles } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ onLogin, onStudentLogin }) {
  const t = useTheme();
  const { login: authLogin } = useAuth();
  // ── Remember Me — base64 encode করে localStorage-এ রাখা (plaintext নয়) ──
  const remembered = (() => {
    try {
      const s = localStorage.getItem("agencybook_remember");
      return s ? JSON.parse(atob(s)) : null;
    } catch { return null; }
  })();
  const [email, setEmail] = useState(remembered?.e || "");
  const [password, setPassword] = useState(remembered?.p || "");
  const [rememberMe, setRememberMe] = useState(!!remembered);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-logout হলে message দেখাও
  useEffect(() => {
    const logoutReason = localStorage.getItem("agencyos_logout_reason");
    if (logoutReason) {
      localStorage.removeItem("agencyos_logout_reason");
      setError(logoutReason === "idle" ? "নিষ্ক্রিয়তার কারণে অটো লগআউট হয়েছে — আবার লগইন করুন" : "সেশন মেয়াদ শেষ — আবার লগইন করুন");
    }
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError("ইমেইল ও পাসওয়ার্ড দিন"); return; }
    setLoading(true);
    setError("");
    try {
      // AuthContext.login() saves token + user to localStorage
      const user = await authLogin(email, password);
      // Remember Me — সফল লগইনের পর credentials encode করে save
      if (rememberMe) {
        localStorage.setItem("agencybook_remember", btoa(JSON.stringify({ e: email, p: password })));
      } else {
        localStorage.removeItem("agencybook_remember");
      }
      onLogin(user);
    } catch (err) {
      setError(err.message || "লগইন ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center" style={{ background: t.bg, transition: "background 0.4s" }}>
      <style>{getGlobalStyles(t)}</style>
      <div className="relative w-full max-w-sm mx-4">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: `radial-gradient(circle, ${t.cyan}, transparent)` }} />

        <div className="relative anim-fade rounded-2xl border p-8" style={{ background: t.card, borderColor: t.border }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-3" style={{ background: `linear-gradient(135deg, ${t.cyan}, ${t.purple})` }}>
              <GraduationCap size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">AgencyBook</h1>
            <p className="text-xs opacity-40 mt-1">বিদেশে অধ্যয়ন ব্যবস্থাপনা সিস্টেম</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: `${t.rose}15`, border: `1px solid ${t.rose}30`, color: t.rose }}>
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
            <div>
              <label className="text-[10px] uppercase tracking-wider opacity-40 mb-1.5 block">ইমেইল</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 focus-within:border-cyan-500/30 transition">
                <Mail size={14} className="opacity-30" />
                <input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} className="flex-1 bg-transparent text-sm outline-none" placeholder="your@email.com" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider opacity-40 mb-1.5 block">পাসওয়ার্ড</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 focus-within:border-cyan-500/30 transition">
                <Lock size={14} className="opacity-30" />
                <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} className="flex-1 bg-transparent text-sm outline-none" placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              </div>
            </div>
            {/* Remember Me চেকবক্স */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-cyan-500" style={{ accentColor: t.cyan }} />
              <span className="text-xs" style={{ color: t.muted }}>আমাকে মনে রাখুন</span>
            </label>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${t.cyan}, ${t.purple})` }}
            >
              {loading ? "লগইন হচ্ছে..." : "লগইন"}
            </button>
          </div>

          {onStudentLogin && (
            <button onClick={onStudentLogin}
              className="w-full mt-4 py-2.5 rounded-xl text-xs font-medium transition-all border"
              style={{ borderColor: `${t.emerald}40`, color: t.emerald, background: `${t.emerald}08` }}
              onMouseEnter={e => e.currentTarget.style.background = `${t.emerald}15`}
              onMouseLeave={e => e.currentTarget.style.background = `${t.emerald}08`}>
              🎓 স্টুডেন্ট পোর্টাল লগইন
            </button>
          )}
          <p className="text-center text-[10px] opacity-30 mt-4">Demo: admin@agencybook.net / admin123</p>
        </div>
      </div>
    </div>
  );
}
