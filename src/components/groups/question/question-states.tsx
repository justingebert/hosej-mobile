import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export function QuestionSkeleton() {
  return (
    <View className="gap-6">
      {/* prompt */}
      <View className="gap-3">
        <Skeleton className="h-7 w-3/4 rounded-md" />
        <Skeleton className="h-7 w-1/2 rounded-md" />
      </View>
      {/* options */}
      <View className="gap-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </View>
    </View>
  );
}
