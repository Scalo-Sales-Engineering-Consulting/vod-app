import React from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, type LinkingOptions } from '@react-navigation/native';
import { colors } from './src/theme';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { CatalogProvider } from './src/context/CatalogContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';
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
          Movies: 'movies',
          Series: 'series',
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

// Gate the app behind sign-in: show LoginScreen until authenticated, then
// mount the data providers (which fetch with the chosen token).
function Gate() {
  const { authed } = useAuth();
  if (!authed) {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen />
      </>
    );
  }
  return (
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
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
