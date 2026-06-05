import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "@/lib/query";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="groups/create"
              options={{
                presentation: "formSheet",
                sheetAllowedDetents: [0.5],
                sheetGrabberVisible: true,
              }}
            />
            <Stack.Screen
              name="groups/join"
              options={{
                presentation: "formSheet",
                sheetAllowedDetents: [0.5],
                sheetGrabberVisible: true,
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
