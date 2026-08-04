import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGroupId } from "@/lib/group-id";
import { useActiveJukeboxes } from "@/lib/api/jukebox";
import { ChatComposer, ChatMessages } from "@/components/chat/chat";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import { JukeboxSearch } from "./jukebox-search";
import { JukeboxSongList } from "./jukebox-song-list";
import type { JukeboxDTO } from "@/lib/api/types/jukebox";

export function GroupJukeboxScreen() {
  const insets = useSafeAreaInsets();
  // This screen sits below a native Stack header, but KeyboardAvoidingView
  // measures relative to its parent — so it must offset by the header height,
  // otherwise the composer hides behind the keyboard.
  const headerHeight = useHeaderHeight();
  const scrollRef = useRef<ScrollView>(null);
  const groupId = useGroupId();
  const { data, error, isError, isPending, isRefetching, refetch } =
    useActiveJukeboxes(groupId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const jukeboxes = data ?? [];
  const activeJukebox =
    jukeboxes.find((jukebox) => jukebox._id === selectedId) ?? jukeboxes[0];

  // Chat unlocks once you've put a song in — same rule as questions (post-vote)
  // and rallies (post-vote). No lurking before you've contributed.
  const composerChatId = activeJukebox?.userHasSubmitted ? activeJukebox.chat : undefined;

  const scrollChatToEnd = useCallback(() => {
    // Let the optimistic message lay out before scrolling it into view.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

  return (
    // The home-indicator inset lives on this outer wrapper — *outside* the
    // KeyboardAvoidingView — so the footer clears it when the keyboard is closed
    // but hugs the keyboard (no leftover gap) when it's open.
    <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        // Only lift for the composer. The pre-submit search screen has no footer
        // and relies on the ScrollView's own keyboard insets below; running both
        // would double-compensate.
        behavior={composerChatId && Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        <View className="flex-1 bg-background">
          <Screen
            ref={scrollRef}
            onRefresh={refetch}
            refreshing={isRefetching}
            avoidKeyboard={!composerChatId}
          >
            {isPending ? (
              <JukeboxSkeleton />
            ) : isError ? (
              <ErrorCard
                title="Could not load the jukebox"
                error={error}
                onRetry={refetch}
                isRetrying={isRefetching}
              />
            ) : jukeboxes.length === 0 ? (
              <EmptyState
                title="No jukebox running"
                description="Nothing to vote on right now — a new jukebox opens automatically."
              />
            ) : activeJukebox ? (
              <View className="gap-4">
                {/* A group can run several concurrent jukeboxes; one is the default. */}
                {jukeboxes.length > 1 ? (
                  <JukeboxTabs
                    jukeboxes={jukeboxes}
                    activeId={activeJukebox._id}
                    onSelect={setSelectedId}
                  />
                ) : null}

                {activeJukebox.userHasSubmitted ? (
                  <JukeboxSongList jukebox={activeJukebox} />
                ) : (
                  <JukeboxSearch jukebox={activeJukebox} />
                )}

                {composerChatId ? (
                  <ChatMessages groupId={groupId} chatId={composerChatId} />
                ) : null}
              </View>
            ) : null}
          </Screen>

          {composerChatId ? (
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

function JukeboxTabs({
  jukeboxes,
  activeId,
  onSelect,
}: {
  jukeboxes: JukeboxDTO[];
  activeId: string;
  onSelect: (jukeboxId: string) => void;
}) {
  return (
    <Tabs value={activeId} onValueChange={onSelect}>
      <TabsList>
        {jukeboxes.map((jukebox, index) => (
          <TabsTrigger key={jukebox._id} value={jukebox._id} className="flex-1">
            <Text>{jukebox.title ?? `Jukebox ${index + 1}`}</Text>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function JukeboxSkeleton() {
  return (
    <View className="gap-4">
      <View className="gap-2">
        <Skeleton className="h-6 w-40 rounded-md" />
        <Skeleton className="h-4 w-64 rounded-md" />
      </View>
      <Skeleton className="h-12 w-full rounded-2xl" />
      <View className="gap-2">
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <Skeleton className="size-16 rounded-lg" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
