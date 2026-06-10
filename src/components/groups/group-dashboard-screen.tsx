import { Link, type Href } from "expo-router";
import { useGroupId } from "@/lib/group-id";
import { Pressable, View } from "react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

export function GroupDashboardScreen() {
  const groupId = useGroupId();
  const questionHref = `/groups/${groupId}/question` as Href;

  return (
    <Screen>
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
                Answer todays question
              </Text>
              <Text className="text-sm text-muted-foreground">
                Open the group question screen
              </Text>
            </View>

            <Text className="pl-4 text-2xl font-bold text-muted-foreground">{""}</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}
