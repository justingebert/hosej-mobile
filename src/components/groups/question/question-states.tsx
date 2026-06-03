import { Pressable, Text, View } from "react-native";
import { API_URL } from "@/lib/config";

export function QuestionSkeleton() {
  return (
    <View className="gap-4">
      <View className="h-3 w-1/2 rounded-full bg-muted" />
      <View
        className="gap-4 rounded-2xl border border-border bg-card p-5 opacity-70"
        style={{ borderCurve: "continuous" }}
      >
        <View className="h-6 w-1/3 rounded bg-muted" />
        <View className="h-8 w-full rounded bg-muted" />
        <View className="h-12 w-full rounded-xl bg-muted" />
        <View className="h-12 w-full rounded-xl bg-muted" />
      </View>
    </View>
  );
}

export function EmptyQuestionState() {
  return (
    <View className="flex-1 justify-center gap-3 rounded-2xl">
      <Text className="text-center text-2xl font-extrabold text-card-foreground">
        No active questions
      </Text>
      <Text className="text-center text-sm text-muted-foreground">
        Activate or create a question from the existing web flow for now.
      </Text>
    </View>
  );
}

export function QuestionErrorState({
  error,
  isRetrying,
  onRetry,
}: {
  error: Error | null;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <View
      className="gap-3 rounded-2xl border border-border bg-card p-5"
      style={{ borderCurve: "continuous" }}
    >
      <Text className="text-sm font-extrabold text-destructive">
        Could not load questions
      </Text>
      <Text selectable className="text-base text-card-foreground">
        {error?.message}
      </Text>
      <Text selectable className="text-xs text-muted-foreground">
        API: {API_URL}
      </Text>
      <Pressable
        className="self-start rounded-full bg-primary px-4 py-2 disabled:opacity-60"
        disabled={isRetrying}
        onPress={onRetry}
      >
        <Text className="text-sm font-bold text-primary-foreground">
          {isRetrying ? "Retrying..." : "Try again"}
        </Text>
      </Pressable>
    </View>
  );
}
