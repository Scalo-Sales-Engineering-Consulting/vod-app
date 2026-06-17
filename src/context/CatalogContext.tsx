// Loads the catalog from the FastAPI backend on mount. If the backend is
// unreachable (offline, wrong BASE_URL), it transparently falls back to the
// bundled open-movie catalog so the app still renders.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchRows, fetchGenres, fetchCatalog, type Row } from '../lib/api';
import { MOVIES, ROWS, GENRES, type Movie } from '../data/movies';

type Source = 'loading' | 'backend' | 'fallback';

type CatalogValue = {
  movies: Movie[];
  rows: Row[];
  genres: string[];
  featured: Movie | null;
  getMovie: (id: string) => Movie | undefined;
  source: Source;
  error: string | null;
  reload: () => void;
};

const bundledRows: Row[] = ROWS.map((r) => ({
  title: r.title,
  movies: r.movieIds.map((id) => MOVIES.find((m) => m.id === id)!).filter(Boolean),
}));

const fallback = { movies: MOVIES, rows: bundledRows, genres: GENRES };

const CatalogContext = createContext<CatalogValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [genres, setGenres] = useState<string[]>(['All']);
  const [source, setSource] = useState<Source>('loading');
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setSource('loading');
    setError(null);
    (async () => {
      try {
        const [r, g, c] = await Promise.all([fetchRows(), fetchGenres(), fetchCatalog()]);
        if (cancelled) return;
        setRows(r);
        setGenres(g);
        setMovies(c);
        setSource('backend');
      } catch (e) {
        if (cancelled) return;
        // Backend down → use bundled catalog, but surface the reason.
        setRows(fallback.rows);
        setGenres(fallback.genres);
        setMovies(fallback.movies);
        setSource('fallback');
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const byId = useMemo(() => new Map(movies.map((m) => [m.id, m])), [movies]);

  const value = useMemo<CatalogValue>(
    () => ({
      movies,
      rows,
      genres,
      featured: rows[0]?.movies[0] ?? movies[0] ?? null,
      getMovie: (id: string) => byId.get(id),
      source,
      error,
      reload: () => setNonce((n) => n + 1),
    }),
    [movies, rows, genres, byId, source, error],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
