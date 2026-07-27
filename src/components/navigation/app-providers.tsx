import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/ui/toast";
import { AuthProvider } from "@/lib/auth/auth-context";
import { PushBridge } from "@/lib/push/hooks";
import { HeartbeatBridge } from "@/lib/presence/heartbeat";
import { queryClient } from "@/lib/query";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <BottomSheetModalProvider>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <PushBridge />
                <HeartbeatBridge />
                {children}
              </AuthProvider>
              <StatusBar style="auto" />
            </QueryClientProvider>
            <Toast config={toastConfig} topOffset={60} />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
