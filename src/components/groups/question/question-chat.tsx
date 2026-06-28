import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Send } from "lucide-react-native";
import { useCSSVariable } from "uniwind";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAddMessage, useChat } from "@/lib/api/chat";
import { useAuth } from "@/lib/auth/auth-context";
import { setActiveChat } from "@/lib/push/push";
import { cn } from "@/lib/utils";

// Inline, read-only message list. Lives at the bottom of the post-vote results
// (active question) and the history results screen — same component, no input.
// Sends from the composer land in the shared query cache and show up here.
export function QuestionChatMessages({
  groupId,
  chatId,
}: {
  groupId: string;
  chatId: string;
}) {
  const { user } = useAuth();
  const { data, isPending, isError, refetch } = useChat(groupId, chatId);

  // Web parity: revalidate when you return to the screen (no polling). Skip the
  // first focus — the query already fetches on mount. While focused, mark this chat
  // active so an incoming push for it is silenced (the handler just refreshes here).
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      setActiveChat(chatId);
      if (firstFocus.current) {
        firstFocus.current = false;
      } else {
        refetch();
      }
      return () => setActiveChat(null);
    }, [chatId, refetch])
  );

  const messages = data?.messages ?? [];

  return (
    <View className="gap-3">
      <Text variant="muted" className="text-xs font-semibold uppercase tracking-wide">
        Discussion
      </Text>

      {isPending ? (
        <View className="items-center py-4">
          <ActivityIndicator />
        </View>
      ) : isError ? (
        <Text variant="muted" className="text-sm">
          Couldn’t load the chat.
        </Text>
      ) : messages.length === 0 ? (
        <Text variant="muted" className="text-sm">
          No messages.
        </Text>
      ) : (
        messages.map((msg, index) => {
          const mine = !!user && msg.user?._id === user.id;
          return (
            <View key={index} className={mine ? "items-end" : "items-start"}>
              <View
                className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  mine ? "bg-primary" : "bg-secondary"
                }`}
              >
                {!mine ? (
                  <Text className="mb-0.5 text-xs font-bold text-muted-foreground">
                    {msg.user?.username ?? "Unknown"}
                  </Text>
                ) : null}
                <Text className={mine ? "text-primary-foreground" : "text-secondary-foreground"}>
                  {msg.message}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

// Write-side compose bar. Pinned as the active question's footer (read-only
// history has no composer). `onSent` lets the host scroll the message into view.
export function QuestionChatComposer({
  groupId,
  chatId,
  onSent,
}: {
  groupId: string;
  chatId: string;
  onSent?: () => void;
}) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const placeholderColor = useCSSVariable("--color-muted-foreground");
  const addMessage = useAddMessage(
    groupId,
    chatId,
    user ? { _id: user.id, username: user.username } : null
  );
  const trimmed = text.trim();

  const send = () => {
    if (!trimmed || addMessage.isPending) return;
    const message = trimmed;
    setText("");
    onSent?.();
    // Restore the draft if the send fails (the mutation also rolls back its
    // optimistic message + toasts) so the user doesn't have to retype.
    addMessage.mutate(message, { onError: () => setText(message) });
  };

  return (
    <View className="flex-row items-end gap-1 rounded-2xl bg-card py-1.5 pl-4 pr-1.5">
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Message…"
        placeholderTextColor={placeholderColor as string}
        multiline
        className="max-h-28 flex-1 py-1 text-base text-foreground"
      />
      <Pressable
        onPress={send}
        disabled={!trimmed || addMessage.isPending}
        hitSlop={8}
        className={cn(
          "size-9 items-center justify-center rounded-full",
          trimmed && "bg-primary"
        )}
      >
        <Icon
          as={Send}
          className={trimmed ? "text-primary-foreground" : "text-muted-foreground"}
        />
      </Pressable>
    </View>
  );
}
