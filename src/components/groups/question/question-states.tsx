import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export function QuestionSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton className="h-3 w-1/2 rounded-full" />
      <View
        className="gap-4 rounded-2xl border border-border bg-card p-5 opacity-70"
        style={{ borderCurve: "continuous" }}
      >
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </View>
    </View>
  );
}
