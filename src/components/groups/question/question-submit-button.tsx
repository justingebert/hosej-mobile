import { ActivityIndicator, Pressable, Text, View } from "react-native";

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
      <Pressable
        className={`min-h-12 items-center justify-center rounded-xl px-4 py-3 ${
          canSubmit && !isSubmitting ? "bg-primary" : "bg-muted"
        }`}
        disabled={!canSubmit || isSubmitting}
        onPress={onSubmit}
      >
        {isSubmitting ? (
          <ActivityIndicator />
        ) : (
          <Text
            className={`text-base font-extrabold ${
              canSubmit ? "text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Submit
          </Text>
        )}
      </Pressable>
    </View>
  );
}
