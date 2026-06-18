import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { loginWithPassword, registerAccount, loginAsGuest, loginDemo, logout, isAuthed } from '../lib/api';

type AuthValue = {
  authed: boolean;
  signInPassword: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signInGuest: () => Promise<void>;
  signInDemo: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(isAuthed());

  const wrap = useCallback((fn: () => Promise<void>) => async () => { await fn(); setAuthed(true); }, []);

  const value = useMemo<AuthValue>(() => ({
    authed,
    signInPassword: async (e, p) => { await loginWithPassword(e, p); setAuthed(true); },
    register: async (e, p) => { await registerAccount(e, p); setAuthed(true); },
    signInGuest: wrap(loginAsGuest),
    signInDemo: wrap(loginDemo),
    signOut: () => { logout(); setAuthed(false); },
  }), [authed, wrap]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
