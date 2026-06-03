import { useState } from "react";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import {
  QuestionType,
  type QuestionOptionDTO,
  type QuestionWithUserStateDTO,
} from "@/lib/api/types/question";
import { AnsweredPlaceholder } from "./question-placeholders";
import { QuestionTypeScreen } from "./question-type-screens";
import { optionResponseValue } from "./question-utils";
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
  const [textResponse, setTextResponse] = useState("");
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
  const isText = question.questionType === QuestionType.Text;
  const isPairing = question.questionType === QuestionType.Pairing;
  const hasResponse = isText ? textResponse.trim().length > 0 : selectedResponses.length > 0;
  const canSubmit = !isPairing && hasResponse;

  const toggleOption = (option: QuestionOptionDTO) => {
    const value = optionResponseValue(option);

    setSelectedResponses((current) => {
      if (question.multiSelect) {
        return current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];
      }

      return [value];
    });
  };

  const submit = () => {
    if (!canSubmit || isSubmitting) return;
    onSubmit(question._id, isText ? [textResponse.trim()] : selectedResponses);
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
        <AnsweredPlaceholder question={question} />
      ) : (
        <QuestionTypeScreen
          question={question}
          textResponse={textResponse}
          selectedResponses={selectedResponses}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          submitError={submitError}
          onTextChange={setTextResponse}
          onToggleOption={toggleOption}
          onSubmit={submit}
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
