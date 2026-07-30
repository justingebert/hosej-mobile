import { View } from "react-native";
import { HapticPressable } from "@/components/ui/haptic-pressable";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

const PRESETS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export function SongRatingSlider({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (value: number) => void;
}) {
  return (
    <View className="flex-row flex-wrap justify-center gap-2">
      {PRESETS.map((preset) => (
        <HapticPressable
          key={preset}
          onPress={() => onValueChange(preset)}
          className={cn(
            "size-11 items-center justify-center rounded-full bg-secondary",
            value === preset && "bg-primary"
          )}
        >
          <Text
            className={cn(
              "text-sm font-bold text-secondary-foreground",
              value === preset && "text-primary-foreground"
            )}
          >
            {preset}
          </Text>
        </HapticPressable>
      ))}
    </View>
  );
}
