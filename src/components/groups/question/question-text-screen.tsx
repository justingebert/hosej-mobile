import { TextInput, View } from "react-native";
import type { QuestionInputProps } from "./types";

export function TextQuestionScreen({
  response,
  onResponseChange,
}: Omit<QuestionInputProps, "question">) {
  const value = Array.isArray(response) ? response[0] ?? "" : "";

  return (
    <View>
      <TextInput
        className="min-h-32 rounded-xl border border-border bg-background p-4 text-base text-foreground"
        multiline
        placeholder="Enter your response"
        placeholderTextColor="#777777"
        textAlignVertical="top"
        value={value}
        onChangeText={(nextValue) => onResponseChange(nextValue ? [nextValue] : null)}
      />
    </View>
  );
}
