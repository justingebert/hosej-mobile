import { useQuery } from "@tanstack/react-query";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api/client";
import { API_URL } from "@/lib/config";

export default function Index() {
  // Smoke test: /api/auth/session is public, so it proves the whole chain
  // (Query → fetcher → API_URL → device network) without needing auth.
  const { isLoading, isError, error } = useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<unknown>("/api/auth/session"),
  });

  const status = isLoading
    ? "Checking…"
    : isError
      ? `Failed: ${(error as Error).message}`
      : "Connected ✓";

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center gap-2 bg-white p-6">
        <Text className="text-2xl font-bold text-gray-900">HoseJ Mobile</Text>
        <Text className="text-sm text-gray-500">Phase 0 — Foundation</Text>

        <View className="mt-6 w-full gap-1 rounded-2xl bg-gray-100 p-4">
          <Text className="text-xs uppercase tracking-wide text-gray-500">API base URL</Text>
          <Text className="font-mono text-sm text-gray-900">{API_URL}</Text>

          <Text className="mt-3 text-xs uppercase tracking-wide text-gray-500">
            Dev API connectivity
          </Text>
          <Text className="text-base font-semibold text-gray-900">{status}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
