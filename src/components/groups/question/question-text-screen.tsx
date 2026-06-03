import { TextInput, View } from "react-native";
import { QuestionSubmitButton } from "./question-submit-button";

export function TextQuestionScreen({
  value,
  isSubmitting,
  canSubmit,
  submitError,
  onChange,
  onSubmit,
}: {
  value: string;
  isSubmitting: boolean;
  canSubmit: boolean;
  submitError: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View className="gap-4">
      <TextInput
        className="min-h-32 rounded-xl border border-border bg-background p-4 text-base text-foreground"
        multiline
        placeholder="Enter your response"
        placeholderTextColor="#777777"
        textAlignVertical="top"
        value={value}
        onChangeText={onChange}
      />
      <QuestionSubmitButton
        canSubmit={canSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={onSubmit}
      />
    </View>
  );
}
