import { useCallback } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

// Finishes the OAuth redirect when the browser returns to the app.
WebBrowser.maybeCompleteAuthSession();

const clientIds = {
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

/**
 * Whether the Google OAuth client ID for the CURRENT platform is configured.
 * `useIdTokenAuthRequest` THROWS synchronously when its platform's client ID is
 * missing, so only mount `useGoogleSignIn` (e.g. render the Google button) when
 * this is true.
 */
export const isGoogleConfigured = Boolean(
  Platform.select({ ios: clientIds.ios, android: clientIds.android, default: clientIds.web })
);

/**
 * Isolated Google id_token acquisition. This is the ONLY module that touches
 * expo-auth-session; everything else deals purely in the resulting id_token
 * string, so the implementation can be swapped without touching callers.
 *
 * Heads up:
 *  - Only call this hook when `isGoogleConfigured` (it throws otherwise).
 *  - expo-auth-session's Google provider is DEPRECATED (still functional).
 *  - Google sign-in does NOT complete in Expo Go — it needs the app's own URL
 *    scheme. It works in a development/standalone build once the OAuth client IDs
 *    (EXPO_PUBLIC_GOOGLE_* env vars) are set and the server's
 *    GOOGLE_MOBILE_CLIENT_IDS allow-list includes them.
 *  - For a fully native flow later, replace the internals with
 *    @react-native-google-signin/google-signin — callers only depend on
 *    `promptForIdToken(): Promise<string | null>`.
 */
export function useGoogleSignIn() {
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: clientIds.ios,
    androidClientId: clientIds.android,
    webClientId: clientIds.web,
  });

  // Resolves to the Google id_token, or null if the user cancelled / it failed.
  const promptForIdToken = useCallback(async (): Promise<string | null> => {
    const result = await promptAsync();
    return result.type === "success" ? (result.params.id_token ?? null) : null;
  }, [promptAsync]);

  // `request` is null until the auth request finishes loading — gate the UI on it.
  return { promptForIdToken, ready: request != null };
}
