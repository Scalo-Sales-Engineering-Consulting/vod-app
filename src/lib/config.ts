// Backend base URL. The app talks to the FastAPI VOD backend (repo: Dessowsky/Test,
// branch claude/vod-streaming-backend-hx2u3p).
//
// Physical iPhone: must use the Mac's LAN IP (localhost won't reach the Mac from
// the phone). Both devices must be on the same Wi-Fi. Find the Mac IP with:
//   ipconfig getifaddr en0
// iOS simulator: 'http://localhost:8000' also works.
//
// Override at runtime without editing code via env var EXPO_PUBLIC_API_URL.
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'http://192.168.31.240:8000';

// Demo account seeded by `python -m scripts.seed_catalog`. Catalog is visible to
// any logged-in user, so these creds are enough to browse the seeded films.
export const DEMO_EMAIL = 'demo@vodflix.local';
export const DEMO_PASSWORD = 'demo12345';

// Absolute-ize a relative backend path (stream_url / poster_url).
export const abs = (path?: string | null): string | undefined =>
  path ? (path.startsWith('http') ? path : `${BASE_URL}${path}`) : undefined;
