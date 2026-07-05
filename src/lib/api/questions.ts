import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import { toastInfo } from "@/lib/toast";
import { useAuth } from "@/lib/auth/auth-context";
import type {
  ActiveQuestionsResponseDTO,
  CreateQuestionInput,
  GroupHistoryResponseDTO,
  QuestionDTO,
  QuestionResultsResponseDTO,
  QuestionWithUserStateDTO,
  UserRating,
  VoteResponseValue,
} from "./types/question";

export const HISTORY_PAGE_SIZE = 25;

export type GroupHistoryFilters = {
  search?: string;
  // Question-type enum values; pass already-sorted so the cache key is stable.
  questionType?: string[];
  // submittedBy user ids; pass already-sorted so the cache key is stable.
  submittedBy?: string[];
};

export const questionKeys = {
  all: ["questions"] as const,
  active: (groupId: string) => ["groups", groupId, "questions", "active"] as const,
  results: (groupId: string, questionId: string) =>
    ["groups", groupId, "questions", questionId, "results"] as const,
  detail: (groupId: string, questionId: string) =>
    ["groups", groupId, "questions", questionId, "detail"] as const,
  history: (groupId: string, filters: GroupHistoryFilters) =>
    ["groups", groupId, "questions", "history", filters] as const,
};

export function useActiveQuestions(groupId: string) {
  return useQuery({
    queryKey: questionKeys.active(groupId),
    queryFn: () => apiFetch<ActiveQuestionsResponseDTO>(`/api/groups/${groupId}/question`),
    enabled: !!groupId,
  });
}

export function useCreateQuestion(groupId: string) {
  // Created questions enter the group's question pool and are activated later
  // (daily), so they don't show up in the active-questions list immediately —
  // there's no cached query to invalidate on success yet.
  return useMutation({
    mutationFn: (input: CreateQuestionInput) =>
      apiFetch(`/api/groups/${groupId}/question`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    meta: {
      errorToastTitle: "Could not create question",
    },
  });
}

export function useActivateNextQuestion(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<{ activated: number }>(`/api/groups/${groupId}/question/activate`, {
        method: "POST",
      }),
    meta: {
      errorToastTitle: "Could not activate question",
    },
    onSuccess: async ({ activated }) => {
      if (activated === 0) {
        toastInfo("No questions available", "Create a question or add a pack first.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: questionKeys.active(groupId) });
    },
  });
}

export function useVoteOnQuestion(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionId,
      response,
    }: {
      questionId: string;
      response: VoteResponseValue;
    }) =>
      apiFetch(
        `/api/groups/${groupId}/question/${questionId}/vote`,
        {
          method: "POST",
          body: JSON.stringify({ response }),
        }
      ),
    meta: {
      errorToastTitle: "Could not submit vote",
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: questionKeys.active(groupId) }),
        queryClient.invalidateQueries({
          queryKey: questionKeys.results(groupId, variables.questionId),
        }),
      ]);
    },
  });
}

// Rate the question itself (👎 bad / 👌 ok / 👍 good) — meta feedback, separate
// from the vote. Optimistic: moves the current user between rating buckets in the
// active-questions cache so the sheet/summary reflect the tap instantly, then
// invalidates to reconcile. Mutation error surfaces as a toast (see meta).
export function useRateQuestion(groupId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: ({
      questionId,
      rating,
    }: {
      questionId: string;
      rating: Exclude<UserRating, null>;
    }) =>
      apiFetch(`/api/groups/${groupId}/question/${questionId}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating }),
      }),
    meta: {
      errorToastTitle: "Could not rate question",
    },
    onMutate: async ({ questionId, rating }) => {
      await queryClient.cancelQueries({ queryKey: questionKeys.active(groupId) });
      const previous = queryClient.getQueryData<ActiveQuestionsResponseDTO>(
        questionKeys.active(groupId)
      );
      if (previous && userId) {
        queryClient.setQueryData<ActiveQuestionsResponseDTO>(questionKeys.active(groupId), {
          ...previous,
          questions: previous.questions.map((question) =>
            question._id === questionId ? applyRating(question, userId, rating) : question
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(questionKeys.active(groupId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: questionKeys.active(groupId) });
    },
  });
}

// Pure cache transform: drop the user from whichever bucket they were in, add
// them to the new one, and reflect their pick in userRating.
function applyRating(
  question: QuestionWithUserStateDTO,
  userId: string,
  rating: Exclude<UserRating, null>
): QuestionWithUserStateDTO {
  const buckets = {
    good: question.rating.good.filter((id) => id !== userId),
    ok: question.rating.ok.filter((id) => id !== userId),
    bad: question.rating.bad.filter((id) => id !== userId),
  };
  buckets[rating] = [...buckets[rating], userId];
  return { ...question, rating: buckets, userRating: rating };
}

export function useQuestionResults(groupId: string, questionId: string) {
  return useQuery({
    queryKey: questionKeys.results(groupId, questionId),
    queryFn: () =>
      apiFetch<QuestionResultsResponseDTO>(
        `/api/groups/${groupId}/question/${questionId}/results`
      ),
    enabled: !!groupId && !!questionId,
  });
}

// Single question document (text, image, rating, options). Used by the results
// page for everything the aggregated /results endpoint doesn't return.
export function useQuestion(groupId: string, questionId: string) {
  return useQuery({
    queryKey: questionKeys.detail(groupId, questionId),
    queryFn: () =>
      apiFetch<QuestionDTO>(`/api/groups/${groupId}/question/${questionId}`),
    enabled: !!groupId && !!questionId,
  });
}

// Past questions (used + inactive), newest first. Server-side search + filters;
// each page is one offset window. Filters live in the query key, so changing
// them starts a fresh infinite query at page 0.
export function useGroupHistory(groupId: string, filters: GroupHistoryFilters) {
  return useInfiniteQuery({
    queryKey: questionKeys.history(groupId, filters),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: String(HISTORY_PAGE_SIZE),
        offset: String(pageParam),
      });
      if (filters.search) params.set("search", filters.search);
      if (filters.questionType?.length) {
        params.set("questionType", filters.questionType.join(","));
      }
      if (filters.submittedBy?.length) {
        params.set("submittedBy", filters.submittedBy.join(","));
      }
      return apiFetch<GroupHistoryResponseDTO>(
        `/api/groups/${groupId}/history?${params.toString()}`
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.questions.length < HISTORY_PAGE_SIZE ? undefined : allPages.length * HISTORY_PAGE_SIZE,
    enabled: !!groupId,
  });
}
