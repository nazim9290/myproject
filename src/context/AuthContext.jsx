import { createContext, useContext, useState, useEffect } from "react";
import { auth as authApi } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const saved = localStorage.getItem("agencyos_user");
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    localStorage.setItem("agencyos_token", res.token);
    localStorage.setItem("agencyos_user", JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  // For mock/fallback login when backend is unavailable
  const setMockUser = (userData) => {
    localStorage.setItem("agencyos_user", JSON.stringify(userData));
    setUser(userData);
  };

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

export const useAuth = () => useContext(AuthContext);
