import { Text, View } from "react-native";
import type { QuestionWithUserStateDTO } from "@/lib/api/types/question";

export function AnsweredPlaceholder({
  question,
}: {
  question: QuestionWithUserStateDTO;
}) {
  return (
    <View className="gap-2 rounded-xl bg-secondary p-4">
      <Text className="text-base font-extrabold text-secondary-foreground">
        You answered this question.
      </Text>
      <Text className="text-sm text-muted-foreground">
        Results preview is a placeholder for now. {question.answers.length} answer
        {question.answers.length === 1 ? "" : "s"} recorded.
      </Text>
    </View>
  );
}

export function ChatPlaceholder() {
  return (
    <View
      className="gap-2 rounded-2xl border border-border bg-card p-5"
      style={{ borderCurve: "continuous" }}
    >
      <Text className="text-lg font-extrabold text-card-foreground">Chat</Text>
      <Text className="text-sm text-muted-foreground">
        Question chat placeholder.
      </Text>
    </View>
  );
}

export function FeaturePlaceholder({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View className="gap-1 rounded-xl border border-border bg-background p-4">
      <Text className="text-base font-extrabold text-foreground">{title}</Text>
      <Text className="text-sm text-muted-foreground">{body}</Text>
    </View>
  );
}
