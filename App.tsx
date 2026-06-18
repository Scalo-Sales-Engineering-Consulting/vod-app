import React from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, type LinkingOptions } from '@react-navigation/native';
import { colors } from './src/theme';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { CatalogProvider } from './src/context/CatalogContext';
import { ProfileProvider } from './src/context/ProfileContext';
import RootNavigator from './src/navigation/RootNavigator';
import type { RootStackParamList } from './src/navigation/types';

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, primary: colors.primary },
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: 'home',
          Catalog: 'catalog',
          Favorites: 'favorites',
          Settings: 'settings',
        },
      },
      Detail: 'detail/:movieId',
      Player: 'player/:movieId',
      VideoForm: 'video-form',
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <CatalogProvider>
          <FavoritesProvider>
            <NavigationContainer theme={navTheme} linking={linking}>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </FavoritesProvider>
        </CatalogProvider>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
