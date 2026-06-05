import { Alert, Linking, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

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
    <Screen>
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
        <Button variant="outline">
          <Text>Show tutorial</Text>
        </Button>

        <Button onPress={handleBugReport}>
          <Text>Report a bug</Text>
        </Button>

        <View className="flex-row gap-4">
          <Button variant="outline" className="flex-1">
            <Text>Terms</Text>
          </Button>
          <Button variant="outline" className="flex-1">
            <Text>Privacy</Text>
          </Button>
        </View>
      </View>
    </Screen>
  );
}
