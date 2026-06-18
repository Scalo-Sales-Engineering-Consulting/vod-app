// Loads the catalog from the FastAPI backend on mount. If the backend is
// unreachable (offline, wrong BASE_URL), it transparently falls back to the
// bundled open-movie catalog so the app still renders.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchRows,
  fetchGenres,
  fetchCatalog,
  fetchContinue,
  fetchTop10,
  fetchBecauseYouWatched,
  fetchSeries,
  type Row,
  type ContinueItem,
  type SeriesSummary,
} from '../lib/api';
import { MOVIES, ROWS, GENRES, type Movie } from '../data/movies';
import { useProfile } from './ProfileContext';

type Source = 'loading' | 'backend' | 'fallback';

type CatalogValue = {
  movies: Movie[];
  rows: Row[];
  genres: string[];
  featured: Movie | null;
  continueWatching: ContinueItem[];
  top10: Movie[];
  becauseYouWatched: Row | null;
  series: SeriesSummary[];
  getMovie: (id: string) => Movie | undefined;
  source: Source;
  error: string | null;
  reload: () => void;
  /** Refetch in the background without flipping the UI to a loading spinner. */
  refresh: () => Promise<void>;
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
  const [continueWatching, setContinueWatching] = useState<ContinueItem[]>([]);
  const [top10, setTop10] = useState<Movie[]>([]);
  const [becauseYouWatched, setBecauseYouWatched] = useState<Row | null>(null);
  const [series, setSeries] = useState<SeriesSummary[]>([]);
  const [nonce, setNonce] = useState(0);

  // Core fetch. `silent` keeps the current UI on screen while refetching in the
  // background (used on screen focus); otherwise it shows the loading spinner.
  const fetchAll = useCallback(async (silent: boolean) => {
    if (!silent) setSource('loading');
    // Personalized rows are best-effort (independent of the main catalog).
    fetchContinue().then(setContinueWatching).catch(() => {});
    fetchTop10().then(setTop10).catch(() => {});
    fetchBecauseYouWatched().then(setBecauseYouWatched).catch(() => {});
    fetchSeries().then(setSeries).catch(() => {});
    try {
      const [r, g, c] = await Promise.all([fetchRows(), fetchGenres(), fetchCatalog()]);
      setRows(r);
      setGenres(g);
      setMovies(c);
      setSource('backend');
      setError(null);
    } catch (e) {
      // Backend down → fall back to bundled catalog (only when not a silent
      // refresh; a silent failure keeps whatever is already shown).
      setError(e instanceof Error ? e.message : String(e));
      if (!silent) {
        setRows(fallback.rows);
        setGenres(fallback.genres);
        setMovies(fallback.movies);
        setSource('fallback');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchAll(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce, fetchAll]);

  // Re-pull personalized rows when the active profile changes.
  const { activeId } = useProfile();
  useEffect(() => {
    if (activeId) fetchAll(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const byId = useMemo(() => new Map(movies.map((m) => [m.id, m])), [movies]);

  const value = useMemo<CatalogValue>(
    () => ({
      movies,
      rows,
      genres,
      featured: rows[0]?.movies[0] ?? movies[0] ?? null,
      continueWatching,
      top10,
      becauseYouWatched,
      series,
      getMovie: (id: string) => byId.get(id),
      source,
      error,
      reload: () => setNonce((n) => n + 1),
      refresh: () => fetchAll(true),
    }),
    [movies, rows, genres, continueWatching, top10, becauseYouWatched, series, byId, source, error, fetchAll],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
