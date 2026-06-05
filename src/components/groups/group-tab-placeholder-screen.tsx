import { View } from "react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

export function GroupTabPlaceholderScreen({ title }: { title: string }) {
  return (
    <Screen>
      <View className="w-full flex-1 justify-center gap-3">
        <Text className="text-center text-4xl font-extrabold text-foreground">{title}</Text>
        <Text className="text-center text-sm text-muted-foreground">
          Static placeholder tab.
        </Text>
      </View>
    </Screen>
  );
}
