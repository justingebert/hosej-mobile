import * as SecureStore from "expo-secure-store";

// Mobile auth uses a short-lived access token (~15 min, sent as Bearer) plus a
// rotating refresh token (exchanged for a new pair). Keep the access token in
// memory; persist only long-lived credentials in Keychain/Keystore.
const ACCESS_KEY = "hosej.accessToken";
const REFRESH_KEY = "hosej.refreshToken";
const DEVICE_ID_KEY = "hosej.deviceId";
const PENDING_DEVICE_ID_KEY = "hosej.pendingDeviceId";

// In-memory mirror so the request layer (apiFetch) can read tokens
// synchronously on every call. Hydrated once on launch via loadTokens().
let accessToken: string | null = null;
let refreshToken: string | null = null;
let deviceId: string | null = null;
let pendingDeviceId: string | null = null;
let authRevision = 0;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function getAuthRevision(): number {
  return authRevision;
}

export function getDeviceId(): string | null {
  return deviceId;
}

export function getPendingDeviceId(): string | null {
  return pendingDeviceId;
}

/** Hydrate the in-memory tokens from storage. Call once on app launch. */
export async function loadTokens(): Promise<void> {
  try {
    accessToken = null;
    await SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => {});
    [refreshToken, deviceId, pendingDeviceId] = await Promise.all([
      SecureStore.getItemAsync(REFRESH_KEY),
      SecureStore.getItemAsync(DEVICE_ID_KEY),
      SecureStore.getItemAsync(PENDING_DEVICE_ID_KEY),
    ]);
  } catch {
    // SecureStore is unavailable (e.g. on web) — fall back to no stored session.
    accessToken = null;
    refreshToken = null;
    deviceId = null;
    pendingDeviceId = null;
  }
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  accessToken = access;
  refreshToken = refresh;
  authRevision += 1;
  try {
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  } catch {
    // Unavailable (web) or rejected (e.g. over the iOS keychain size limit):
    // keep the in-memory tokens so the session works this run — it just won't
    // survive a reload.
  }
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  authRevision += 1;
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  } catch {
    // Ignore — see setTokens.
  }
}

export async function setDeviceId(nextDeviceId: string | null): Promise<void> {
  deviceId = nextDeviceId;
  try {
    if (nextDeviceId) {
      await SecureStore.setItemAsync(DEVICE_ID_KEY, nextDeviceId);
    } else {
      await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
    }
  } catch {
    // Keep the in-memory value for this run; see setTokens.
  }
}

export async function setPendingDeviceId(nextDeviceId: string): Promise<void> {
  pendingDeviceId = nextDeviceId;
  try {
    await SecureStore.setItemAsync(PENDING_DEVICE_ID_KEY, nextDeviceId);
  } catch {
    // Keep the in-memory value for this run; see setTokens.
  }
}

export async function clearPendingDeviceId(): Promise<void> {
  pendingDeviceId = null;
  try {
    await SecureStore.deleteItemAsync(PENDING_DEVICE_ID_KEY);
  } catch {
    // Ignore — see setTokens.
  }
}

// Single callback the request layer invokes when a request is 401 and the token
// refresh also fails, so the React auth layer can drop to the signed-out state
// (and the router gate redirect to /login). One handler — there is exactly one
// AuthProvider — so this is a plain ref, not a pub/sub.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export function notifyUnauthorized(): void {
  onUnauthorized?.();
}
