import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/ui/toast";
import { AuthProvider } from "@/lib/auth/auth-context";
import { queryClient } from "@/lib/query";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
          <StatusBar style="auto" />
        </QueryClientProvider>
        <Toast config={toastConfig} topOffset={60} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
