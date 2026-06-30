import { View } from "react-native";
import { cn } from "@/lib/utils";

export function StepIndicator({ total, current }: { total: number; current: number }) {
  return (
    <View className="flex-row gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={cn(
            "h-1.5 rounded-full",
            i === current ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
          )}
        />
      ))}
    </View>
  );
}
