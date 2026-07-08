import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { PlayerProvider } from '../contexts/PlayerContext';
import { TutorialProvider } from '../contexts/TutorialContext';
import TutorialOverlay from '../components/tutorial/TutorialOverlay';
import { Colors } from '../constants/theme';
import { initI18n } from '../i18n';

function RootNavigator() {
  const { currentUser, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!currentUser && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (currentUser && inAuthGroup) {
      router.replace('/(tabs)/roster');
    }
  }, [currentUser, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="player/add" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="player/[id]" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  if (!i18nReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <PlayerProvider>
        <TutorialProvider>
          <StatusBar style="light" />
          <View style={{ flex: 1 }}>
            <RootNavigator />
            <TutorialOverlay />
          </View>
        </TutorialProvider>
      </PlayerProvider>
    </AuthProvider>
  );
}
