import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function RootNavigation() {
  const { user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAuthGroup =
      segments[0] === 'Login' ||
      segments[0] === 'Register' ||
      segments[0] === 'Welcome';

    if (!user && !inAuthGroup) {
      router.replace('/Welcome');
    }

    if (user && inAuthGroup) {
      router.replace('/(root)/Home');
    }
  }, [user]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}