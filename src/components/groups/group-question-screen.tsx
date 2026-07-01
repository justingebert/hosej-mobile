import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGroupId } from "@/lib/group-id";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useActiveQuestions, useVoteOnQuestion } from "@/lib/api/questions";
import { QuestionTabContent } from "@/components/groups/question/question-tab-content";
import { QuestionEmptyGuide } from "@/components/groups/question/question-empty-guide";
import { QuestionSkeleton } from "@/components/groups/question/question-states";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { QuestionTabs } from "@/components/groups/question/question-tabs";
import { buildFlatQuestionList } from "@/components/groups/question/question-utils";
import {
  QuestionType,
  type QuestionWithUserStateDTO,
  type VoteResponseValue,
} from "@/lib/api/types/question";
import { QuestionSubmitButton } from "@/components/groups/question/question-submit-button";
import { QuestionChatComposer } from "@/components/groups/question/question-chat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

export function GroupQuestionScreen() {
  const insets = useSafeAreaInsets();
  // This screen sits below a native Stack header, but KeyboardAvoidingView
  // measures relative to its parent — so it must offset by the header height,
  // otherwise the composer hides behind the keyboard.
  const headerHeight = useHeaderHeight();
  const scrollRef = useRef<ScrollView>(null);
  const groupId = useGroupId();
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
    loadedQuestion?.question,
    draftResponse
  );

  const showSubmitFooter = !!loadedQuestion && !loadedQuestion.question.userHasVoted;
  // Post-vote, the submit footer is gone — the chat composer takes its place
  // (only once the question has a chat document).
  const composerChatId =
    loadedQuestion && loadedQuestion.question.userHasVoted
      ? loadedQuestion.question.chat
      : undefined;

  const scrollChatToEnd = useCallback(() => {
    // Let the optimistic message lay out before scrolling it into view.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

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
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
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
          ref={scrollRef}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerClassName={
            loadedQuestion ? "grow gap-6 px-4 pt-1 pb-4" : undefined
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
            <QuestionEmptyGuide groupId={groupId} />
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
            className="border-border bg-background px-4 pt-3"
            style={{ paddingBottom: insets.bottom + 1 }}
          >
            <QuestionSubmitButton
              canSubmit={!!submittableResponse}
              isSubmitting={voteMutation.isPending}
              onSubmit={submitVote}
            />
          </View>
        ) : composerChatId ? (
          <View
            className="border-t border-border bg-background px-4 pt-3"
            style={{ paddingBottom: insets.bottom }}
          >
            <QuestionChatComposer
              groupId={groupId}
              chatId={composerChatId}
              onSent={scrollChatToEnd}
            />
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

function getSubmittableResponse(
  question: QuestionWithUserStateDTO | undefined,
  response: VoteResponseValue | null
) {
  if (!question || !response) return null;

  if (question.questionType === QuestionType.Text) {
    if (!Array.isArray(response)) return null;

    const trimmedValue = response[0]?.trim();
    return trimmedValue ? [trimmedValue] : null;
  }

  if (question.questionType === QuestionType.Pairing) {
    // Pairing requires every key matched before it can be submitted.
    if (Array.isArray(response)) return null;
    const keys = question.pairing?.keys ?? [];
    const allMatched =
      keys.length > 0 && keys.every((key) => response[key] !== undefined);
    return allMatched ? response : null;
  }

  if (Array.isArray(response)) {
    return response.length > 0 ? response : null;
  }

  return Object.keys(response).length > 0 ? response : null;
}
