export type RootStackParamList = {
  Tabs: undefined;
  Detail: { movieId: string };
  Player: { movieId: string; fullscreen?: boolean | string; resume?: number };
  // VideoForm: add a new film (no videoId) or edit an existing one (videoId set).
  VideoForm: { videoId?: string };
};

export type TabsParamList = {
  Home: undefined;
  Catalog: undefined;
  Favorites: undefined;
  Manage: undefined;
  Settings: undefined;
};
