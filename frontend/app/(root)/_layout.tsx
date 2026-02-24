import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" />
      <Stack.Screen name="Chat" options={{ headerShown: true, title: 'Chat' }} />
      <Stack.Screen name="Contacts" options={{ headerShown: true, title: 'Select Contact' }} />
      <Stack.Screen name="About" />
    </Stack>
  );
}