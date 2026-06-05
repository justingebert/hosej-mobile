import { ActivityIndicator, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export function QuestionSubmitButton({
  canSubmit,
  isSubmitting,
  submitError,
  onSubmit,
}: {
  canSubmit: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}) {
  return (
    <View className="gap-3">
      {submitError && (
        <Text selectable className="text-sm font-bold text-destructive">
          {submitError}
        </Text>
      )}
      <Button disabled={!canSubmit || isSubmitting} onPress={onSubmit}>
        {isSubmitting ? <ActivityIndicator /> : <Text>Submit</Text>}
      </Button>
    </View>
  );
}
