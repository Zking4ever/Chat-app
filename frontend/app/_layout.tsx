import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import UpdateService from '@/src/services/UpdateService';
import StorageService from '@/src/services/StorageService';

function RootNavigation() {
  const { user, hasSeenOnboarding } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const init = async () => {
      setIsMounted(true);

      const isExpoGo = Constants.appOwnership === 'expo';
      const isWeb = Platform.OS === 'web';

      console.log(`[ABA Environment] OS: ${Platform.OS}, Expo Go: ${isExpoGo}`);

      // Auto-updates only work in native builds (not Expo Go or Web)
      if (!isExpoGo && !isWeb) {
        UpdateService.checkAndApplyUpdateSilently();
      } else {
        console.log('Skipping auto-update check (not a native build environment)');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!isMounted || hasSeenOnboarding === null) return;

    const inAuthScreens =
      segments[0] === 'Welcome' ||
      segments[0] === 'Login' ||
      segments[0] === 'Register';

    // 1. Logged in users go home
    if (user.id !== -1 && inAuthScreens) {
      router.replace('/(root)/Home');
      return;
    }

    // 2. Not logged in users logic
    if (user.id === -1) {
      if (!hasSeenOnboarding) {
        if (segments[0] !== 'Welcome') {
          router.replace('/Welcome');
        }
      } else {
        if (segments[0] === 'Welcome' || !inAuthScreens) {
          router.replace('/Login');
        }
      }
    }
  }, [user, isMounted, hasSeenOnboarding, segments]);

  // Prevent flicker by showing nothing (or a splash screen) until ready
  if (!isMounted || hasSeenOnboarding === null) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}



export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}