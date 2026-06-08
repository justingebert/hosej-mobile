import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type {
  ActiveQuestionsResponseDTO,
  CreateQuestionInput,
  QuestionResultsResponseDTO,
  VoteResponseValue,
} from "./types/question";

export const questionKeys = {
  all: ["questions"] as const,
  active: (groupId: string) => ["groups", groupId, "questions", "active"] as const,
  results: (groupId: string, questionId: string) =>
    ["groups", groupId, "questions", questionId, "results"] as const,
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
