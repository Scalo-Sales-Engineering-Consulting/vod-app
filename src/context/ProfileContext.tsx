import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchProfiles,
  createProfile as apiCreate,
  deleteProfile as apiDelete,
  setActiveProfile,
  type Profile,
} from '../lib/api';

type ProfileContextValue = {
  profiles: Profile[];
  activeId: string | null;
  active: Profile | null;
  loading: boolean;
  setActive: (id: string) => void;
  createProfile: (name: string, isKids?: boolean, avatar?: string) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;
  reload: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const ps = await fetchProfiles();
      setProfiles(ps);
      // Keep current active if still present, else default to first.
      setActiveId((cur) => {
        const next = cur && ps.some((p) => p.id === cur) ? cur : ps[0]?.id ?? null;
        setActiveProfile(next);
        return next;
      });
    } catch {
      // backend down — leave as-is
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const setActive = useCallback((id: string) => {
    setActiveProfile(id);
    setActiveId(id);
  }, []);

  const createProfile = useCallback(
    async (name: string, isKids = false, avatar = '#5CE38B') => {
      await apiCreate(name, isKids, avatar);
      await reload();
    },
    [reload],
  );

  const removeProfile = useCallback(
    async (id: string) => {
      await apiDelete(id);
      await reload();
    },
    [reload],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      profiles,
      activeId,
      active: profiles.find((p) => p.id === activeId) ?? null,
      loading,
      setActive,
      createProfile,
      removeProfile,
      reload,
    }),
    [profiles, activeId, loading, setActive, createProfile, removeProfile, reload],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
