import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export function GroupQuestionScreen() {
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow gap-6 p-5"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="w-full flex-1 gap-6">
        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            onPress={router.back}
          >
            <Text>back</Text>
          </Pressable>

          <Text className="flex-1 text-center text-3xl font-extrabold text-foreground">
            Daily Question
          </Text>

          <View className="h-11 w-11" />
        </View>

        <View
          className="rounded-2xl border border-border bg-card p-5"
          style={{
            borderCurve: "continuous",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Text className="text-xl font-extrabold text-card-foreground">
            Question route
          </Text>
          <Text className="mt-2 text-sm text-muted-foreground">
            Static placeholder for the daily question screen.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
