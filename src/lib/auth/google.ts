import { useCallback } from "react";
import { Platform } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Google OAuth client IDs from env (see .env.local for dev / eas.json for builds).
// iosClientId starts the native sign-in (bound to the app's bundle id). webClientId
// is required for the library to return an id_token, and it sets the id_token's
// aud = the web client id — which is the server's existing AUTH_GOOGLE_ID, so the
// server verifies it with no GOOGLE_MOBILE_CLIENT_IDS change needed.
const clientIds = {
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

/**
 * Whether Google sign-in is configured for the current platform. The Google
 * button is gated on this so we never call signIn() without a client id.
 */
export const isGoogleConfigured = Boolean(
  Platform.select({ ios: clientIds.ios, default: clientIds.web })
);

if (isGoogleConfigured) {
  GoogleSignin.configure({
    iosClientId: clientIds.ios,
    webClientId: clientIds.web,
  });
}

/**
 * Native Google sign-in via @react-native-google-signin. Resolves to the Google
 * id_token (verified server-side at POST /api/auth/mobile/google), or null if
 * the user cancelled. 
 */
export function useGoogleSignIn() {
  const promptForIdToken = useCallback(async (): Promise<string | null> => {
    if (Platform.OS === "android") await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (response.type !== "success") return null; // user cancelled
    return response.data.idToken;
  }, []);

  // signIn() is imperative (no async request to warm up), so always ready.
  return { promptForIdToken, ready: true };
}
