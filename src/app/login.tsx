import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { API_URL } from "@/lib/config";
import { getErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useGoogleSignIn } from "@/lib/auth/google";
import { useCSSVariable } from "uniwind";

const SUPPORT_EMAIL = "pregame_acid_9o@icloud.com";
const googleLogo = require("../../assets/images/google-g.png");

type Action = "google" | "register";

export default function LoginScreen() {
  const { registerDevice, loginWithDeviceId, loginWithGoogle } = useAuth();

  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lostOpen, setLostOpen] = useState(false);

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

  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <View className="grow justify-center gap-10">
        <Text variant="h1">HoseJ</Text>

        <View className="gap-3">
          {error ? <Text className="text-center text-sm text-destructive">{error}</Text> : null}

          <GoogleSignInButton
            busy={busy === "google"}
            disabled={busy !== null}
            onIdToken={(getIdToken) =>
              run("google", async () => {
                const idToken = await getIdToken();
                if (idToken) await loginWithGoogle(idToken);
              })
            }
          />

          <Button
            variant="secondary"
            disabled={busy !== null}
            onPress={() => run("register", () => registerDevice())}
          >
            <Text>{busy === "register" ? "Creating…" : "Start without account"}</Text>
          </Button>

          <Pressable className="self-center py-1" onPress={() => setLostOpen(true)}>
            <Text className="text-sm text-muted-foreground underline">Lost your account?</Text>
          </Pressable>
        </View>
      </View>

      <ConsentFooter />

      <LostAccountModal
        visible={lostOpen}
        onClose={() => setLostOpen(false)}
        onRecover={loginWithDeviceId}
      />
    </View>
  );
}

// Primary CTA using the shared Button: surface follows the theme's primary color
// (dark in light mode, light in dark mode) and the transparent multicolor "G"
// reads on either. Always rendered — Google is configured in every dev/prod build
// (Expo Go isn't used).
function GoogleSignInButton({
  busy,
  disabled,
  onIdToken,
}: {
  busy: boolean;
  disabled: boolean;
  onIdToken: (getIdToken: () => Promise<string | null>) => void;
}) {
  const { promptForIdToken, ready } = useGoogleSignIn();
  const spinnerColor = useCSSVariable("--color-primary-foreground");
  const blocked = disabled || !ready;
  return (
    <Button
      variant="default"
      className="h-12 rounded-2xl"
      disabled={blocked}
      onPress={() => onIdToken(promptForIdToken)}
    >
      {busy ? (
        <ActivityIndicator color={typeof spinnerColor === "string" ? spinnerColor : undefined} />
      ) : (
        <>
          <Image source={googleLogo} style={{ width: 20, height: 20 }} contentFit="contain" />
          <Text>Continue with Google</Text>
        </>
      )}
    </Button>
  );
}

function ConsentFooter() {
  const open = (path: string) => WebBrowser.openBrowserAsync(`${API_URL}${path}`);
  return (
    <Text className="text-center text-xs text-muted-foreground">
      By continuing, you agree to our{" "}
      <Text className="text-xs text-muted-foreground underline" onPress={() => open("/terms")}>
        Terms of Service
      </Text>{" "}
      and{" "}
      <Text className="text-xs text-muted-foreground underline" onPress={() => open("/privacy")}>
        Privacy Policy
      </Text>
      .
    </Text>
  );
}

const RECOVERY_WINDOW_MS = 60 * 1000;
const RECOVERY_MAX_ATTEMPTS = 5;

// Bottom-sheet modal mirroring the webapp's "Lost your account?" drawer: paste a
// device ID to restore, or mail support. Client-side rate-limited on top of the
// server's auth limiter.
function LostAccountModal({
  visible,
  onClose,
  onRecover,
}: {
  visible: boolean;
  onClose: () => void;
  onRecover: (deviceId: string) => Promise<void>;
}) {
  const [deviceId, setDeviceId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef<number[]>([]);

  const close = () => {
    setDeviceId("");
    setError(null);
    onClose();
  };

  const canAttempt = () => {
    const now = Date.now();
    attemptsRef.current = attemptsRef.current.filter((t) => now - t < RECOVERY_WINDOW_MS);
    return attemptsRef.current.length < RECOVERY_MAX_ATTEMPTS;
  };

  const handleRestore = async () => {
    const trimmed = deviceId.trim();
    if (!trimmed) return;
    if (!canAttempt()) {
      setError("Too many attempts. Please wait a minute before trying again.");
      return;
    }
    attemptsRef.current.push(Date.now());
    setError(null);
    setSubmitting(true);
    try {
      await onRecover(trimmed);
      // On success the root gate swaps this screen out.
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable className="absolute inset-0 bg-black/50" onPress={close} />
        <View className="gap-4 rounded-t-3xl bg-card p-6 pb-10">
          <View className="gap-1">
            <Text variant="h3">Lost your account?</Text>
            <Text className="text-sm text-muted-foreground">
              Device accounts live on this device. Paste your device ID to restore, or reach out
              to{" "}
              <Text
                className="text-sm text-muted-foreground underline"
                onPress={() =>
                  Linking.openURL(
                    `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("HoseJ — Lost account")}`
                  )
                }
              >
                {SUPPORT_EMAIL}
              </Text>
              .
            </Text>
          </View>

          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            placeholder="Device ID"
            value={deviceId}
            onChangeText={setDeviceId}
            className="rounded-xl border border-border bg-background p-4 text-foreground"
          />

          {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

          <Button disabled={!deviceId.trim() || submitting} onPress={() => void handleRestore()}>
            <Text>{submitting ? "Restoring…" : "Restore"}</Text>
          </Button>
          <Button variant="ghost" onPress={close}>
            <Text>Close</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
