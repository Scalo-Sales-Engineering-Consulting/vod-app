import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  loginWithPassword,
  loginAsGuest,
  loginDemo,
  logout,
  isAuthed,
  setRemember,
  restoreSession,
} from '../lib/api';

type AuthValue = {
  authed: boolean;
  restoring: boolean; // true while we try to restore a remembered session at boot
  signInPassword: (email: string, password: string, remember?: boolean) => Promise<void>;
  signInGuest: () => Promise<void>;
  signInDemo: () => Promise<void>;
  // Flip into the app once tokens are already set (registration wizard, password reset).
  markAuthed: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(isAuthed());
  const [restoring, setRestoring] = useState(true);

  // Try to restore a remembered session on first mount.
  useEffect(() => {
    let alive = true;
    restoreSession()
      .then((ok) => { if (alive && ok) setAuthed(true); })
      .finally(() => { if (alive) setRestoring(false); });
    return () => { alive = false; };
  }, []);

  const wrap = useCallback((fn: () => Promise<void>) => async () => { await fn(); setAuthed(true); }, []);

  const value = useMemo<AuthValue>(() => ({
    authed,
    restoring,
    signInPassword: async (e, p, remember = false) => {
      setRemember(remember);
      await loginWithPassword(e, p);
      setAuthed(true);
    },
    signInGuest: wrap(loginAsGuest),
    signInDemo: wrap(loginDemo),
    markAuthed: () => setAuthed(true),
    signOut: () => { logout(); setAuthed(false); },
  }), [authed, restoring, wrap]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
