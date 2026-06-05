import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

const FEEDBACK_EMAIL = "pregame_acid_9o@icloud.com";

export function HelpScreen() {
  const router = useRouter();

  const handleBugReport = async () => {
    const subject = encodeURIComponent("HoseJ — Bug report");
    const body = encodeURIComponent(
      [
        "Describe the bug:",
        "",
        "",
        "Steps to reproduce:",
        "1. ",
        "2. ",
        "",
        "Expected vs. actual:",
        "",
      ].join("\n")
    );
    try {
      await Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`);
    } catch {
      Alert.alert("No mail app found", `Email us at ${FEEDBACK_EMAIL}`);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow gap-6 p-5"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => router.back()}>
          <Text className="text-foreground">Back</Text>
        </Pressable>
        <Text className="text-2xl font-extrabold text-foreground">Help</Text>
        <View className="w-10" />
      </View>

      <View className="gap-4">
        <Text className="text-center text-muted-foreground">
          This is a private app in development.
        </Text>

        {/* Tutorial — placeholder until onboarding exists on mobile */}
        <Pressable className="rounded-full border border-border bg-card px-4 py-3">
          <Text className="text-center font-bold text-card-foreground">Show tutorial</Text>
        </Pressable>

        <Pressable onPress={handleBugReport} className="rounded-full bg-primary px-4 py-3">
          <Text className="text-center font-bold text-primary-foreground">Report a bug</Text>
        </Pressable>

        <View className="flex-row gap-4">
          <Pressable className="flex-1 rounded-full border border-border bg-card px-4 py-3">
            <Text className="text-center font-bold text-card-foreground">Terms</Text>
          </Pressable>
          <Pressable className="flex-1 rounded-full border border-border bg-card px-4 py-3">
            <Text className="text-center font-bold text-card-foreground">Privacy</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
