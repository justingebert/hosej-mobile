import { useCallback, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { HapticPressable } from "@/components/ui/haptic-pressable";
import { useFocusEffect } from "expo-router";
import { ArrowUp } from "lucide-react-native";
import { useCSSVariable } from "uniwind";

import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useAddMessage, useChat } from "@/lib/api/chat";
import { useAuth } from "@/lib/auth/auth-context";
import { useReportAction } from "@/lib/moderation";
import { setActiveChat } from "@/lib/push/push";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Inline, read-only message list. Feature-agnostic: questions, rallies and the
// jukebox all mount it with their own entity's chat id.
export function ChatMessages({
  groupId,
  chatId,
}: {
  groupId: string;
  chatId: string;
}) {
  const { user } = useAuth();
  const { data, isPending, isError, refetch } = useChat(groupId, chatId);
  const reportContent = useReportAction();

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
        <ChatMessagesSkeleton />
      ) : isError ? (
        <Button variant="link" size="sm" onPress={() => refetch()} className="self-start">
          <Text>Couldn’t load chat · Try again</Text>
        </Button>
      ) : messages.length === 0 ? (
        <Text variant="muted" className="text-sm">
          No messages.
        </Text>
      ) : (
        messages.map((msg, index) => {
          const mine = !!user && msg.user?._id === user.id;
          const author = msg.user;
          const bubble = (
            <View
              className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                mine ? "bg-primary" : "bg-secondary"
              }`}
            >
              {!mine ? (
                <Text className="mb-0.5 text-xs font-bold text-muted-foreground">
                  {author?.username ?? "Unknown"}
                </Text>
              ) : null}
              <Text className={mine ? "text-primary-foreground" : "text-secondary-foreground"}>
                {msg.message}
              </Text>
            </View>
          );
          return (
            <View key={index} className={mine ? "items-end" : "items-start"}>
              {mine || !author ? (
                bubble
              ) : (
                // Long-press is the platform idiom for "act on this message" — a
                // visible report button on every bubble would be noise. Messages
                // have no id of their own, so the chat + timestamp locates one.
                <Pressable
                  accessibilityHint="Long press to report this message"
                  onLongPress={() =>
                    reportContent("message", {
                      targetType: "message",
                      targetId: `${chatId}:${msg.createdAt}`,
                      reportedUser: author._id,
                      groupId,
                      content: msg.message,
                    })
                  }
                >
                  {bubble}
                </Pressable>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

function ChatMessagesSkeleton() {
  return (
    <View className="gap-3">
      <View className="items-start">
        <Skeleton className="h-9 w-2/5 rounded-2xl" />
      </View>
      <View className="items-end">
        <Skeleton className="h-9 w-1/2 rounded-2xl" />
      </View>
      <View className="items-start">
        <Skeleton className="h-9 w-1/3 rounded-2xl" />
      </View>
    </View>
  );
}

// Write-side compose bar. Pinned as the host screen's footer once the user has
// participated (read-only history has no composer). `onSent` lets the host
// scroll the new message into view.
export function ChatComposer({
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
      <HapticPressable
        haptic="light"
        onPress={send}
        disabled={!trimmed || addMessage.isPending}
        hitSlop={8}
        className={cn(
          "size-9 items-center justify-center rounded-full",
          trimmed && "bg-primary"
        )}
      >
        <Icon
          as={ArrowUp}
          className={trimmed ? "text-primary-foreground" : "text-muted-foreground"}
        />
      </HapticPressable>
    </View>
  );
}
