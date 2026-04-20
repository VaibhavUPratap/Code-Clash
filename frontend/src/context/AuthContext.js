import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchMe, login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin } from "../services/api";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";

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

  const loginWithGoogle = useCallback(async () => {
    try {
      // 1. Popup Google login
      const result = await signInWithPopup(auth, googleProvider);
      // 2. Get ID token from Firebase
      const idToken = await result.user.getIdToken();
      // 3. Send to backend to get project JWT
      const r = await apiGoogleLogin(idToken);
      // 4. Save and set user
      sessionStorage.setItem("authToken", r.token);
      setUser(r.user);
      return r;
    } catch (error) {
      console.error("Google Login Error:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("authToken");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, loginWithGoogle }}>
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
