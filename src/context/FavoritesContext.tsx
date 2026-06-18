import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMyList, addToList, removeFromList } from '../lib/api';

type FavoritesContextValue = {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  refresh: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

// "My List" is now server-side (GET/PUT/DELETE /me/list) so it syncs across
// devices. We keep the same {favorites, isFavorite, toggleFavorite} shape the
// screens already use, with optimistic updates over the network calls.
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const movies = await fetchMyList();
      setFavorites(movies.map((m) => m.id));
    } catch {
      // offline / backend down — leave current list as-is
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const has = prev.includes(id);
      // optimistic; reconcile via the API call below
      (has ? removeFromList(id) : addToList(id)).catch(() => refresh());
      return has ? prev.filter((x) => x !== id) : [id, ...prev];
    });
  }, [refresh]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, refresh }),
    [favorites, isFavorite, toggleFavorite, refresh],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
