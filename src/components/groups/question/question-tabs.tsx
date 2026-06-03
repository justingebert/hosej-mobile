import { Pressable, Text, View } from "react-native";
import type { FlatQuestionItem } from "./types";

export function QuestionTabs({
  activeQuestionId,
  questions,
  onSelect,
}: {
  activeQuestionId: string;
  questions: FlatQuestionItem[];
  onSelect: (questionId: string) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {questions.map(({ question, label }) => {
        const isActive = question._id === activeQuestionId;

        return (
          <Pressable
            key={question._id}
            className={`min-h-11 flex-1 items-center justify-center rounded-xl border px-3 py-2 ${
              isActive ? "border-primary bg-primary" : "border-border bg-card"
            }`}
            style={{ borderCurve: "continuous" }}
            onPress={() => onSelect(question._id)}
          >
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              className={`text-center text-sm font-bold ${
                isActive ? "text-primary-foreground" : "text-card-foreground"
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
