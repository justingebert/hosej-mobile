import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/auth/auth-context";
import {
  addResponseListener,
  addTokenRotationListener,
  getColdStartTargetGroupId,
  getPermissionState,
  routeToGroupQuestion,
  setupForegroundHandler,
  syncPushRegistration,
} from "./push";

/**
 * Mounted once under AuthProvider: installs the foreground handler + listeners
 * (once) and re-registers the push token whenever the user is authed (launch,
 * login, account switch). Never prompts for permission — that's the Settings row.
 */
export function usePushBridge() {
  const { status, needsNameSetup } = useAuth();
  // App launched by a notification tap. Held in state (not routed immediately):
  // it resolves while auth is still "loading", when RootNavigator renders no
  // Stack yet — routing then would be dropped.
  const [coldStartGroupId, setColdStartGroupId] = useState<string | null>(null);

  useEffect(() => {
    setupForegroundHandler();
    const tokenSub = addTokenRotationListener();
    const responseSub = addResponseListener();
    void getColdStartTargetGroupId().then(setColdStartGroupId);
    return () => {
      tokenSub.remove();
      responseSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!coldStartGroupId) return;
    if (status === "unauthed") {
      // No session to open the group with — drop it so it can't fire after a
      // later login as a stale navigation.
      setColdStartGroupId(null);
      return;
    }
    if (status !== "authed" || needsNameSetup) return;
    setColdStartGroupId(null);
    routeToGroupQuestion(coldStartGroupId);
  }, [coldStartGroupId, status, needsNameSetup]);

  useEffect(() => {
    if (status === "authed") void syncPushRegistration();
  }, [status]);
}

export function PushBridge() {
  usePushBridge();
  return null;
}

/** Settings: reactive OS-permission state, refreshed on screen focus. */
export function usePushPermission() {
  const [state, setState] = useState({ granted: false, canAskAgain: true });
  const refresh = useCallback(async () => {
    setState(await getPermissionState());
  }, []);
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );
  return { ...state, refresh };
}
