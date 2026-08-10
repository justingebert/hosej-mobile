import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as Crypto from "expo-crypto";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { disablePush } from "@/lib/push/push";
import {
  loginWithDeviceId as apiLoginWithDeviceId,
  loginWithGoogleIdToken as apiLoginWithGoogle,
  logout as apiLogout,
  refreshTokens,
  registerDevice as apiRegisterDevice,
  type AuthResponse,
  type AuthUser,
} from "@/lib/auth/api";
import {
  clearPendingDeviceId,
  clearTokens,
  getDeviceId,
  getPendingDeviceId,
  getRefreshToken,
  loadTokens,
  setDeviceId,
  setPendingDeviceId,
  setTokens,
  setUnauthorizedHandler,
} from "@/lib/auth/session";

type AuthStatus = "loading" | "authed" | "unauthed" | "offline";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  deviceId: string | null;
  needsNameSetup: boolean;
  isRetryingSession: boolean;
  completeNameSetup: (username: string) => void;
  registerDevice: () => Promise<void>;
  loginWithDeviceId: (deviceId: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  linkGoogle: (idToken: string) => Promise<void>;
  retrySession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isTerminalRefreshError(error: unknown): boolean {
  return error instanceof ApiError && [400, 401, 403].includes(error.status);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [deviceId, setDeviceIdState] = useState<string | null>(null);
  const [needsNameSetup, setNeedsNameSetup] = useState(false);
  const [isRetryingSession, setIsRetryingSession] = useState(false);

  // Apply a successful auth response: persist the token pair, set the user, go
  // authed. Every auth/refresh endpoint returns this same shape.
  const applyAuth = useCallback(async (res: AuthResponse, nextDeviceId?: string | null) => {
    await setTokens(res.accessToken, res.refreshToken);
    if (nextDeviceId !== undefined) await setDeviceId(nextDeviceId);
    setDeviceIdState(nextDeviceId !== undefined ? nextDeviceId : getDeviceId());
    setUser(res.user);
    setNeedsNameSetup(res.needsNameSetup);
    setStatus("authed");
  }, []);

  // Drop all client auth state. `clearStore` is false when the tokens are already
  // gone (the request layer cleared them before forcing sign-out).
  const reset = useCallback(
    async (clearStore: boolean, clearDevice = false) => {
      if (clearStore) await clearTokens();
      if (clearDevice) {
        await setDeviceId(null);
        await clearPendingDeviceId();
      }
      setDeviceIdState(null);
      setNeedsNameSetup(false);
      setIsRetryingSession(false);
      setUser(null);
      setStatus("unauthed");
      // Drop the previous account's cached data so switching accounts is clean.
      queryClient.clear();
    },
    [queryClient]
  );

  const recoveryInFlight = useRef<Promise<boolean> | null>(null);
  const recoverDeviceSession = useCallback((): Promise<boolean> => {
    if (!recoveryInFlight.current) {
      recoveryInFlight.current = (async () => {
        const storedDeviceId = getDeviceId();
        if (!storedDeviceId) return false;
        try {
          await applyAuth(await apiLoginWithDeviceId(storedDeviceId), storedDeviceId);
          return true;
        } catch {
          return false;
        }
      })().finally(() => {
        recoveryInFlight.current = null;
      });
    }
    return recoveryInFlight.current;
  }, [applyAuth]);

  const restoreStoredSession = useCallback(
    async ({
      isActive = () => true,
      markRetrying = false,
    }: {
      isActive?: () => boolean;
      markRetrying?: boolean;
    } = {}) => {
      if (markRetrying) setIsRetryingSession(true);
      await loadTokens();
      if (!isActive()) return;
      setDeviceIdState(getDeviceId());
      const rt = getRefreshToken();
      if (!rt) {
        // No refresh token but a device credential still on file means the
        // session was lost involuntarily (a rotation that never persisted, a
        // failed keychain write) — an explicit signOut clears the deviceId. A
        // fresh install has neither, so this costs it no launch latency.
        const recovered = await recoverDeviceSession();
        if (!isActive()) return;
        if (!recovered) setStatus("unauthed");
        if (markRetrying) setIsRetryingSession(false);
        return;
      }
      try {
        const res = await refreshTokens(rt);
        if (!isActive()) return;
        await applyAuth(res);
      } catch (error) {
        if (!isActive()) return;
        if (isTerminalRefreshError(error)) {
          const recovered = await recoverDeviceSession();
          if (!isActive()) return;
          if (!recovered) await reset(true);
        } else {
          setStatus("offline");
        }
      } finally {
        if (markRetrying && isActive()) setIsRetryingSession(false);
      }
    },
    [applyAuth, recoverDeviceSession, reset]
  );

  const signOut = useCallback(async () => {
    // Drop the push token while the session is still valid (DELETE needs the access
    // token, which reset() clears). Best-effort — never blocks logout.
    await disablePush();
    // Clear local state first so in-flight refreshes cannot resurrect the session.
    const rt = getRefreshToken();
    await reset(true, true);
    if (rt) await apiLogout(rt);
  }, [reset]);

  // Boot: hydrate the stored tokens and exchange the refresh token for a fresh
  // pair. Terminal auth failures sign out; transient network/server failures
  // keep the stored session for the next request to retry.
  useEffect(() => {
    let active = true;
    (async () => {
      await restoreStoredSession({ isActive: () => active });
    })();
    return () => {
      active = false;
    };
  }, [restoreStoredSession]);

  const retrySession = useCallback(
    () => restoreStoredSession({ markRetrying: true }),
    [restoreStoredSession]
  );

  // Let the request layer force a sign-out when a 401 can't be refreshed. It has
  // already cleared the tokens; this re-authenticates a device account if it can,
  // and otherwise clears the remaining local auth state. Keeps the stored
  // deviceId (involuntary — see the boot handler above).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void (async () => {
        if (await recoverDeviceSession()) return;
        await reset(false);
      })();
    });
    return () => setUnauthorizedHandler(null);
  }, [recoverDeviceSession, reset]);

  const registerDevice = useCallback(
    async () => {
      // Fresh device account: a random UUID is the account's only credential. The
      // user can read it back in Settings to sign in elsewhere later. Keep a
      // pending UUID across failed attempts so a lost response can't create a
      // second account on retry. No name is sent — the account starts as the
      // "New user" placeholder and the server returns needsNameSetup, which routes
      // the user to the setup-name screen.
      let nextDeviceId = getPendingDeviceId();
      if (!nextDeviceId) {
        nextDeviceId = Crypto.randomUUID();
        await setPendingDeviceId(nextDeviceId);
      }

      try {
        const res = await apiRegisterDevice(nextDeviceId);
        await applyAuth(res, nextDeviceId);
        await clearPendingDeviceId();
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          const res = await apiLoginWithDeviceId(nextDeviceId);
          await applyAuth(res, nextDeviceId);
          await clearPendingDeviceId();
          return;
        }
        throw error;
      }
    },
    [applyAuth]
  );

  const loginWithDeviceId = useCallback(
    async (nextDeviceId: string) => {
      const normalizedDeviceId = nextDeviceId.trim().toLowerCase();
      await applyAuth(await apiLoginWithDeviceId(normalizedDeviceId), normalizedDeviceId);
      await clearPendingDeviceId();
    },
    [applyAuth]
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      await applyAuth(await apiLoginWithGoogle(idToken), null);
      await clearPendingDeviceId();
    },
    [applyAuth]
  );

  const linkGoogle = useCallback(
    async (idToken: string) => {
      const res = await apiFetch<AuthResponse>("/api/auth/mobile/google/link", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });
      await applyAuth(res, null);
      await clearPendingDeviceId();
    },
    [applyAuth]
  );

  const completeNameSetup = useCallback((username: string) => {
    setUser((currentUser) => (currentUser ? { ...currentUser, username } : currentUser));
    setNeedsNameSetup(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        deviceId,
        needsNameSetup,
        isRetryingSession,
        completeNameSetup,
        registerDevice,
        loginWithDeviceId,
        loginWithGoogle,
        linkGoogle,
        retrySession,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
