import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" />
      <Stack.Screen name="Chat" />
      <Stack.Screen name="Contacts" />
      <Stack.Screen name="Settings" />
      <Stack.Screen name="About" />
    </Stack>
  );
}