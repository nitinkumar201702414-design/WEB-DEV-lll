import { createContext, useContext, useEffect, useState } from "react";
import api, { refreshAccessToken, setAccessToken, setAuthFailHandler } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load, try to restore the session using the refresh-token cookie.
  useEffect(() => {
    setAuthFailHandler(() => setUser(null));
    refreshAccessToken()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
  };

  const register = async (form) => {
    const { data } = await api.post("/auth/register", form);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
