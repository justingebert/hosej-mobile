import { View } from "react-native";
import { HapticPressable } from "@/components/ui/haptic-pressable";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  stretch = false,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  // Equal-width segments filling the row. Only for a control on its own line —
  // the segments get `flex-1` (flexBasis 0), which collapses the whole control
  // when it sits content-sized next to a label in a row.
  stretch?: boolean;
}) {
  return (
    <View className="flex-row rounded-lg border border-border bg-muted p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <HapticPressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={cn(
              "items-center rounded-md px-3 py-1.5",
              stretch && "flex-1",
              active && "bg-card"
            )}
          >
            <Text className={active ? "font-bold text-foreground" : "text-muted-foreground"}>
              {opt.label}
            </Text>
          </HapticPressable>
        );
      })}
    </View>
  );
}
