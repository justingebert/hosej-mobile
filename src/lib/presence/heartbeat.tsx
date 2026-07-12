import { useEffect } from "react";
import { AppState } from "react-native";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

// Presence heartbeat: advances the user's `lastOnline` so "last seen …" in the
// group members list reflects the mobile app, not just the web client. The
// server (touchLastOnline) throttles the DB write, so this is best-effort and
// deliberately dumb. Isolated as its own deletable unit, like the push feature.

// Client-side gate: skip pointless requests. In-memory (not persisted) on
// purpose — a cold start is exactly when we want a fresh heartbeat.
const THROTTLE_MS = 5 * 60 * 1000;
let lastSentAt = 0;

export function sendHeartbeat() {
  if (Date.now() - lastSentAt < THROTTLE_MS) return;
  lastSentAt = Date.now();
  apiFetch("/api/users/heartbeat", { method: "POST" }).catch(() => {
    // Fire-and-forget; let the next foreground transition retry.
    lastSentAt = 0;
  });
}

/**
 * Mounted once under AuthProvider (next to PushBridge). Sends a heartbeat when
 * the user is authed — on mount/login and on every foreground transition. No
 * polling: AppState fires on transitions, so a backgrounded app sends nothing.
 */
function useHeartbeat() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "authed") return;
    sendHeartbeat();
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") sendHeartbeat();
    });
    return () => sub.remove();
  }, [status]);
}

export function HeartbeatBridge() {
  useHeartbeat();
  return null;
}
