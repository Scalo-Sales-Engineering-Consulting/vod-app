// Thin client for the FastAPI VOD streaming backend. See Test/API_CONTRACT.md.
// Maps the backend VideoWithStream model onto the app's local `Movie` shape so the
// existing screens/components keep working unchanged.
import * as SecureStore from 'expo-secure-store';
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
  episode_number?: number | null;
  episode_title?: string;
};
type CatalogRow = { genre: string; items: VideoWithStream[] };
export type GenreCount = { id: string; name: string; count: number };

let token: string | null = null;
let refreshToken: string | null = null;

// "Remember me": when on, the refresh token is persisted to the device keychain
// so a session survives an app restart. Restored at boot via restoreSession().
const RT_KEY = 'vod.refresh_token';
let remember = false;

export function setRemember(on: boolean): void {
  remember = on;
}

async function persistRefresh(): Promise<void> {
  try {
    if (remember && refreshToken) await SecureStore.setItemAsync(RT_KEY, refreshToken);
    else await SecureStore.deleteItemAsync(RT_KEY);
  } catch {}
}

function setTokens(json: { access_token: string; refresh_token?: string }): void {
  token = json.access_token;
  refreshToken = json.refresh_token ?? null;
  void persistRefresh();
}

// Boot-time: if a refresh token was remembered, exchange it for a fresh access
// token. Returns true when a session was restored (so the app can skip login).
export async function restoreSession(): Promise<boolean> {
  try {
    const stored = await SecureStore.getItemAsync(RT_KEY);
    if (!stored) return false;
    const r = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: stored }),
    });
    if (!r.ok) {
      await SecureStore.deleteItemAsync(RT_KEY);
      return false;
    }
    const j = (await r.json()) as { access_token: string; refresh_token?: string };
    token = j.access_token;
    refreshToken = j.refresh_token ?? stored;
    remember = true;
    void persistRefresh();
    return true;
  } catch {
    return false;
  }
}

// Ensure we have an access token for an authed call (set by sign-in below).
async function login(): Promise<string> {
  if (token) return token;
  throw new Error('Not authenticated');
}

export async function loginWithPassword(email: string, password: string): Promise<void> {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error('Invalid email or password');
  setTokens(await res.json());
}

export async function registerAccount(email: string, password: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.detail || 'Registration failed');
  }
  await loginWithPassword(email, password);
}

// ---- full registration wizard ----

export type RegisterPayload = {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
  birthdate?: string; // YYYY-MM-DD
  country?: string;
  marketing_opt_in?: boolean;
  is_kids?: boolean;
};

// Availability checks (live, as the user types). Fail-open on network error so
// the form isn't blocked — the backend re-validates uniqueness on register.
export async function checkEmailAvailable(email: string): Promise<boolean> {
  try {
    const r = await fetch(`${BASE_URL}/auth/check-email?email=${encodeURIComponent(email)}`);
    if (!r.ok) return true;
    return (await r.json()).available;
  } catch {
    return true;
  }
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  try {
    const r = await fetch(`${BASE_URL}/auth/check-username?username=${encodeURIComponent(username)}`);
    if (!r.ok) return true;
    return (await r.json()).available;
  } catch {
    return true;
  }
}

// Create the account from the full wizard payload, then sign in.
export async function registerFull(p: RegisterPayload): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.detail || 'Registration failed');
  }
  await loginWithPassword(p.email, p.password);
}

// ---- subscription plans + checkout ----

export type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  resolution: string;
  quality_label: string;
  audio: string;
  max_screens: number;
  download_devices: number;
  hdr: boolean;
  spatial_audio: boolean;
  devices: string[];
  tagline: string;
};

export async function fetchPlans(): Promise<Plan[]> {
  const r = await fetch(`${BASE_URL}/plans`);
  if (!r.ok) throw new Error('Could not load plans');
  return r.json();
}

export type PaymentMethod = 'card' | 'paypal' | 'gift';
export type CheckoutPayload = {
  plan: string;
  payment_method: PaymentMethod;
  card_number?: string;
  card_exp?: string;
  card_cvc?: string;
  gift_code?: string;
};

// Stub checkout — returns the success message, throws with the decline reason on
// 402 so the wizard can route to its happy / error result page.
export async function subscribe(p: CheckoutPayload): Promise<string> {
  const t = await login();
  const res = await fetch(`${BASE_URL}/me/subscription`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || 'Payment failed');
  return body.message || 'Payment approved.';
}

// ---- forgot / reset password ----

