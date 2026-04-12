import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchMe, login as apiLogin, register as apiRegister } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setReady(true);
      return;
    }
    fetchMe()
      .then((r) => setUser(r.user))
      .catch(() => {
        sessionStorage.removeItem("authToken");
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await apiLogin(email, password);
    sessionStorage.setItem("authToken", r.token);
    setUser(r.user);
    return r;
  }, []);

  const register = useCallback(async (email, password) => {
    const r = await apiRegister(email, password);
    sessionStorage.setItem("authToken", r.token);
    setUser(r.user);
    return r;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("authToken");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
