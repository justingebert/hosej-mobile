import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { ChatDTO, ChatMessageDTO, ChatMessageUserDTO } from "./types/chat";

export const chatKeys = {
  all: ["chats"] as const,
  detail: (groupId: string, chatId: string) =>
    ["groups", groupId, "chats", chatId] as const,
};

// A question's chat document (messages with populated authors). `chatId` is
// optional because older questions predate the chat feature — the query stays
// disabled until both ids exist.
export function useChat(groupId: string, chatId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.detail(groupId, chatId ?? ""),
    queryFn: () => apiFetch<ChatDTO>(`/api/groups/${groupId}/chats/${chatId}`),
    enabled: !!groupId && !!chatId,
  });
}

// Send a message. Mirrors the web app: append optimistically using the current
// user's identity and DON'T refetch on success — focus/pull-to-refresh
// reconciles with the server's populated copy later. Rolls back + toasts on
// error (the shared mutation cache reads `meta.errorToastTitle`).
export function useAddMessage(
  groupId: string,
  chatId: string | undefined,
  currentUser: ChatMessageUserDTO | null
) {
  const queryClient = useQueryClient();
  const key = chatKeys.detail(groupId, chatId ?? "");

  return useMutation({
    mutationFn: (message: string) =>
      apiFetch(`/api/groups/${groupId}/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    onMutate: async (message: string) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ChatDTO>(key);
      if (previous && currentUser) {
        const optimistic: ChatMessageDTO = {
          user: { _id: currentUser._id, username: currentUser.username },
          message,
          createdAt: new Date().toISOString(),
        };
        queryClient.setQueryData<ChatDTO>(key, {
          ...previous,
          messages: [...previous.messages, optimistic],
        });
      }
      return { previous };
    },
    onError: (_error, _message, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    meta: {
      errorToastTitle: "Could not send message",
    },
  });
}
