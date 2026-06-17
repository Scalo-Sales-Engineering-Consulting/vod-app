# StreamX — VOD Mobile App

A Netflix-style video-on-demand mobile app built with **React Native + Expo (SDK 56)** and TypeScript. Uses bundled mock data — no API key required.

## Screens

| Screen | What it does |
| --- | --- |
| **Home** | Featured hero with Play / More Info + horizontal carousels (Trending, New Releases, Action, Acclaimed, Made for You). |
| **Catalog** | 3-column poster grid with horizontal genre filter chips. |
| **Favorites** | List of saved titles with remove control + empty state. |
| **Settings** | Profile card, playback/account/support sections with toggles. |
| **Detail** | Backdrop hero, metadata, Play, My List / Download / Share actions, synopsis, "More Like This". |

## Run it

```bash
cd vod-app
npm start          # then press i (iOS), a (Android), or scan QR in Expo Go
# or directly:
npm run ios
npm run android
```

## Structure

```
src/
  theme.ts                  Design tokens (colors, spacing, radius, type)
  data/movies.ts            Mock catalog + carousel rows
  context/FavoritesContext  Favorites state (shared across screens)
  components/               MovieCard, MovieRow
  navigation/               Root stack + bottom tabs
  screens/                  Home, Catalog, Favorites, Settings, Detail
```

The same design tokens (`src/theme.ts`) drive the companion Figma file so code and design stay in sync.
