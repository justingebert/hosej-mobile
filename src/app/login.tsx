import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  View,
} from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Sheet, type SheetHandle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { API_URL } from "@/lib/config";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { useInvitePreview } from "@/lib/api/groups";
import { useAuth } from "@/lib/auth/auth-context";
import {
  clearPendingInvite,
  getDeviceId,
  getPendingInvite,
  setDeviceId,
} from "@/lib/auth/session";
import { useGoogleSignIn } from "@/lib/auth/google";
import { useCSSVariable } from "uniwind";

const SUPPORT_EMAIL = "pregame_acid_9o@icloud.com";
const googleLogo = require("../../assets/images/google-g.png");

type Action = "google" | "register" | "restore";
type LostAccountModalHandle = { present: () => void };

export default function LoginScreen() {
  const { registerDevice, loginWithDeviceId, loginWithGoogle } = useAuth();

  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lostAccountRef = useRef<LostAccountModalHandle>(null);

  // Module state, not reactive — fine here: it only changes via this screen's own
  // actions (404 → cleared), and those set state, so the re-render re-reads it.
  const storedDeviceId = getDeviceId();

  // Reached via the invite deep link: join/[code] stashes the code (in-memory) and
  // redirects here, so the whole logged-out join is one screen. Show the group inline.
  const inviteCode = getPendingInvite();
  const invitePreview = useInvitePreview(inviteCode ?? "");
  const inviteName = inviteCode ? invitePreview.data?.name : null;
  const inviteMemberCount = inviteCode ? invitePreview.data?.memberCount : null;
  const showInvite = !!inviteCode && (invitePreview.isPending || !!inviteName);

  // Invalid/revoked code: drop it so a doomed background join doesn't fire after auth,
  // and fall back to the plain sign-in screen.
  useEffect(() => {
    if (inviteCode && invitePreview.isError) clearPendingInvite();
  }, [inviteCode, invitePreview.isError]);

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
        {showInvite ? (
          <View className="items-center gap-1">
            {invitePreview.isPending ? (
              <>
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <Text className="text-muted-foreground">You&apos;ve been invited to join</Text>
                <Text className="text-center text-3xl font-extrabold text-foreground">
                  {inviteName}
                </Text>
                {typeof inviteMemberCount === "number" ? (
                  <Text className="text-sm text-muted-foreground">
                    {inviteMemberCount} member{inviteMemberCount === 1 ? "" : "s"}
                  </Text>
                ) : null}
              </>
            )}
          </View>
        ) : (
          <Text variant="h1">HoseJ</Text>
        )}

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

          {/* A device account signed out involuntarily (failed token refresh)
              keeps its stored deviceId — offer the way back in before "start
              fresh" creates a second account. A dead credential (account
              deleted server-side → 404) is dropped so the button disappears. */}
          {storedDeviceId ? (
            <Button
              variant="secondary"
              disabled={busy !== null}
              onPress={() =>
                run("restore", async () => {
                  try {
                    await loginWithDeviceId(storedDeviceId);
                  } catch (e) {
                    if (e instanceof ApiError && e.status === 404) await setDeviceId(null);
                    throw e;
                  }
                })
              }
            >
              <Text>{busy === "restore" ? "Restoring…" : "Restore previous account"}</Text>
            </Button>
          ) : null}

          <Button
            variant="secondary"
            disabled={busy !== null}
            onPress={() => run("register", () => registerDevice())}
          >
            <Text>{busy === "register" ? "Creating…" : "Start with on-device account"}</Text>
          </Button>

          <Pressable className="self-center py-1" onPress={() => lostAccountRef.current?.present()}>
            <Text className="text-sm text-muted-foreground underline">Lost your account?</Text>
          </Pressable>
        </View>
      </View>

      <ConsentFooter />

      <LostAccountModal
        ref={lostAccountRef}
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
const LostAccountModal = forwardRef<LostAccountModalHandle, {
  onRecover: (deviceId: string) => Promise<void>;
}>(function LostAccountModal({ onRecover }, ref) {
  const modalRef = useRef<SheetHandle>(null);
  const [deviceId, setDeviceId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef<number[]>([]);

  useImperativeHandle(ref, () => ({ present: () => modalRef.current?.present() }), []);

  const reset = () => {
    setDeviceId("");
    setError(null);
  };

  const close = () => modalRef.current?.dismiss();

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
    <Sheet
      ref={modalRef}
      onDismiss={reset}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
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

      <BottomSheetTextInput
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
    </Sheet>
  );
});
