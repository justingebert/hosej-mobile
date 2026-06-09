import { ActivityIndicator, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export function QuestionSubmitButton({
  canSubmit,
  isSubmitting,
  onSubmit,
}: {
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <View>
      <Button disabled={!canSubmit || isSubmitting} onPress={onSubmit}>
        {isSubmitting ? <ActivityIndicator /> : <Text>Submit</Text>}
      </Button>
    </View>
  );
}
