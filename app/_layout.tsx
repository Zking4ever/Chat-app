import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name='index' options={{headerShown:false}} />
      <Stack.Screen name="home" options={{ title: 'Home' }} />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
      <Stack.Screen name="catagory-details" options={{ title: 'Catagory' }} />
    </Stack>
  );
}