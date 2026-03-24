/**
 * AuthContext.jsx — অথেন্টিকেশন ম্যানেজমেন্ট
 *
 * এই context পুরো অ্যাপে user login/logout state manage করে।
 * - login(): backend API দিয়ে JWT token পায় → localStorage-এ save করে
 * - logout(): token ও user data মুছে ফেলে
 * - setMockUser(): backend না থাকলে mock login করে (development fallback)
 * - loading: প্রথমবার localStorage থেকে session restore হচ্ছে কিনা
 *
 * ব্যবহার:
 *   const { user, login, logout, loading } = useAuth();
 */

import { createContext, useContext, useState, useEffect } from "react";
import { auth as authApi } from "../lib/api";

// Context তৈরি — পুরো app-এ user state share করতে
const AuthContext = createContext(null);

/**
 * AuthProvider — App-এর root-এ wrap করতে হয়
 * সব child component এ useAuth() দিয়ে user info পাওয়া যায়
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // বর্তমান logged-in user
  const [loading, setLoading] = useState(true); // session restore হচ্ছে কিনা

  // ─── App load-এ আগের session restore করো ───
  useEffect(() => {
    const saved = localStorage.getItem("agencyos_user");
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* corrupt data, ignore */ }
    }
    setLoading(false);
  }, []);

  /**
   * login() — Backend API দিয়ে real login
   * - email/password পাঠায়
   * - JWT token ও user info পায়
   * - localStorage-এ save করে (পরে refresh করলেও logged-in থাকে)
   */
  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    localStorage.setItem("agencyos_token", res.token);      // JWT token save
    localStorage.setItem("agencyos_user", JSON.stringify(res.user)); // User info save
    setUser(res.user);
    return res.user;
  };

  /**
   * setMockUser() — Backend না থাকলে mock/fallback login
   * Token ছাড়াই user set করে — শুধু development-এ কাজে লাগে
   */
  const setMockUser = (userData) => {
    localStorage.setItem("agencyos_user", JSON.stringify(userData));
    setUser(userData);
  };

  /**
   * logout() — সব session data মুছে ফেলে
   * Token + user info localStorage থেকে remove
   */
  const logout = () => {
    localStorage.removeItem("agencyos_token");
    localStorage.removeItem("agencyos_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, setMockUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth() hook — যেকোনো component-এ auth state access করতে
export const useAuth = () => useContext(AuthContext);
