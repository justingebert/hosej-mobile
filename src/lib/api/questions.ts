import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type {
  ActiveQuestionsResponseDTO,
  VoteResponseValue,
} from "./types/question";

export const questionKeys = {
  all: ["questions"] as const,
  active: (groupId: string) => ["groups", groupId, "questions", "active"] as const,
};

export function useActiveQuestions(groupId: string) {
  return useQuery({
    queryKey: questionKeys.active(groupId),
    queryFn: () => apiFetch<ActiveQuestionsResponseDTO>(`/api/groups/${groupId}/question`),
    enabled: !!groupId,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.active(groupId) });
    },
  });
}
