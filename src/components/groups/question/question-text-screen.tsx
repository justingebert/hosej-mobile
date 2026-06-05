import { useState } from "react";
import { TextInput, View } from "react-native";
import { QuestionSubmitButton } from "./question-submit-button";
import type { QuestionResponseSubmitHandler } from "./types";

export function TextQuestionScreen({
  isSubmitting,
  submitError,
  onSubmit,
}: {
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: QuestionResponseSubmitHandler;
}) {
  const [value, setValue] = useState("");
  const trimmedValue = value.trim();
  const canSubmit = trimmedValue.length > 0;

  return (
    <View className="gap-4">
      <TextInput
        className="min-h-32 rounded-xl border border-border bg-background p-4 text-base text-foreground"
        multiline
        placeholder="Enter your response"
        placeholderTextColor="#777777"
        textAlignVertical="top"
        value={value}
        onChangeText={setValue}
      />
      <QuestionSubmitButton
        canSubmit={canSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={() => onSubmit([trimmedValue])}
      />
    </View>
  );
}
