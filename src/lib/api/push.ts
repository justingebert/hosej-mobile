import { apiFetch } from "./client";

export type PushPlatform = "ios" | "android";

// New Expo-push token endpoints (plural). The singular /api/users/push-token is the
// frozen legacy web-FCM route — not used here.
export function registerPushToken(token: string, platform: PushPlatform) {
  return apiFetch<{ message: string }>("/api/users/push-tokens", {
    method: "POST",
    body: JSON.stringify({ token, platform }),
  });
}

export function unregisterPushToken(token: string) {
  return apiFetch<{ message: string }>("/api/users/push-tokens", {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });
}
