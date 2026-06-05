import { View } from "react-native";
import { Text } from "@/components/ui/text";

export function QuestionProgress({
  completionPercentage,
}: {
  completionPercentage: number;
}) {
  const width = `${Math.max(0, Math.min(100, completionPercentage))}%` as `${number}%`;

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-extrabold uppercase text-muted-foreground">
          Group progress
        </Text>
        <Text className="text-xs font-bold text-muted-foreground">
          {completionPercentage}%
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-muted">
        <View className="h-2 rounded-full bg-primary" style={{ width }} />
      </View>
    </View>
  );
}
