import { createContext, useContext, useEffect, useState } from "react";

import { api } from "@/lib/api";

const AuthContext = createContext(null);

function getStoredItem(key) {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

function clearSession() {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem("billpro_token");
    storage.removeItem("billpro_user");
  }
}

function getStoredUser() {
  try {
    const saved = getStoredItem("billpro_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    clearSession();
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(
    Boolean(getStoredItem("billpro_token")),
  );

  useEffect(() => {
    if (!getStoredItem("billpro_token")) return;

    api
      .get("/auth/me")
      .then((currentUser) => {
        setUser(currentUser);
        const storage = sessionStorage.getItem("billpro_token")
          ? sessionStorage
          : localStorage;
        storage.setItem("billpro_user", JSON.stringify(currentUser));
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, user: nextUser }, remember = false) => {
    clearSession();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("billpro_token", token);
    storage.setItem("billpro_user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async (credentials, remember = false) => {
    const session = await api.post("/auth/login", credentials);
    saveSession(session, remember);
    return session.user;
  };

  const register = async (details) => {
    const session = await api.post("/auth/register", details);
    saveSession(session, false);
    return session.user;
  };

  const logout = () => {
    clearSession();
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
