import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGroupId } from "@/lib/group-id";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useActiveQuestions, useVoteOnQuestion } from "@/lib/api/questions";
import { useMarkFeatureSeen } from "@/lib/api/activity";
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
import { ChatComposer } from "@/components/chat/chat";
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
  useMarkFeatureSeen(groupId, "question");
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
  // The question voted on this session — its rating sheet auto-opens once.
  const [justVotedId, setJustVotedId] = useState<string | null>(null);

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
    // Switching questions clears the just-voted flag so revisiting the voted
    // question doesn't re-pop its rating sheet.
    setJustVotedId(null);
  }, [loadedQuestion?.question._id]);

  const submitVote = () => {
    if (!loadedQuestion || !submittableResponse) return;
    const votedId = loadedQuestion.question._id;
    voteMutation.mutate(
      { questionId: votedId, response: submittableResponse },
      { onSuccess: () => setJustVotedId(votedId) }
    );
  };

  return (
    // The home-indicator inset lives on this outer wrapper — *outside* the
    // KeyboardAvoidingView — so the footer clears it when the keyboard is closed
    // but hugs the keyboard (no leftover gap) when it's open. The KAV gets
    // bg-background so its padding strip doesn't leak white behind the keyboard's
    // rounded corners.
    <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <View className="flex-1 bg-background">
        {loadedQuestion ? (
          <View className="bg-background px-4 pb-3 pt-2">
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
              justVoted={loadedQuestion.question._id === justVotedId}
            />
          ) : null}
        </Screen>

        {showSubmitFooter ? (
          <View className="border-border bg-background px-4 pb-2 pt-3">
            <QuestionSubmitButton
              canSubmit={!!submittableResponse}
              isSubmitting={voteMutation.isPending}
              onSubmit={submitVote}
            />
          </View>
        ) : composerChatId ? (
          <View className="border-t border-border bg-background px-4 pb-2 pt-3">
            <ChatComposer
              groupId={groupId}
              chatId={composerChatId}
              onSent={scrollChatToEnd}
            />
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
    </View>
  );
}

function getSubmittableResponse(
  question: QuestionWithUserStateDTO | undefined,
  response: VoteResponseValue | null
) {
  if (!question) return null;
  if (!response) return null;

  return responseResolvers[question.questionType](question, response);
}

type ResponseResolver = (
  question: QuestionWithUserStateDTO,
  response: VoteResponseValue
) => VoteResponseValue | null;

const responseResolvers: Record<QuestionType, ResponseResolver> = {
  [QuestionType.Text]: getTextResponse,
  [QuestionType.Pairing]: getPairingResponse,
  [QuestionType.Users]: getOptionResponse,
  [QuestionType.Custom]: getOptionResponse,
  [QuestionType.Image]: getOptionResponse,
  [QuestionType.Rating]: getOptionResponse,
};

function getTextResponse(
  _question: QuestionWithUserStateDTO,
  response: VoteResponseValue
) {
  if (!Array.isArray(response)) return null;
  const trimmedValue = response[0]?.trim();
  if (!trimmedValue) return null;
  return [trimmedValue];
}

function getPairingResponse(
  question: QuestionWithUserStateDTO,
  response: VoteResponseValue
) {
  // Pairing requires every key matched before it can be submitted.
  const recordResponse = Array.isArray(response) ? null : response;
  if (!recordResponse) return null;
  const keys = question.pairing?.keys ?? [];
  return hasCompletePairingResponse(keys, recordResponse) ? recordResponse : null;
}

function hasCompletePairingResponse(
  keys: string[],
  response: Record<string, string>
) {
  return keys.length > 0 && keys.every((key) => response[key] !== undefined);
}

function getOptionResponse(
  _question: QuestionWithUserStateDTO,
  response: VoteResponseValue
) {
  if (Array.isArray(response)) return response.length > 0 ? response : null;
  return Object.keys(response).length > 0 ? response : null;
}
