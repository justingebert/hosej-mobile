import { Alert, Linking } from "react-native";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

const FEEDBACK_EMAIL = "pregame_acid_9o@icloud.com";

/** Opens a pre-filled bug-report email. Accepts button props for restyling. */
export function ReportBugButton(props: ButtonProps) {
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
    <Button {...props} onPress={handleBugReport}>
      <Text>Report a Problem</Text>
    </Button>
  );
}
