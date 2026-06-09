import { View } from "react-native";
import { Text } from "@/components/ui/text";
import type { QuestionWithUserStateDTO, VoteResponseValue } from "@/lib/api/types/question";
import { QuestionResults } from "./question-results";
import { QuestionOptions } from "./question-options";
import { StyledImage } from "./styled-image";
import type { QuestionResponseChangeHandler } from "./types";

export function QuestionTabContent({
  question,
  response,
  onResponseChange,
}: {
  question: QuestionWithUserStateDTO;
  response: VoteResponseValue | null;
  onResponseChange: QuestionResponseChangeHandler;
}) {
  return (
    <View className="gap-6">

      <QuestionCardHeader question={question} />

      {question.imageUrl && (
        <StyledImage
          uri={question.imageUrl}
          cacheKey={question.image}
          className="h-56 w-full rounded-xl"
        />
      )}

      {question.userHasVoted ? (
        <QuestionResults question={question} />
      ) : (
        <QuestionOptions
          question={question}
          response={response}
          onResponseChange={onResponseChange}
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
