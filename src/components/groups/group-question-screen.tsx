import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useActiveQuestions, useVoteOnQuestion } from "@/lib/api/questions";
import { QuestionTabContent } from "@/components/groups/question/question-tab-content";
import { QuestionSkeleton } from "@/components/groups/question/question-states";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { QuestionTabs } from "@/components/groups/question/question-tabs";
import { buildFlatQuestionList } from "@/components/groups/question/question-utils";
import { QuestionType, type VoteResponseValue } from "@/lib/api/types/question";
import { QuestionSubmitButton } from "@/components/groups/question/question-submit-button";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function GroupQuestionScreen() {
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const {
    data,
    error,
    isError,
    isPending,
    isRefetching,
    refetch,
  } = useActiveQuestions(groupId);
  const voteMutation = useVoteOnQuestion(groupId);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [draftResponse, setDraftResponse] = useState<VoteResponseValue | null>(null);

  const flatQuestions = useMemo(
    () => buildFlatQuestionList(data?.questions ?? []),
    [data?.questions]
  );
  const activeQuestion =
    flatQuestions.find((item) => item.question._id === selectedQuestionId) ??
    flatQuestions[0];
  const loadedQuestion = !isPending && !isError ? activeQuestion : undefined;
  const submittableResponse = getSubmittableResponse(
    loadedQuestion?.question.questionType,
    draftResponse
  );

  const showSubmitFooter = !!loadedQuestion && !loadedQuestion.question.userHasVoted;

  useEffect(() => {
    setDraftResponse(null);
  }, [loadedQuestion?.question._id]);

  const submitVote = () => {
    if (!loadedQuestion || !submittableResponse) return;
    voteMutation.mutate({
      questionId: loadedQuestion.question._id,
      response: submittableResponse,
    });
  };

  return (
    <View className="flex-1 bg-background">
      {loadedQuestion ? (
        <View className="bg-background px-4 pb-3 pt-4">
          <QuestionTabs
            activeQuestionId={loadedQuestion.question._id}
            questions={flatQuestions}
            onSelect={setSelectedQuestionId}
          />
        </View>
      ) : null}

      <Screen
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerClassName={
          loadedQuestion
            ? `grow gap-6 px-4 pt-1 ${showSubmitFooter ? "pb-44" : "pb-4"}`
            : undefined
        }
      >
        {isPending ? (
          <QuestionSkeleton />
        ) : isError ? (
          <ErrorCard
            title="Could not load questions"
            error={error}
            onRetry={refetch}
            isRetrying={isRefetching}
          />
        ) : flatQuestions.length === 0 ? (
          <EmptyState
            title="No active questions"
            description="Activate or create a question from the existing web flow for now."
          />
        ) : loadedQuestion ? (
          <QuestionTabContent
            key={loadedQuestion.question._id}
            question={loadedQuestion.question}
            response={draftResponse}
            onResponseChange={setDraftResponse}
          />
        ) : null}
      </Screen>

      {showSubmitFooter ? (
        <View
          className="absolute inset-x-0 bottom-0 border-border bg-background px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <QuestionSubmitButton
            canSubmit={!!submittableResponse}
            isSubmitting={voteMutation.isPending}
            onSubmit={submitVote}
          />
        </View>
      ) : null}
    </View>
  );
}

function getSubmittableResponse(
  questionType: QuestionType | undefined,
  response: VoteResponseValue | null
) {
  if (!response) return null;

  if (questionType === QuestionType.Text) {
    if (!Array.isArray(response)) return null;

    const trimmedValue = response[0]?.trim();
    return trimmedValue ? [trimmedValue] : null;
  }

  if (Array.isArray(response)) {
    return response.length > 0 ? response : null;
  }

  return Object.keys(response).length > 0 ? response : null;
}
