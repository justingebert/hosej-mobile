import { View } from "react-native";
import { Text } from "@/components/ui/text";

export function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="gap-1">
      <Text className="text-lg font-bold">{title}</Text>
      <Text className="text-sm text-muted-foreground">{subtitle}</Text>
    </View>
  );
}
