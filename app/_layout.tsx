import { Stack } from "expo-router";

export default function RootLayout() {
    return <Stack>
                <Stack.Screen name="Welcome"/>
                <Stack.Screen name='Login' options={{headerShown:true}} />
            </Stack>
        }