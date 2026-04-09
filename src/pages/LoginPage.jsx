import { useState, useEffect } from "react";
import { GraduationCap, Mail, Lock, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useTheme, getGlobalStyles } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function LoginPage({ onLogin, onStudentLogin }) {
  const t = useTheme();
  const { t: tr } = useLanguage();
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!remembered);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-logout হলে message দেখাও
  useEffect(() => {
    const logoutReason = localStorage.getItem("agencyos_logout_reason");
    if (logoutReason) {
      localStorage.removeItem("agencyos_logout_reason");
      setError(logoutReason === "idle" ? tr("login.idleLogout") : tr("login.sessionExpired"));
    }
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError(tr("login.enterCredentials")); return; }
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
      setError(err.message || tr("login.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center" style={{ background: t.bg, transition: "background 0.4s" }}>
      <style>{getGlobalStyles(t)}{`
        /* Browser autofill সাদা background fix — dark theme-এ মানানসই */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px ${t.card} inset !important;
          -webkit-text-fill-color: ${t.text} !important;
          caret-color: ${t.text} !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
      <div className="relative w-full max-w-sm mx-4">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: `radial-gradient(circle, ${t.cyan}, transparent)` }} />

        <div className="relative anim-fade rounded-2xl border p-8" style={{ background: t.card, borderColor: t.border }}>
          {/* Logo — Agency Operating System */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl mb-3 relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${t.cyan}, ${t.purple})`, boxShadow: `0 8px 32px ${t.cyan}30` }}>
              {/* Custom logo — globe + graduation cap + connection lines */}
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Globe circle */}
                <circle cx="18" cy="18" r="14" stroke="white" strokeWidth="1.5" opacity="0.4"/>
                <ellipse cx="18" cy="18" rx="8" ry="14" stroke="white" strokeWidth="1" opacity="0.3"/>
                <line x1="4" y1="18" x2="32" y2="18" stroke="white" strokeWidth="1" opacity="0.3"/>
                <line x1="4" y1="12" x2="32" y2="12" stroke="white" strokeWidth="0.7" opacity="0.2"/>
                <line x1="4" y1="24" x2="32" y2="24" stroke="white" strokeWidth="0.7" opacity="0.2"/>
                {/* Paper/Document icon center */}
                <rect x="12" y="8" width="12" height="16" rx="2" fill="white" opacity="0.9"/>
                <line x1="15" y1="13" x2="21" y2="13" stroke={t.cyan} strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="15" y1="16.5" x2="21" y2="16.5" stroke={t.purple} strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="15" y1="20" x2="19" y2="20" stroke={t.cyan} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                {/* Graduation cap on top */}
                <path d="M18 6L12 9L18 12L24 9L18 6Z" fill="white"/>
                <line x1="22" y1="9" x2="22" y2="13" stroke="white" strokeWidth="1"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">AgencyBook</h1>
            <p className="text-[10px] uppercase tracking-widest mt-1.5 font-medium" style={{ color: t.muted }}>Agency Operating System</p>
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
              <label className="text-[10px] uppercase tracking-wider opacity-40 mb-1.5 block">{tr("common.email")}</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 focus-within:border-cyan-500/30 transition">
                <Mail size={14} className="opacity-30" />
                <input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} className="flex-1 bg-transparent text-sm outline-none" placeholder="your@email.com" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider opacity-40 mb-1.5 block">{tr("login.password")}</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 focus-within:border-cyan-500/30 transition">
                <Lock size={14} className="opacity-30" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} className="flex-1 bg-transparent text-sm outline-none" placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="opacity-30 hover:opacity-70 transition">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {/* Remember Me চেকবক্স */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-cyan-500" style={{ accentColor: t.cyan }} />
              <span className="text-xs" style={{ color: t.muted }}>{tr("login.rememberMe")}</span>
            </label>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${t.cyan}, ${t.purple})` }}
            >
              {loading ? tr("login.loggingIn") : tr("login.login")}
            </button>
          </div>

          {onStudentLogin && (
            <button onClick={onStudentLogin}
              className="w-full mt-4 py-2.5 rounded-xl text-xs font-medium transition-all border"
              style={{ borderColor: `${t.emerald}40`, color: t.emerald, background: `${t.emerald}08` }}
              onMouseEnter={e => e.currentTarget.style.background = `${t.emerald}15`}
              onMouseLeave={e => e.currentTarget.style.background = `${t.emerald}08`}>
              🎓 {tr("login.studentPortal")}
            </button>
          )}
          {/* Platform branding */}
          <p className="text-center mt-6 text-[9px] tracking-wider uppercase" style={{ color: `${t.muted}60` }}>
            Powered by <span style={{ color: t.cyan }}>AgencyBook</span>
          </p>
        </div>
      </div>
    </div>
  );
}
