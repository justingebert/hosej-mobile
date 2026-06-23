import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { ReportBugButton } from "@/components/help/report-bug-button";

export function HelpScreen() {
  return (
    <Screen>
      <View className="flex-1 justify-between">
      <View className="gap-4">
        {/* Tutorial — placeholder until onboarding exists on mobile */}
        <Button variant="outline">
          <Text>Show tutorial</Text>
        </Button>

        <ReportBugButton />
      </View>

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
