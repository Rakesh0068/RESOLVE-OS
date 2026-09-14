"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  businessName: string;
  industry: string;
  onboardingComplete: boolean;
  autonomyPrefs: {
    maxAutonomousPurchase: number;
    supplierChangesRequireApproval: boolean;
    maxAutoRefund: number;
    riskThreshold: number;
    maxReplans: number;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; password: string; businessName: string }) => Promise<{ success: boolean; error?: string }>;
  signout: () => void;
  completeOnboarding: (prefs: Partial<User>) => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "resolveos_auth";

const DEFAULT_USER: User = {
  id: "usr_demo",
  name: "Demo User",
  email: "demo@resolveos.io",
  businessName: "Northstar Components",
  industry: "Industrial Supplies",
  onboardingComplete: true,
  autonomyPrefs: {
    maxAutonomousPurchase: 10000,
    supplierChangesRequireApproval: true,
    maxAutoRefund: 5000,
    riskThreshold: 80,
    maxReplans: 3,
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
    setLoading(false);
  }, []);

  const persistUser = useCallback((u: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const signin = useCallback(async (email: string, _password: string) => {
    // Demo: accept any email/password
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const existing = JSON.parse(stored);
      if (existing.email === email) {
        setUser(existing);
        return { success: true };
      }
    }
    // Create new user for demo
    const newUser: User = {
      ...DEFAULT_USER,
      email,
      id: `usr_${Date.now()}`,
    };
    persistUser(newUser);
    return { success: true };
  }, [persistUser]);

  const signup = useCallback(async (data: { name: string; email: string; password: string; businessName: string }) => {
    const newUser: User = {
      ...DEFAULT_USER,
      id: `usr_${Date.now()}`,
      name: data.name,
      email: data.email,
      businessName: data.businessName,
      onboardingComplete: false,
    };
    persistUser(newUser);
    return { success: true };
  }, [persistUser]);

  const signout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const completeOnboarding = useCallback((prefs: Partial<User>) => {
    if (user) {
      persistUser({ ...user, ...prefs, onboardingComplete: true });
    }
  }, [user, persistUser]);

  const updateProfile = useCallback((data: Partial<User>) => {
    if (user) {
      persistUser({ ...user, ...data });
    }
  }, [user, persistUser]);

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, signout, completeOnboarding, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