// Returns the reset token (no mail server in the self-hosted setup), or null
// when the email didn't match (response is intentionally vague server-side).
export async function forgotPassword(email: string): Promise<string | null> {
  const r = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!r.ok) throw new Error('Request failed');
  return (await r.json()).reset_token ?? null;
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<void> {
  const r = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || 'Reset failed');
  }
  setTokens(await r.json());
}

export async function loginAsGuest(): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/guest`, { method: 'POST' });
  if (!res.ok) throw new Error('Guest sign-in failed');
  setTokens(await res.json());
}

export async function loginDemo(): Promise<void> {
  await loginWithPassword(DEMO_EMAIL, DEMO_PASSWORD);
}

export function logout(): void {
  token = null;
  refreshToken = null;
  activeProfileId = null;
  remember = false;
  SecureStore.deleteItemAsync(RT_KEY).catch(() => {});
}

export function isAuthed(): boolean {
  return !!token;
}

// On a 401 (access token expired), rotate via the refresh token; fall back to
// a fresh login. Keeps long-lived sessions working without a restart.
async function reauth(): Promise<string> {
  if (refreshToken) {
    try {
      const r = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (r.ok) {
        const j = (await r.json()) as { access_token: string; refresh_token?: string };
        token = j.access_token;
        refreshToken = j.refresh_token ?? refreshToken;
        void persistRefresh();
        return token;
      }
    } catch {}
  }
  token = null;
  refreshToken = null;
  return login();
}

// Active profile (Netflix-style). Sent as X-Profile-Id so the backend scopes
// My List / Continue Watching / recommendations to it.
let activeProfileId: string | null = null;
export function setActiveProfile(id: string | null): void {
  activeProfileId = id;
}
export function getActiveProfile(): string | null {
  return activeProfileId;
}
function profileHeaders(base: Record<string, string>): Record<string, string> {
  return activeProfileId ? { ...base, 'X-Profile-Id': activeProfileId } : base;
}

async function authed<T>(path: string): Promise<T> {
  let t = await login();
  let res = await fetch(`${BASE_URL}${path}`, {
    headers: profileHeaders({ Authorization: `Bearer ${t}` }),
  });
  if (res.status === 401) {
    t = await reauth();
    res = await fetch(`${BASE_URL}${path}`, { headers: profileHeaders({ Authorization: `Bearer ${t}` }) });
  }
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

// Display-only PL→EN genre labels (catalog content is Polish).
const GENRE_EN: Record<string, string> = {
  Akcja: 'Action', Przygodowy: 'Adventure', Przygodowe: 'Adventure', Komedia: 'Comedy',
  Dramat: 'Drama', Fantasy: 'Fantasy', Horror: 'Horror', Thriller: 'Thriller',
  Animacja: 'Animation', Kryminał: 'Crime', Familijny: 'Family', Wojenny: 'War',
  Romans: 'Romance', Dokument: 'Documentary', Muzyczny: 'Musical', Western: 'Western',
};
export const enGenre = (g: string): string => GENRE_EN[g] ?? g;

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
    genres: v.genres.map((g) => enGenre(g.name)),
    maturity: v.maturity_rating ?? 'All',
    description: v.description ?? '',
    poster,
    backdrop: poster, // backend has no separate backdrop — reuse poster
    trailer: v.status === 'ready' ? abs(v.stream_url) : undefined, // HLS master.m3u8
    episodeNumber: v.episode_number ?? undefined,
    episodeTitle: v.episode_title || undefined,
  };
}

// ---- public API ----
export type Row = { title: string; movies: Movie[] };

export async function fetchRows(): Promise<Row[]> {
  const rows = await authed<CatalogRow[]>('/catalog/rows');
  return rows.map((r) => ({ title: enGenre(r.genre), movies: r.items.map(mapVideo) }));
}

export async function fetchGenres(): Promise<string[]> {
  const gs = await authed<GenreCount[]>('/catalog/genres');
  return ['All', ...gs.map((g) => enGenre(g.name))];
}

export async function fetchCatalog(): Promise<Movie[]> {
  const items = await authed<VideoWithStream[]>('/catalog');
  return items.map(mapVideo);
}

export async function fetchTop10(): Promise<Movie[]> {
  const items = await authed<VideoWithStream[]>('/catalog/top10');
  return items.map(mapVideo);
}

export async function fetchCategories(): Promise<Row[]> {
  const rows = await authed<{ id: string; name: string; items: VideoWithStream[] }[]>(
    '/catalog/categories',
  );
  return rows.map((r) => ({ title: r.name, movies: r.items.map(mapVideo) }));
}

// Returns null when the user has no watch history yet.
export async function fetchBecauseYouWatched(): Promise<Row | null> {
  const r = await authed<{ genre: string; items: VideoWithStream[] }>('/catalog/because-you-watched');
  if (!r.genre || !r.items.length) return null;
  return { title: r.genre, movies: r.items.map(mapVideo) };
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
  const base = abs(v.poster_url);
  // Same cache-bust as mapVideo so a freshly uploaded poster replaces the cached one.
  return base ? base + (v.updated_at ? `?v=${encodeURIComponent(v.updated_at)}` : '') : undefined;
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
  const headers: Record<string, string> = profileHeaders({ Authorization: `Bearer ${t}` });
  if (isJson) headers['Content-Type'] = 'application/json';
  // For FormData, do NOT set Content-Type — RN sets the multipart boundary itself.
  let res = await fetch(`${BASE_URL}${path}`, { method, headers, body });
  // Retry once on expiry (string bodies only — a consumed FormData can't be re-sent).
  if (res.status === 401 && typeof body === 'string') {
    const nt = await reauth();
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { ...headers, Authorization: `Bearer ${nt}` },
      body,
    });
  }
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

// ---- library: My List + Continue Watching (server-side, synced) ----

export async function fetchMyList(): Promise<Movie[]> {
  const items = await authed<VideoWithStream[]>('/me/list');
  return items.map(mapVideo);
}

export async function addToList(id: string): Promise<void> {
  await authedSend<void>(`/me/list/${id}`, 'PUT', '', false);
}

export async function removeFromList(id: string): Promise<void> {
  await authedSend<void>(`/me/list/${id}`, 'DELETE', '', false);
}

export type ContinueItem = { movie: Movie; positionSeconds: number; percent: number };

export async function fetchContinue(): Promise<ContinueItem[]> {
  const rows = await authed<
    { video: VideoWithStream; position_seconds: number; percent: number }[]
  >('/me/continue');
  return rows.map((r) => ({
    movie: mapVideo(r.video),
    positionSeconds: r.position_seconds,
    percent: r.percent > 1 ? r.percent / 100 : r.percent, // backend sends 0..100
  }));
}

// ---- series ----

export type SeriesSummary = {
  id: string;
  title: string;
  description: string;
  year: number;
  maturity: string;
  poster: string;
  episodeCount: number;
};
export type Season = { number: number; episodes: Movie[] };
export type SeriesDetail = SeriesSummary & { seasons: Season[] };

type SeriesOutRaw = {
  id: string;
  title: string;
  description: string;
  release_year: number | null;
  maturity_rating: string;
  poster_url: string | null;
  episode_count: number;
};

function mapSeries(s: SeriesOutRaw): SeriesSummary {
  return {
    id: s.id,
    title: s.title,
    description: s.description ?? '',
    year: s.release_year ?? 0,
    maturity: s.maturity_rating || 'All',
    poster: abs(s.poster_url) ?? '',
    episodeCount: s.episode_count,
  };
}

export async function fetchSeries(): Promise<SeriesSummary[]> {
  const rows = await authed<SeriesOutRaw[]>('/series');
  return rows.map(mapSeries);
}

export async function fetchSeriesDetail(id: string): Promise<SeriesDetail> {
  const d = await authed<SeriesOutRaw & { seasons: { number: number; episodes: VideoWithStream[] }[] }>(
    `/series/${id}`,
  );
  return {
    ...mapSeries(d),
    seasons: d.seasons.map((s) => ({ number: s.number, episodes: s.episodes.map(mapVideo) })),
  };
}

// ---- profiles ----

export type Profile = { id: string; name: string; is_kids: boolean; avatar: string };

export async function fetchProfiles(): Promise<Profile[]> {
  return authed<Profile[]>('/profiles');
}

export async function createProfile(name: string, isKids = false, avatar = '#5CE38B'): Promise<Profile> {
  return authedSend<Profile>('/profiles', 'POST', JSON.stringify({ name, is_kids: isKids, avatar }), true);
}

export async function deleteProfile(id: string): Promise<void> {
  await authedSend<void>(`/profiles/${id}`, 'DELETE', '', false);
}

// Save playback position. Fire-and-forget friendly (caller may ignore errors).
export async function putProgress(id: string, positionSeconds: number, durationSeconds?: number): Promise<void> {
  const body: Record<string, number> = { position_seconds: Math.max(0, Math.floor(positionSeconds)) };
  if (durationSeconds && durationSeconds > 0) body.duration_seconds = Math.floor(durationSeconds);
  await authedSend<void>(`/me/progress/${id}`, 'PUT', JSON.stringify(body), true);
}
