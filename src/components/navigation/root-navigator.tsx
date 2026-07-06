import { useEffect } from "react";
import { Link, Stack, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { CircleHelp, User, X } from "lucide-react-native";
import { useJoinByCode } from "@/lib/api/groups";
import { useAuth } from "@/lib/auth/auth-context";
import { clearPendingInvite, getPendingInvite } from "@/lib/auth/session";
import { GroupHeaderButton, GroupHeaderTitle } from "@/components/groups/group-header";
import { Icon } from "@/components/ui/icon";
import { ConnectionRequiredScreen } from "@/components/navigation/connection-required-screen";

export function RootNavigator() {
  const { isRetryingSession, needsNameSetup, retrySession, signOut, status } = useAuth();
  const router = useRouter();
  const join = useJoinByCode();
  const scheme = useColorScheme();
  const sheetBackground = scheme === "dark" ? "#0a0a0a" : "#ffffff";
  const sharedHeaderOptions = {
    headerShown: true,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: sheetBackground },
    headerTitleAlign: "center" as const,
  };
  const modalHeaderOptions = (title: string) => ({
    ...sharedHeaderOptions,
    presentation: "modal" as const,
    contentStyle: { backgroundColor: sheetBackground },
    headerTitle: () => <GroupHeaderTitle>{title}</GroupHeaderTitle>,
    headerBackVisible: false,
    headerRight: () => (
      <GroupHeaderButton onPress={router.back}>
        <Icon as={X} className="size-5" />
      </GroupHeaderButton>
    ),
  });
  const formSheetOptions = {
    presentation: "formSheet" as const,
    sheetAllowedDetents: "fitToContents" as const,
    sheetGrabberVisible: true,
    contentStyle: { backgroundColor: sheetBackground },
  };

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
            ...sharedHeaderOptions,
            headerTitle: () => <GroupHeaderTitle>Profile</GroupHeaderTitle>,
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="index"
          options={{
            ...sharedHeaderOptions,
            headerTitle: () => <GroupHeaderTitle>Groups</GroupHeaderTitle>,
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
          options={modalHeaderOptions("Help")}
        />
        <Stack.Screen
          name="settings"
          options={modalHeaderOptions("Settings")}
        />
        <Stack.Screen name="groups/create" options={formSheetOptions} />
        <Stack.Screen name="groups/join" options={formSheetOptions} />
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
