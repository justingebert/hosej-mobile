import { ScrollView, Text, View } from "react-native";

export function GroupTabPlaceholderScreen({ title }: { title: string }) {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow gap-6 p-5"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="w-full flex-1 justify-center gap-3">
        <Text className="text-center text-4xl font-extrabold text-foreground">{title}</Text>
        <Text className="text-center text-sm text-muted-foreground">
          Static placeholder tab.
        </Text>
      </View>
    </ScrollView>
  );
}
