import { View } from "react-native";
import type { QuestionWithUserStateDTO, VoteResponseValue } from "@/lib/api/types/question";
import { QuestionResults } from "./question-results";
import { QuestionOptions } from "./question-options";
import { QuestionHeader } from "./question-header";
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
      <QuestionHeader
        question={question.question}
        imageUrl={question.imageUrl}
        imageCacheKey={question.image}
      />

      {question.userHasVoted ? (
        <QuestionResults groupId={question.groupId} questionId={question._id} />
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
