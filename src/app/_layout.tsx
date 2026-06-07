import "../global.css";

import { Link, Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "@/lib/query";
import {
  GroupHeaderButton,
  GroupHeaderSpacer,
  GroupHeaderTitle,
} from "@/components/groups/group-header";
import { ArrowLeft, CircleHelp, User } from "lucide-react-native";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const router = useRouter();
  const scheme = useColorScheme();
  const sheetBackground = scheme === "dark" ? "#0a0a0a" : "#ffffff";

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="index"
              options={{
                headerShown: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: sheetBackground },
                headerTitle: () => <GroupHeaderTitle>Groups</GroupHeaderTitle>,
                headerTitleAlign: "center",
                headerLeft: () => (
                  <Link href="/help" asChild>
                    <GroupHeaderButton>
                      <CircleHelp className="h-5 w-5" />
                    </GroupHeaderButton>
                  </Link>
                ),
                headerRight: () => (
                  <Link href="/settings" asChild>
                    <GroupHeaderButton>
                      <User className="h-5 w-5" />
                    </GroupHeaderButton>
                  </Link>
                ),
              }}
            />
            <Stack.Screen
              name="help"
              options={{
                headerShown: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: sheetBackground },
                headerTitle: () => <GroupHeaderTitle>Help</GroupHeaderTitle>,
                headerTitleAlign: "center",
                headerBackVisible: false,
                headerLeft: () => (
                  <GroupHeaderButton onPress={router.back}>
                    <ArrowLeft className="h-5 w-5" />
                  </GroupHeaderButton>
                ),
                headerRight: () => <GroupHeaderSpacer />,
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                headerShown: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: sheetBackground },
                headerTitle: () => <GroupHeaderTitle>Settings</GroupHeaderTitle>,
                headerTitleAlign: "center",
                headerBackVisible: false,
                headerLeft: () => (
                  <GroupHeaderButton onPress={router.back}>
                    <ArrowLeft className="h-5 w-5" />
                  </GroupHeaderButton>
                ),
                headerRight: () => <GroupHeaderSpacer />,
              }}
            />
            <Stack.Screen
              name="groups/create"
              options={{
                presentation: "formSheet",
                sheetAllowedDetents: "fitToContents",
                sheetGrabberVisible: true,
                contentStyle: { backgroundColor: sheetBackground },
              }}
            />
            <Stack.Screen
              name="groups/join"
              options={{
                presentation: "formSheet",
                sheetAllowedDetents: "fitToContents",
                sheetGrabberVisible: true,
                contentStyle: { backgroundColor: sheetBackground },
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
