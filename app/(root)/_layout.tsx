import { Tabs } from 'expo-router';

export default function AuthLayout() {
  return (
     <Tabs screenOptions={{headerShown:false}}>
      <Tabs.Screen name="About" />
      <Tabs.Screen name="home" />
    </Tabs>
    );
}