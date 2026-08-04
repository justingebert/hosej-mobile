import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatComposer } from "@/components/chat/chat";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import { useActiveRallies } from "@/lib/api/rally";
import { useAuth } from "@/lib/auth/auth-context";
import { useGroupId } from "@/lib/group-id";
import { RallyStatus, type RallyDTO } from "@/lib/api/types/rally";
import { RallyEmptyGuide } from "./rally-empty-guide";
import { RallyResults } from "./rally-results";
import { RallySubmit } from "./rally-submit";
import { RallyVote } from "./rally-vote";
import { deriveUserState } from "./rally-utils";

// Phase label only — never a deadline. Rallies advance on the daily cron, so any
// exact time we printed would be a promise the backend doesn't keep. The
// submission phase adds a coarse whole-days bar (see deriveSubmissionWindow);
// voting and results get nothing but this label. See docs/migration-decisions.md.
const PHASE_LABEL: Partial<Record<RallyStatus, string>> = {
  [RallyStatus.Submission]: "Submissions open",
  [RallyStatus.Voting]: "Voting open",
  [RallyStatus.Results]: "Results",
};

export function GroupRallyScreen() {
  const insets = useSafeAreaInsets();
  // This screen sits below a native Stack header, but KeyboardAvoidingView
  // measures relative to its parent — so it must offset by the header height,
  // otherwise the composer hides behind the keyboard.
  const headerHeight = useHeaderHeight();
  const scrollRef = useRef<ScrollView>(null);
  const groupId = useGroupId();
  const { user } = useAuth();
  const { data, error, isError, isPending, isRefetching, refetch } = useActiveRallies(groupId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rallies = data ?? [];
  const activeRally = rallies.find((rally) => rally._id === selectedId) ?? rallies[0];
  const loadedRally = !isPending && !isError ? activeRally : undefined;
  const { hasSubmitted, hasVoted } = deriveUserState(loadedRally, user?.id);

  // Results stand in for the voting screen once you've voted, and for everyone
  // in the results phase.
  const showResults =
    !!loadedRally &&
    (loadedRally.status === RallyStatus.Results ||
      (loadedRally.status === RallyStatus.Voting && hasVoted));
  const composerChatId = showResults ? loadedRally?.chat : undefined;

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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        <View className="flex-1 bg-background">
          {/* A group can run several concurrent rallies; one is the default. */}
          {loadedRally && rallies.length > 1 ? (
            <View className="bg-background px-4 py-2">
              <Tabs
                value={loadedRally._id}
                onValueChange={setSelectedId}
              >
                <TabsList>
                  {rallies.map((rally, index) => (
                    <TabsTrigger key={rally._id} value={rally._id} className="flex-1">
                      <Text>{`Rally ${index + 1}`}</Text>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </View>
          ) : null}

          <Screen
            ref={scrollRef}
            onRefresh={refetch}
            refreshing={isRefetching}
            contentContainerClassName={loadedRally ? "grow gap-6 px-4 py-2" : undefined}
          >
            {isPending ? (
              <RallySkeleton />
            ) : isError ? (
              <ErrorCard
                title="Could not load rallies"
                error={error}
                onRetry={refetch}
                isRetrying={isRefetching}
              />
            ) : rallies.length === 0 ? (
              <RallyEmptyGuide groupId={groupId} />
            ) : loadedRally ? (
              <RallyPhase
                key={loadedRally._id}
                rally={loadedRally}
                hasSubmitted={hasSubmitted}
                showResults={showResults}
              />
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

function RallyPhase({
  rally,
  hasSubmitted,
  showResults,
}: {
  rally: RallyDTO;
  hasSubmitted: boolean;
  showResults: boolean;
}) {
  return (
    // `grow` (not `flex-1`) all the way down to the action buttons: it fills the
    // scroll container's spare height so the actions sit at the bottom, while
    // keeping flexBasis auto so tall content still measures and scrolls.
    <View className="grow gap-6">
      <View className="gap-2 rounded-2xl bg-card p-5" style={{ borderCurve: "continuous" }}>
        <Text className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {PHASE_LABEL[rally.status] ?? "Rally"}
        </Text>
        <Text className="text-center text-lg font-bold text-card-foreground">{rally.task}</Text>
      </View>

      {showResults ? (
        <RallyResults rally={rally} />
      ) : rally.status === RallyStatus.Submission ? (
        <RallySubmit rally={rally} hasSubmitted={hasSubmitted} />
      ) : rally.status === RallyStatus.Voting ? (
        <RallyVote rally={rally} />
      ) : null}
    </View>
  );
}

function RallySkeleton() {
  return (
    <View className="gap-6">
      <View className="gap-2 rounded-2xl bg-card p-5">
        <Skeleton className="h-3 w-32 self-center rounded-full" />
        <Skeleton className="h-5 w-3/4 self-center rounded-md" />
      </View>
      <Skeleton className="h-4 w-40 self-center rounded-full" />
      <View className="gap-3 rounded-2xl border border-border bg-card p-3">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </View>
    </View>
  );
}
