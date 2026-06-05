import { Image } from "expo-image";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import type { QuestionWithUserStateDTO } from "@/lib/api/types/question";
import { QuestionResults } from "./question-results";
import { QuestionTypeScreen } from "./question-type-screens";
import type { QuestionVoteHandler } from "./types";

export function QuestionCard({
  question,
  isSubmitting,
  submitError,
  onSubmit,
}: {
  question: QuestionWithUserStateDTO;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: QuestionVoteHandler;
}) {
  const submitResponse = (response: string[] | Record<string, string>) => {
    if (isSubmitting) return;
    onSubmit(question._id, response);
  };

  return (
    <View
      className="gap-5"
      style={{
        borderCurve: "continuous",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      }}
    >
      <QuestionCardHeader question={question} />

      {question.imageUrl && (
        <Image
          source={{ uri: question.imageUrl }}
          className="h-56 w-full rounded-xl bg-muted"
          contentFit="cover"
        />
      )}

      {question.userHasVoted ? (
        <QuestionResults question={question} />
      ) : (
        <QuestionTypeScreen
          question={question}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={submitResponse}
        />
      )}
    </View>
  );
}

function QuestionCardHeader({
  question,
}: {
  question: QuestionWithUserStateDTO;
}) {
  return (
    <View className="gap-2 bg-primary/10 p-4 rounded-xl">
      <Text selectable className="text-2xl font-extrabold text-center">
        {question.question}
      </Text>
    </View>
  );
}
