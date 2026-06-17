// Thin client for the FastAPI VOD streaming backend. See Test/API_CONTRACT.md.
// Maps the backend VideoWithStream model onto the app's local `Movie` shape so the
// existing screens/components keep working unchanged.
import { BASE_URL, DEMO_EMAIL, DEMO_PASSWORD, abs } from './config';
import type { Movie } from '../data/movies';

// ---- backend response types (subset we use) ----
type Genre = { id: string; name: string };
export type VideoWithStream = {
  id: string;
  title: string;
  description: string | null;
  release_year: number | null;
  director: string | null;
  cast: string | null;
  maturity_rating: string | null;
  language: string | null;
  genres: Genre[];
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  duration_seconds: number | null;
  stream_url: string | null;
  poster_url: string | null;
  updated_at: string | null;
};
type CatalogRow = { genre: string; items: VideoWithStream[] };
export type GenreCount = { id: string; name: string; count: number };

let token: string | null = null;

async function login(): Promise<string> {
  if (token) return token;
  const body = new URLSearchParams({ username: DEMO_EMAIL, password: DEMO_PASSWORD });
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  token = json.access_token;
  return token;
}

async function authed<T>(path: string): Promise<T> {
  const t = await login();
  const res = await fetch(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${t}` } });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ---- mapping ----

// Backend has no numeric rating; synthesize a stable, pleasant one from the id so
// the UI (stars) looks alive and a given film always shows the same score.
function pseudoRating(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return Math.round((6.5 + (h % 250) / 100) * 10) / 10; // 6.5–9.0
}

function fmtDuration(sec: number | null): string {
  if (!sec || sec <= 0) return '—';
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${r}s`;
  return `${r}s`;
}

export function mapVideo(v: VideoWithStream): Movie {
  // Cache-bust by updated_at: the poster URL is stable (/videos/<id>/poster), so
  // without this expo-image keeps showing the old cached image after a poster swap.
  const posterBase = abs(v.poster_url);
  const poster = posterBase
    ? posterBase + (v.updated_at ? `?v=${encodeURIComponent(v.updated_at)}` : '')
    : '';
  return {
    id: v.id,
    title: v.title,
    year: v.release_year ?? 0,
    rating: pseudoRating(v.id),
    duration: fmtDuration(v.duration_seconds),
    genres: v.genres.map((g) => g.name),
    maturity: v.maturity_rating ?? 'All',
    description: v.description ?? '',
    poster,
    backdrop: poster, // backend has no separate backdrop — reuse poster
    trailer: v.status === 'ready' ? abs(v.stream_url) : undefined, // HLS master.m3u8
  };
}

// ---- public API ----
export type Row = { title: string; movies: Movie[] };

export async function fetchRows(): Promise<Row[]> {
  const rows = await authed<CatalogRow[]>('/catalog/rows');
  return rows.map((r) => ({ title: r.genre, movies: r.items.map(mapVideo) }));
}

export async function fetchGenres(): Promise<string[]> {
  const gs = await authed<GenreCount[]>('/catalog/genres');
  return ['All', ...gs.map((g) => g.name)];
}

export async function fetchCatalog(): Promise<Movie[]> {
  const items = await authed<VideoWithStream[]>('/catalog');
  return items.map(mapVideo);
}

// ---- management (owner — Bearer) ----

// The films owned by the logged-in user. Returns raw backend rows so the Manage
// screen can show processing status / errors that the trimmed `Movie` shape drops.
export async function fetchMyVideos(): Promise<VideoWithStream[]> {
  return authed<VideoWithStream[]>('/videos');
}

export async function fetchVideo(id: string): Promise<VideoWithStream> {
  return authed<VideoWithStream>(`/videos/${id}`);
}

export function posterAbs(v: VideoWithStream): string | undefined {
  return abs(v.poster_url);
}

export type VideoMeta = {
  title?: string;
  description?: string;
  release_year?: number | null;
  director?: string;
  cast?: string;
  maturity_rating?: string;
  language?: string;
  genres?: string[];
};

type FilePick = { uri: string; name: string; type: string };

async function authedSend<T>(path: string, method: string, body: FormData | string, isJson: boolean): Promise<T> {
  const t = await login();
  const headers: Record<string, string> = { Authorization: `Bearer ${t}` };
  if (isJson) headers['Content-Type'] = 'application/json';
  // For FormData, do NOT set Content-Type — RN sets the multipart boundary itself.
  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${method} ${path} → ${res.status} ${detail.slice(0, 200)}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Add a new film. `video` is required; `poster` optional. Transcoding starts in
// the background server-side (status uploaded → processing → ready).
export async function createVideo(
  video: FilePick,
  meta: VideoMeta & { title: string },
  poster?: FilePick,
): Promise<VideoWithStream> {
  const fd = new FormData();
  fd.append('file', video as any);
  fd.append('title', meta.title);
  if (meta.description) fd.append('description', meta.description);
  if (meta.release_year != null) fd.append('release_year', String(meta.release_year));
  if (meta.director) fd.append('director', meta.director);
  if (meta.cast) fd.append('cast', meta.cast);
  if (meta.maturity_rating) fd.append('maturity_rating', meta.maturity_rating);
  if (meta.language) fd.append('language', meta.language);
  if (meta.genres?.length) fd.append('genres', meta.genres.join(', '));
  if (poster) fd.append('poster', poster as any);
  return authedSend<VideoWithStream>('/videos', 'POST', fd, false);
}

export async function updateVideo(id: string, meta: VideoMeta): Promise<VideoWithStream> {
  return authedSend<VideoWithStream>(`/videos/${id}`, 'PATCH', JSON.stringify(meta), true);
}

export async function uploadPoster(id: string, poster: FilePick): Promise<VideoWithStream> {
  const fd = new FormData();
  fd.append('poster', poster as any);
  return authedSend<VideoWithStream>(`/videos/${id}/poster`, 'POST', fd, false);
}

export async function deleteVideo(id: string): Promise<void> {
  await authedSend<void>(`/videos/${id}`, 'DELETE', '', false);
}
