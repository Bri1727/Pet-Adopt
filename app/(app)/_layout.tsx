import { useAuth } from "@features/auth/presentation/hooks/useAuth";
import { Stack } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

export default function AppLayout() {
  const { logout } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#b3006a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="chat/[roomId]" options={{ headerShown: false }} />
      <Stack.Screen name="general-chat" options={{ headerShown: false }} />
      <Stack.Screen name="create-mascota" options={{ headerShown: false }} />
      <Stack.Screen name="mascota/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="sellers" options={{ headerShown: false }} />
    </Stack>
  );
}
