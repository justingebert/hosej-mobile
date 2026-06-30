import { useRef } from "react";
import { View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { HowItWorks } from "@/components/help/how-it-works";
import { ReportBugButton } from "@/components/help/report-bug-button";
import { OnboardingSheet, type OnboardingSheetRef } from "@/components/onboarding/onboarding-sheet";
import { API_URL } from "@/lib/config";
import { clearOnboardingSeen } from "@/lib/onboarding";
import { toastSuccess } from "@/lib/toast";

const openLegalPage = (path: "/terms" | "/privacy") => WebBrowser.openBrowserAsync(`${API_URL}${path}`);

export function HelpScreen() {
  const onboardingRef = useRef<OnboardingSheetRef>(null);

  return (
    <Screen>
      <View className="flex-1 justify-between gap-8">
        <View className="gap-4">
          <Button variant="outline" onPress={() => onboardingRef.current?.present()}>
            <Text>Show tutorial</Text>
          </Button>

          {__DEV__ ? (
            <Button
              variant="ghost"
              onPress={() =>
                void clearOnboardingSeen().then(() =>
                  toastSuccess("Onboarding reset", "Reload the app to see it auto-open")
                )
              }
            >
              <Text>Reset onboarding (dev)</Text>
            </Button>
          ) : null}

          <ReportBugButton />

          <HowItWorks />
        </View>

        <View className="flex-row gap-4">
          <Button variant="outline" className="flex-1" onPress={() => void openLegalPage("/terms")}>
            <Text>Terms</Text>
          </Button>
          <Button variant="outline" className="flex-1" onPress={() => void openLegalPage("/privacy")}>
            <Text>Privacy</Text>
          </Button>
        </View>
      </View>

      <OnboardingSheet ref={onboardingRef} />
    </Screen>
  );
}
