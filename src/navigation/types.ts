import type { Movie } from '../data/movies';

export type RootStackParamList = {
  Tabs: undefined;
  Detail: { movieId: string };
  // movie: pass the resolved film directly (episodes aren't in the catalog list).
  Player: { movieId: string; fullscreen?: boolean | string; resume?: number; movie?: Movie };
  // VideoForm: add a new film (no videoId) or edit an existing one (videoId set).
  VideoForm: { videoId?: string };
  SeriesDetail: { seriesId: string };
};

export type TabsParamList = {
  Home: undefined;
  Movies: undefined;
  Series: undefined;
  Favorites: undefined;
  Settings: undefined;
};
