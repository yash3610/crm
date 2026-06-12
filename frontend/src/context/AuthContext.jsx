import { createContext, useContext, useEffect, useState } from "react";

import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("billpro_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem("billpro_token")),
  );

  useEffect(() => {
    if (!localStorage.getItem("billpro_token")) return;

    api
      .get("/auth/me")
      .then((currentUser) => {
        setUser(currentUser);
        localStorage.setItem("billpro_user", JSON.stringify(currentUser));
      })
      .catch(() => {
        localStorage.removeItem("billpro_token");
        localStorage.removeItem("billpro_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, user: nextUser }) => {
    localStorage.setItem("billpro_token", token);
    localStorage.setItem("billpro_user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async (credentials) => {
    const session = await api.post("/auth/login", credentials);
    saveSession(session);
    return session.user;
  };

  const register = async (details) => {
    const session = await api.post("/auth/register", details);
    saveSession(session);
    return session.user;
  };

  const logout = () => {
    localStorage.removeItem("billpro_token");
    localStorage.removeItem("billpro_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
