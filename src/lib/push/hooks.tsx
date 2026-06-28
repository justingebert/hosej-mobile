import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/auth/auth-context";
import {
  addResponseListener,
  addTokenRotationListener,
  getPermissionState,
  handleColdStartResponse,
  setupForegroundHandler,
  syncPushRegistration,
} from "./push";

/**
 * Mounted once under AuthProvider: installs the foreground handler + listeners
 * (once) and re-registers the push token whenever the user is authed (launch,
 * login, account switch). Never prompts for permission — that's the Settings row.
 */
export function usePushBridge() {
  const { status } = useAuth();

  useEffect(() => {
    setupForegroundHandler();
    const tokenSub = addTokenRotationListener();
    const responseSub = addResponseListener();
    void handleColdStartResponse();
    return () => {
      tokenSub.remove();
      responseSub.remove();
    };
  }, []);

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
