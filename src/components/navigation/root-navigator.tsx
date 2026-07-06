import { useEffect } from "react";
import { Link, Stack, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { CircleHelp, User, X } from "lucide-react-native";
import { useJoinByCode } from "@/lib/api/groups";
import { useAuth } from "@/lib/auth/auth-context";
import { clearPendingInvite, getPendingInvite } from "@/lib/auth/session";
import { GroupHeaderButton, GroupHeaderTitle, } from "@/components/groups/group-header";
import { Icon } from "@/components/ui/icon";
import { ConnectionRequiredScreen } from "@/components/navigation/connection-required-screen";

export function RootNavigator() {
  const { isRetryingSession, needsNameSetup, retrySession, signOut, status } = useAuth();
  const router = useRouter();
  const join = useJoinByCode();
  const scheme = useColorScheme();
  const sheetBackground = scheme === "dark" ? "#0a0a0a" : "#ffffff";

  useEffect(() => {
    if (status !== "loading") SplashScreen.hideAsync().catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status === "authed" && needsNameSetup) router.replace("/setup-name");
  }, [needsNameSetup, router, status]);

  useEffect(() => {
    if (status !== "authed" || needsNameSetup) return;
    const pending = getPendingInvite();
    if (!pending) return;
    clearPendingInvite();
    join.mutate(pending);
    router.replace("/");
  }, [status, needsNameSetup, join, router]);

  if (status === "loading") return null;

  if (status === "offline") {
    return (
      <ConnectionRequiredScreen
        isRetrying={isRetryingSession}
        onRetry={() => void retrySession()}
        onSignOut={() => void signOut()}
      />
    );
  }

  // Screens are declared inline: expo-router's <Stack> only recognises literal
  // <Stack.Screen> / <Stack.Protected> children, so the authed group must NOT be
  // wrapped in a custom component (that silently drops the guard).
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: sheetBackground } }}>
      <Stack.Protected guard={status === "authed"}>
        <Stack.Screen
          name="setup-name"
          options={{
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: sheetBackground },
            headerTitle: () => <GroupHeaderTitle>Profile</GroupHeaderTitle>,
            headerTitleAlign: "center",
            headerBackVisible: false,
          }}
        />
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
                  <Icon as={CircleHelp} className="size-5" />
                </GroupHeaderButton>
              </Link>
            ),
            headerRight: () => (
              <Link href="/settings" asChild>
                <GroupHeaderButton>
                  <Icon as={User} className="size-5" />
                </GroupHeaderButton>
              </Link>
            ),
          }}
        />
        <Stack.Screen
          name="help"
          options={{
            presentation: "modal",
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: sheetBackground },
            contentStyle: { backgroundColor: sheetBackground },
            headerTitle: () => <GroupHeaderTitle>Help</GroupHeaderTitle>,
            headerTitleAlign: "center",
            headerBackVisible: false,
            headerRight: () => (
              <GroupHeaderButton onPress={router.back}>
                <Icon as={X} className="size-5" />
              </GroupHeaderButton>
            ),
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: "modal",
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: sheetBackground },
            contentStyle: { backgroundColor: sheetBackground },
            headerTitle: () => <GroupHeaderTitle>Settings</GroupHeaderTitle>,
            headerTitleAlign: "center",
            headerBackVisible: false,
            headerRight: () => (
              <GroupHeaderButton onPress={router.back}>
                <Icon as={X} className="size-5" />
              </GroupHeaderButton>
            )
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
        <Stack.Screen name="groups/[groupId]" />
      </Stack.Protected>
      <Stack.Protected guard={status !== "authed"}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      {/* Available signed-in or out: the invite deep link must open for new users. */}
      <Stack.Screen name="join/[code]" />
    </Stack>
  );
}
