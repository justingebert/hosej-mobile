import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { router } from "expo-router";
import { queryClient } from "@/lib/query";
import { chatKeys } from "@/lib/api/chat";
import { registerPushToken, unregisterPushToken, type PushPlatform } from "@/lib/api/push";
import { getAccessToken } from "@/lib/auth/session";

// Imperative core for Expo push (no React). The bridge hook wires the side effects;
// Settings + auth call the register/enable/disable functions directly. Isolated so
// the whole feature is deletable as a unit when web FCM is retired.

const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
const platform: PushPlatform = Platform.OS === "android" ? "android" : "ios";
const REGISTERED_PUSH_TOKEN_KEY = "hosej.expoPushToken";

// The Expo token last sent to the server this session — lets logout DELETE it.
let lastRegisteredToken: string | null = null;

// The chat the user is currently viewing. An incoming push for it is silenced
// (no banner) — the open screen refreshes off the same signal instead.
let activeChatId: string | null = null;
export function setActiveChat(chatId: string | null) {
  activeChatId = chatId;
}

export type PermissionResult = "granted" | "denied";

async function getStoredRegisteredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REGISTERED_PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function setStoredRegisteredToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await SecureStore.setItemAsync(REGISTERED_PUSH_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(REGISTERED_PUSH_TOKEN_KEY);
    }
  } catch {
    // SecureStore can be unavailable on unsupported platforms; keep push best-effort.
  }
}

export async function getPermissionGranted(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

/** Settings UI state: granted gates delivery; canAskAgain is false once iOS has blocked us. */
export async function getPermissionState(): Promise<{ granted: boolean; canAskAgain: boolean }> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return { granted: status === "granted", canAskAgain };
}

async function fetchAndRegister(
  devicePushToken?: Notifications.DevicePushToken
): Promise<void> {
  if (!Device.isDevice) {
    // Simulators have no APNs token and lack the aps-environment entitlement.
    console.warn("[push] not a physical device — skipping push token registration");
    return;
  }
  if (!projectId) {
    console.warn("[push] no EAS projectId — cannot fetch an Expo push token");
    return;
  }
  // When the rotation listener hands us a device token, pass it through: calling
  // getExpoPushTokenAsync without it falls back to getDevicePushTokenAsync, which
  // re-fires that listener and loops (see addTokenRotationListener).
  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
    ...(devicePushToken ? { devicePushToken } : {}),
  });
  if (token === lastRegisteredToken) return; // already registered this session
  await registerPushToken(token, platform);
  lastRegisteredToken = token;
  await setStoredRegisteredToken(token);
}

/** Settings "enable": fire the OS prompt, then register the token if granted. */
export async function enablePush(): Promise<PermissionResult> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return "denied";
  await fetchAndRegister();
  return "granted";
}

/** Launch/login refresh: re-register only when permission is already granted (never prompts). */
export async function syncPushRegistration(): Promise<void> {
  try {
    if (!(await getPermissionGranted())) return;
    await fetchAndRegister();
  } catch (err) {
    console.error("[push] sync failed", err);
  }
}

/** Logout: drop the server-side token so the device stops receiving pushes. Best-effort. */
export async function disablePush(): Promise<void> {
  const token = lastRegisteredToken ?? (await getStoredRegisteredToken());
  lastRegisteredToken = null;
  // Nothing registered this session, or no valid session to authorize the delete
  // (logged out, or the account was just deleted — which already drops every token
  // server-side). A stale token is reaped on send or re-bound to the next login.
  if (!token || !getAccessToken()) return;
  try {
    await unregisterPushToken(token);
    await setStoredRegisteredToken(null);
  } catch (err) {
    console.warn("[push] unregister skipped (best-effort)", err);
  }
}

// ---- foreground handler + listeners (wired once by the bridge) ----

let handlerReady = false;

export function setupForegroundHandler() {
  if (handlerReady) return;
  handlerReady = true;
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as
        | { type?: string; chatId?: string; groupId?: string }
        | undefined;
      if (data?.type === "chat" && data.chatId && data.groupId) {
        // Live signal for an open chat (chat has no polling of its own).
        queryClient.invalidateQueries({
          queryKey: chatKeys.detail(data.groupId, data.chatId),
        });
        if (activeChatId === data.chatId) {
          return {
            shouldShowBanner: false,
            shouldShowList: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          };
        }
      }
      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
  });
}

// v1: land on the group's active question — chat read-write lives there and a
// new-question push is about that screen. Per-question/chat routing is a follow-up.
export function routeToGroupQuestion(groupId: string) {
  router.push({ pathname: "/groups/[groupId]/question", params: { groupId } });
}

function handleResponse(data: Record<string, unknown> | undefined) {
  const groupId = typeof data?.groupId === "string" ? data.groupId : null;
  if (!groupId) return;
  routeToGroupQuestion(groupId);
}

export function addResponseListener() {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    handleResponse(response.notification.request.content.data);
  });
}

export function addTokenRotationListener() {
  return Notifications.addPushTokenListener((devicePushToken) => {
    // The native token rotated → re-register. Pass the token through rather than
    // calling syncPushRegistration (which re-fetches the device token and would
    // re-trigger this very listener → infinite loop).
    void fetchAndRegister(devicePushToken).catch((err) =>
      console.error("[push] rotation re-register failed", err)
    );
  });
}

/**
 * App opened from a notification while killed — the tap's target group. Routing
 * happens in the bridge once the authed navigator exists: at read time auth is
 * still resolving and RootNavigator renders null, so a router.push here would
 * fire before any Stack is mounted and be dropped.
 */
export async function getColdStartTargetGroupId(): Promise<string | null> {
  const response = await Notifications.getLastNotificationResponseAsync();
  const data = response?.notification.request.content.data as
    | Record<string, unknown>
    | undefined;
  return typeof data?.groupId === "string" ? data.groupId : null;
}
