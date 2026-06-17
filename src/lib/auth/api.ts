import { fetch } from "expo/fetch";
import { API_URL } from "@/lib/config";
import { ApiError } from "@/lib/api/errors";

// Compact user summary returned by every mobile auth endpoint (server-side
// `authUserSummary`). The full profile is fetched separately via GET /api/users.
export type AuthUser = {
  id: string;
  username: string;
  googleConnected: boolean;
};

// Every auth endpoint (register / login / google / refresh) returns this token
// pair. The access token is short-lived; the refresh token rotates on every use.
export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string; // "Bearer"
  expiresIn: number; // access-token lifetime in seconds
  user: AuthUser;
  // Hint for a fresh Google sign-up to prompt for a display name. Always false
  // for device accounts. Surfaced for callers; not acted on yet.
  needsNameSetup: boolean;
};

// The auth endpoints sit deliberately outside the apiFetch wrapper (that wrapper
// refreshes on 401, which would recurse here). So this is a small standalone POST.
async function authPost(path: string, body: unknown): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-hosej-client": "mobile" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Could not reach the HoseJ API.");
  }

  const data = (await res.json().catch(() => null)) as (AuthResponse & { message?: string }) | null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.message || `Request failed (${res.status})`);
  }
  return data as AuthResponse;
}

/** Create a new device account. deviceId must be a UUID. 409 if it already exists. */
export function registerDevice(deviceId: string, userName: string) {
  return authPost("/api/auth/mobile/device/register", { deviceId, userName });
}

/** Sign in to an existing device account. 404 if the deviceId is unknown. */
export function loginWithDeviceId(deviceId: string) {
  return authPost("/api/auth/mobile/device/login", { deviceId });
}

/** Sign in / sign up with a Google id_token obtained natively. 401 if invalid. */
export function loginWithGoogleIdToken(idToken: string) {
  return authPost("/api/auth/mobile/google", { idToken });
}

/**
 * Exchange a refresh token for a fresh token pair. The server ROTATES the refresh
 * token (the old one is invalidated on use), so the caller MUST persist the
 * returned refreshToken. 401 if the refresh token is expired/spent → re-auth.
 */
export function refreshTokens(refreshToken: string) {
  return authPost("/api/auth/mobile/refresh", { refreshToken });
}

/**
 * Revoke a refresh token server-side (sign out this device). Best-effort: the
 * server returns 204 and never errors on an unknown token, and we swallow
 * network failures so local sign-out always proceeds.
 */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/mobile/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-hosej-client": "mobile" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Ignore — local sign-out proceeds regardless.
  }
}
