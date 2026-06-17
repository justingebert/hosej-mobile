import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useAuth } from "@/lib/auth/auth-context";
import { AuthedStackScreens } from "./authed-stack-screens";

export function RootNavigator() {
  const { needsNameSetup, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading") SplashScreen.hideAsync().catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status === "authed" && needsNameSetup) router.replace("/setup-name");
  }, [needsNameSetup, router, status]);

  if (status === "loading") return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === "authed"}>
        <AuthedStackScreens />
      </Stack.Protected>
      <Stack.Protected guard={status !== "authed"}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}
