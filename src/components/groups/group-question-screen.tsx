import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useActiveQuestions, useVoteOnQuestion } from "@/lib/api/questions";
import { ChatPlaceholder } from "@/components/groups/question/question-placeholders";
import { QuestionCard } from "@/components/groups/question/question-card";
import { QuestionSkeleton } from "@/components/groups/question/question-states";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { QuestionTabs } from "@/components/groups/question/question-tabs";
import { buildFlatQuestionList } from "@/components/groups/question/question-utils";
import type { VoteResponseValue } from "@/lib/api/types/question";

export function GroupQuestionScreen() {
  const router = useRouter();
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

  const flatQuestions = useMemo(
    () => buildFlatQuestionList(data?.questions ?? []),
    [data?.questions]
  );
  const activeQuestion =
    flatQuestions.find((item) => item.question._id === selectedQuestionId) ??
    flatQuestions[0];

  const submitVote = (questionId: string, response: VoteResponseValue) => {
    voteMutation.mutate({ questionId, response });
  };

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      <View className="w-full flex-1 gap-6">
        <QuestionHeader onBack={router.back} />

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
        ) : activeQuestion ? (
          <>
            <QuestionTabs
              activeQuestionId={activeQuestion.question._id}
              questions={flatQuestions}
              onSelect={setSelectedQuestionId}
            />
            <QuestionCard
              key={activeQuestion.question._id}
              question={activeQuestion.question}
              isSubmitting={voteMutation.isPending}
              submitError={voteMutation.error instanceof Error ? voteMutation.error.message : null}
              onSubmit={submitVote}
            />
            <ChatPlaceholder />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function QuestionHeader({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Pressable onPress={onBack}>
        <Text>back</Text>
      </Pressable>

      <Text className="flex-1 text-center text-3xl font-extrabold text-foreground">
        Daily Question
      </Text>

      <View className="h-11 w-11" />
    </View>
  );
}
