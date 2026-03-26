/**
 * AuthContext.jsx — অথেন্টিকেশন ম্যানেজমেন্ট
 *
 * এই context পুরো অ্যাপে user login/logout state manage করে।
 * - login(): backend API দিয়ে JWT token পায় → localStorage-এ save করে
 * - logout(): token ও user data মুছে ফেলে
 * - Auto logout: ১ ঘন্টা কোনো activity না হলে অটো logout
 * - loading: প্রথমবার localStorage থেকে session restore হচ্ছে কিনা
 *
 * ব্যবহার:
 *   const { user, login, logout, loading } = useAuth();
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { auth as authApi } from "../lib/api";

const AuthContext = createContext(null);

// ── Auto logout timeout: ১ ঘন্টা (milliseconds) ──
const IDLE_TIMEOUT = 60 * 60 * 1000; // 1 hour

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const idleTimer = useRef(null);

  // ─── Activity tracker: mouse, keyboard, click, scroll ───
  const resetIdleTimer = useCallback(() => {
    // আগের timer cancel করো
    if (idleTimer.current) clearTimeout(idleTimer.current);

    // নতুন timer set করো — IDLE_TIMEOUT পর auto logout
    idleTimer.current = setTimeout(() => {
      const hasUser = localStorage.getItem("agencyos_user");
      if (hasUser) {
        localStorage.removeItem("agencyos_token");
        localStorage.removeItem("agencyos_user");
        localStorage.setItem("agencyos_logout_reason", "idle");
        setUser(null);
        window.location.reload(); // login page-এ redirect
      }
    }, IDLE_TIMEOUT);

    // Last activity time save (debug/display করার জন্য)
    localStorage.setItem("agencyos_last_activity", Date.now().toString());
  }, []);

  // ─── Activity events listen করো ───
  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

    // Throttle: প্রতি 30 সেকেন্ডে একবার timer reset (performance)
    let lastReset = 0;
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastReset > 30000) { // 30 sec throttle
        lastReset = now;
        resetIdleTimer();
      }
    };

    events.forEach(e => window.addEventListener(e, throttledReset, { passive: true }));

    // প্রথমবার timer start
    resetIdleTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, throttledReset));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetIdleTimer]);

  // ─── App load-এ আগের session restore করো ───
  useEffect(() => {
    const saved = localStorage.getItem("agencyos_user");
    const token = localStorage.getItem("agencyos_token");

    if (saved && token) {
      // Last activity check — ১ ঘন্টার বেশি আগে হলে logout
      const lastActivity = parseInt(localStorage.getItem("agencyos_last_activity") || "0");
      const elapsed = Date.now() - lastActivity;

      if (lastActivity > 0 && elapsed > IDLE_TIMEOUT) {
        // Session expire হয়ে গেছে
        localStorage.removeItem("agencyos_token");
        localStorage.removeItem("agencyos_user");
        localStorage.setItem("agencyos_logout_reason", "expired");
      } else {
        try { setUser(JSON.parse(saved)); } catch { /* corrupt data */ }
      }
    }
    setLoading(false);
  }, []);

  /**
   * login() — Backend API দিয়ে real login
   */
  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    localStorage.setItem("agencyos_token", res.token);
    localStorage.setItem("agencyos_user", JSON.stringify(res.user));
    localStorage.setItem("agencyos_last_activity", Date.now().toString());
    localStorage.removeItem("agencyos_logout_reason");
    setUser(res.user);
    resetIdleTimer(); // login-এর পর timer start
    return res.user;
  };

  /**
   * setMockUser() — Backend না থাকলে mock/fallback login
   */
  const setMockUser = (userData) => {
    localStorage.setItem("agencyos_user", JSON.stringify(userData));
    localStorage.setItem("agencyos_last_activity", Date.now().toString());
    setUser(userData);
  };

  /**
   * logout() — সব session data মুছে ফেলে
   */
  const logout = () => {
    localStorage.removeItem("agencyos_token");
    localStorage.removeItem("agencyos_user");
    localStorage.removeItem("agencyos_last_activity");
    localStorage.removeItem("agencyos_logout_reason");
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, setMockUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
