import { useState } from "react";
import { TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { getErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { isGoogleConfigured, useGoogleSignIn } from "@/lib/auth/google";

type Action = "google" | "register" | "device";

export default function LoginScreen() {
  const { registerDevice, loginWithDeviceId, loginWithGoogle } = useAuth();

  const [userName, setUserName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: Action, fn: () => Promise<void>) => {
    setError(null);
    setBusy(action);
    try {
      await fn();
      // On success the root gate swaps this screen out — no manual navigation.
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen contentContainerClassName="grow justify-center gap-6 p-6">
      <View className="gap-1">
        <Text variant="h1">HoseJ</Text>
        <Text className="text-center text-muted-foreground">Sign in to continue</Text>
      </View>

      {error ? <Text className="text-center text-sm text-destructive">{error}</Text> : null}

      {isGoogleConfigured ? (
        <GoogleSignInButton
          busy={busy}
          onIdToken={(getIdToken) =>
            run("google", async () => {
              const idToken = await getIdToken();
              if (idToken) await loginWithGoogle(idToken);
            })
          }
        />
      ) : (
        <View className="gap-1.5">
          <Button disabled>
            <Text>Continue with Google</Text>
          </Button>
          <Text className="text-center text-xs text-muted-foreground">
            Google needs a dev build + EXPO_PUBLIC_GOOGLE_* client IDs.
          </Text>
        </View>
      )}

      <Card>
        <CardHeader>
          <CardTitle>New test account</CardTitle>
          <CardDescription>Create a fresh device account to develop with.</CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          <TextInput
            autoCapitalize="words"
            placeholder="Display name"
            value={userName}
            onChangeText={setUserName}
            className="rounded-xl border border-border bg-card p-4 text-foreground"
          />
          <Button
            variant="secondary"
            disabled={!userName.trim() || busy !== null}
            onPress={() => run("register", () => registerDevice(userName.trim()))}
          >
            <Text>{busy === "register" ? "Creating…" : "Create account"}</Text>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log in with device ID</CardTitle>
          <CardDescription>Paste an existing device ID to sign in as that user.</CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Device ID"
            value={deviceId}
            onChangeText={setDeviceId}
            className="rounded-xl border border-border bg-card p-4 text-foreground"
          />
          <Button
            variant="secondary"
            disabled={!deviceId.trim() || busy !== null}
            onPress={() => run("device", () => loginWithDeviceId(deviceId))}
          >
            <Text>{busy === "device" ? "Signing in…" : "Log in"}</Text>
          </Button>
        </CardContent>
      </Card>
    </Screen>
  );
}

// Lives in its own component (not inlined in LoginScreen) so the throwing
// useGoogleSignIn hook is only ever mounted when Google is configured.
function GoogleSignInButton({
  busy,
  onIdToken,
}: {
  busy: Action | null;
  onIdToken: (getIdToken: () => Promise<string | null>) => void;
}) {
  const { promptForIdToken, ready } = useGoogleSignIn();
  return (
    <Button disabled={!ready || busy !== null} onPress={() => onIdToken(promptForIdToken)}>
      <Text>{busy === "google" ? "Connecting…" : "Continue with Google"}</Text>
    </Button>
  );
}
