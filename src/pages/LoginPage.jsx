import { useState } from "react";
import { GraduationCap, Mail, Lock } from "lucide-react";
import { useTheme, getGlobalStyles } from "../context/ThemeContext";

export default function LoginPage({ onLogin }) {
  const t = useTheme();
  const [email, setEmail] = useState("admin@agencyos.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 800);
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
            <h1 className="text-xl font-bold tracking-tight">AgencyOS</h1>
            <p className="text-xs opacity-40 mt-1">Study Abroad Management System</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider opacity-40 mb-1.5 block">Email</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 focus-within:border-cyan-500/30 transition">
                <Mail size={14} className="opacity-30" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" placeholder="your@email.com" />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider opacity-40 mb-1.5 block">Password</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 focus-within:border-cyan-500/30 transition">
                <Lock size={14} className="opacity-30" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" placeholder="••••••••" />
              </div>
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${t.cyan}, ${t.purple})` }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>

          <p className="text-center text-[10px] opacity-30 mt-6">Demo: admin@agencyos.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
