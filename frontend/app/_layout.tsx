import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function RootNavigation() {
  const { user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const inAuthScreens =
      segments[0] === 'Welcome' ||
      segments[0] === 'Login' ||
      segments[0] === 'Register';

    if (user.id === -1 && !inAuthScreens) {
      router.replace('/Welcome');
    }

    if (user.id !== -1 && inAuthScreens) {
      router.replace('/(root)/Home');
    }
  }, [user, isMounted]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}