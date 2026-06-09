import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row rounded-lg border border-border bg-muted p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={
              active
                ? "items-center rounded-md bg-card px-3 py-1.5"
                : "items-center rounded-md px-3 py-1.5"
            }
          >
            <Text className={active ? "font-bold text-foreground" : "text-muted-foreground"}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
