import { Link, type Href, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export function GroupDashboardScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const questionHref = `/groups/${groupId}/question` as Href;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow gap-6 p-5"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="w-full flex-1 gap-6">
        <Link href={questionHref} asChild>
          <Pressable
            className="min-h-36 flex-row items-center justify-between overflow-hidden rounded-2xl border border-border bg-card p-5"
            style={{
              borderCurve: "continuous",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <View className="flex-1 gap-2">
              <Text className="text-xs font-extrabold uppercase text-muted-foreground">
                Daily Question
              </Text>
              <Text className="text-2xl font-extrabold text-card-foreground">
                Answer the daily question
              </Text>
              <Text className="text-sm text-muted-foreground">
                Open the group question screen
              </Text>
            </View>

            <Text className="pl-4 text-2xl font-bold text-muted-foreground">{">"}</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}
