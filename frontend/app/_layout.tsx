import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import UpdateService from '@/src/services/UpdateService';
import SocketService from '@/src/services/SocketService';

import CallNotification from '@/components/CallNotification';

function RootNavigation() {
  const { user, hasSeenOnboarding } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const isExpoGo = Constants.appOwnership === 'expo';
    const isWeb = Platform.OS === 'web';

    console.log(`[ABA Environment] OS: ${Platform.OS}, Expo Go: ${isExpoGo}`);

    if (!isExpoGo && !isWeb) {
      UpdateService.checkAndApplyUpdateSilently();
    }
  }, []);

  const [incomingCall, setIncomingCall] = useState<{
    from: number;
    name: string;
    callType: 'audio' | 'video';
    signal: any;
  } | null>(null);

  // Stabilize socket connection and incoming call listener
  useEffect(() => {
    if (user.id === -1 || !isMounted) return;

    const socket = SocketService.getSocket(user.id);

    const handleIncomingCall = (data: any) => {
      console.log('Global incoming call received:', data);
      setIncomingCall({
        from: data.from,
        name: data.name,
        callType: data.callType,
        signal: data.signal
      });
    };

    socket.on('incoming_call', handleIncomingCall);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
    };
  }, [user.id, isMounted]);

  const handleAnswer = () => {
    if (!incomingCall) return;
    const { from, name, callType, signal } = incomingCall;
    setIncomingCall(null);
    router.push({
      pathname: '/(root)/Call',
      params: {
        convoId: from,
        callType: callType,
        incoming: 'true',
        fromName: name,
        signal: JSON.stringify(signal)
      }
    });
  };

  const handleDecline = () => {
    if (!incomingCall) return;
    const socket = SocketService.getSocket(user.id);
    socket.emit('reject_call', { to: incomingCall.from });
    setIncomingCall(null);
  };

  useEffect(() => {
    if (!isMounted || hasSeenOnboarding === null) return;

    const inAuthScreens =
      segments[0] === 'Welcome' ||
      segments[0] === 'Login' ||
      segments[0] === 'Register';

    // 1. Logged in users go home
    if (user.id !== -1 && inAuthScreens) {
      router.replace('/(root)/Home');
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
  }, [user.id, isMounted, hasSeenOnboarding, segments]);

  if (!isMounted || hasSeenOnboarding === null) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {incomingCall && (
        <CallNotification
          visible={!!incomingCall}
          callerName={incomingCall.name}
          callType={incomingCall.callType}
          onAnswer={handleAnswer}
          onDecline={handleDecline}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}
