import { fetch } from "expo/fetch";
import { API_URL } from "@/lib/config";
import { ApiError, getErrorMessage } from "@/lib/api/errors";
import { refreshTokens } from "@/lib/auth/api";
import {
  clearTokens,
  getAuthRevision,
  getAccessToken,
  getRefreshToken,
  notifyUnauthorized,
  setTokens,
} from "@/lib/auth/session";

// Re-exported so existing importers (`@/lib/api/client`) keep their import path
// after these moved to ./errors. See errors.ts for why they live there.
export { ApiError, getErrorMessage };

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res = await rawFetch(path, options, getAccessToken());

  // The access token is short-lived (~15 min). On 401, mint a fresh one from the
  // refresh token (single-flight — see refreshAccessToken) and retry once.
  // Only terminal refresh-token failures sign out; transient network/server
  // failures keep the stored session for the next request to retry.
  if (res.status === 401 && getRefreshToken()) {
    const refresh = await refreshAccessToken();
    if (refresh.status === "refreshed") {
      res = await rawFetch(path, options, refresh.accessToken);
      if (res.status === 401) {
        await clearTokens();
        notifyUnauthorized();
      }
    } else if (refresh.status === "failed") {
      await clearTokens();
      notifyUnauthorized();
    } else if (refresh.status === "unavailable") {
      throw refresh.error;
    }
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (body as { message?: string })?.message) || `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return body as T;
}

async function rawFetch(
  path: string,
  options: RequestInit,
  token: string | null
): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-hosej-client": "mobile",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Could not reach the HoseJ API.");
  }
}

// Single-flight refresh: the refresh token ROTATES (the server invalidates the
// old one on use), so concurrent 401s must share ONE refresh — otherwise the
// second call sends an already-spent token and spuriously signs the user out.
// Returns stale when logout/account switch changed local auth state while the
// refresh request was in flight.
type RefreshResult =
  | { status: "refreshed"; accessToken: string }
  | { status: "failed" }
  | { status: "unavailable"; error: unknown }
  | { status: "stale" };

let refreshInFlight: Promise<RefreshResult> | null = null;

function refreshAccessToken(): Promise<RefreshResult> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRefresh(): Promise<RefreshResult> {
  const rt = getRefreshToken();
  if (!rt) return { status: "failed" };
  const revision = getAuthRevision();
  try {
    const res = await refreshTokens(rt);
    if (getAuthRevision() !== revision || getRefreshToken() !== rt) {
      return { status: "stale" };
    }
    await setTokens(res.accessToken, res.refreshToken);
    return { status: "refreshed", accessToken: res.accessToken };
  } catch (error) {
    if (getAuthRevision() !== revision) return { status: "stale" };
    return isTerminalRefreshError(error) ? { status: "failed" } : { status: "unavailable", error };
  }
}

function isTerminalRefreshError(error: unknown): boolean {
  return error instanceof ApiError && [400, 401, 403].includes(error.status);
}
