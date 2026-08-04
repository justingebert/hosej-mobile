import { useRef } from "react";
import { View } from "react-native";
import type { QuestionWithUserStateDTO, VoteResponseValue } from "@/lib/api/types/question";
import { QuestionResults } from "./question-results";
import { ChatMessages } from "@/components/chat/chat";
import { QuestionOptions } from "./question-options";
import { QuestionHeader } from "./question-header";
import { QuestionRating, type QuestionRatingHandle } from "./question-rating";
import type { QuestionResponseChangeHandler } from "./types";

export function QuestionTabContent({
  question,
  response,
  onResponseChange,
  justVoted = false,
}: {
  question: QuestionWithUserStateDTO;
  response: VoteResponseValue | null;
  onResponseChange: QuestionResponseChangeHandler;
  // True only for the question just voted on this session — triggers the rating
  // sheet to auto-open once.
  justVoted?: boolean;
}) {
  const ratingRef = useRef<QuestionRatingHandle>(null);

  return (
    <View className="gap-6">
      <QuestionHeader
        question={question.question}
        imageUrl={question.imageUrl}
        imageCacheKey={question.image}
        // Post-vote, the prompt card opens the rating sheet.
        onPress={
          question.userHasVoted ? () => ratingRef.current?.present() : undefined
        }
      />

      {question.userHasVoted ? (
        <>
          <QuestionResults groupId={question.groupId} questionId={question._id} />
          <QuestionRating ref={ratingRef} question={question} autoOpen={justVoted} />
          {question.chat ? (
            <ChatMessages groupId={question.groupId} chatId={question.chat} />
          ) : null}
        </>
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
