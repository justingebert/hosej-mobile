import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { HapticPressable } from "@/components/ui/haptic-pressable";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { UserAvatar } from "@/components/ui/user-avatar";
import { AspectImage } from "@/components/groups/question/aspect-image";
import { ChatMessages } from "@/components/chat/chat";
import { useRallySubmissions } from "@/lib/api/rally";
import { useGroupId } from "@/lib/group-id";
import { useReportAction } from "@/lib/moderation";
import type { RallyDTO } from "@/lib/api/types/rally";
import { PhotoViewer } from "./photo-viewer";
import {
  MEDALS,
  findFeaturedWinner,
  rankSubmissions,
  votePercentage,
  type RankedSubmission,
} from "./rally-utils";

// Matches the question feature's result bars so the two features speak the same
// visual language for "share of the vote".
const RESULT_FILL_MS = 800;

/**
 * Results. Shown once you've voted (and through the results phase), so this is
 * where the anonymity of the voting phase lifts and names appear.
 */
export function RallyResults({ rally }: { rally: RallyDTO }) {
  const groupId = useGroupId();
  const { data, isPending, isError, refetch } = useRallySubmissions(groupId, rally._id);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reportContent = useReportAction();

  if (isPending) return <ResultsSkeleton />;

  if (isError) {
    return (
      <Button variant="link" size="sm" onPress={() => refetch()} className="self-start">
        <Text>Couldn&rsquo;t load results · Try again</Text>
      </Button>
    );
  }

  const submissions = data ?? [];
  if (submissions.length === 0) {
    return (
      <Text variant="muted" className="text-center text-sm">
        Nobody submitted a photo for this one.
      </Text>
    );
  }

  const ranked = rankSubmissions(submissions);
  const winner = findFeaturedWinner(ranked);
  const runnersUp = winner ? ranked.slice(1) : ranked;
  const totalVotes = ranked.reduce((sum, submission) => sum + submission.votes.length, 0);
  const photos = ranked.map((submission) => ({
    id: submission._id,
    uri: submission.imageUrl,
  }));

  return (
    <View className="gap-6">
      {winner ? (
        <WinnerCard
          submission={winner}
          totalVotes={totalVotes}
          onPress={() => setOpenIndex(0)}
        />
      ) : null}

      <View className="gap-4">
        {runnersUp.map((submission, index) => (
          <ResultCard
            key={submission._id}
            submission={submission}
            totalVotes={totalVotes}
            onPress={() => setOpenIndex(winner ? index + 1 : index)}
          />
        ))}
      </View>

      <PhotoViewer
        photos={photos}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
        onReport={(photo) => {
          const submission = ranked.find((item) => item._id === photo.id);
          if (!submission) return;
          reportContent("photo", {
            targetType: "rallySubmission",
            targetId: submission._id,
            reportedUser: submission.userId,
            groupId,
            content: `Rally: ${rally.task}`,
          });
        }}
      />

      {rally.chat ? <ChatMessages groupId={groupId} chatId={rally.chat} /> : null}
    </View>
  );
}

function WinnerCard({
  submission,
  totalVotes,
  onPress,
}: {
  submission: RankedSubmission;
  totalVotes: number;
  onPress: () => void;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-center gap-2">
        <Text className="text-2xl">{MEDALS[0]}</Text>
        <Text className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Winner
        </Text>
      </View>

      <View
        className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-card"
        style={{ borderCurve: "continuous" }}
      >
        <HapticPressable haptic="light" onPress={onPress}>
          <AspectImage uri={submission.imageUrl} cacheKey={submission._id} />
        </HapticPressable>
        <MetaRow submission={submission} totalVotes={totalVotes} showMedal={false} />
      </View>
    </View>
  );
}

function ResultCard({
  submission,
  totalVotes,
  onPress,
}: {
  submission: RankedSubmission;
  totalVotes: number;
  onPress: () => void;
}) {
  return (
    <View
      className="overflow-hidden rounded-2xl border border-border bg-card"
      style={{ borderCurve: "continuous" }}
    >
      <HapticPressable haptic="light" onPress={onPress}>
        <AspectImage uri={submission.imageUrl} cacheKey={submission._id} />
      </HapticPressable>
      <MetaRow submission={submission} totalVotes={totalVotes} showMedal />
    </View>
  );
}

/** Submitter + tally, with the vote share filling in behind it. */
function MetaRow({
  submission,
  totalVotes,
  showMedal,
}: {
  submission: RankedSubmission;
  totalVotes: number;
  showMedal: boolean;
}) {
  const votes = submission.votes.length;
  const target = votePercentage(votes, totalVotes);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(target, {
      duration: RESULT_FILL_MS,
      easing: Easing.inOut(Easing.ease),
    });
  }, [target, progress]);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value}%` }));
  const medal = showMedal && submission.rank <= MEDALS.length ? MEDALS[submission.rank - 1] : null;

  return (
    <View className="overflow-hidden bg-secondary">
      <Animated.View className="absolute bottom-0 left-0 top-0 bg-primary/10" style={barStyle} />
      <View className="flex-row items-center gap-3 p-3">
        <UserAvatar
          name={submission.username}
          avatarUrl={submission.avatarUrl}
          className="size-8"
        />
        <Text className="flex-1 text-sm font-medium text-secondary-foreground" numberOfLines={1}>
          {submission.username}
        </Text>
        {medal ? <Text className="text-lg">{medal}</Text> : null}
        <Text className="text-sm font-extrabold text-secondary-foreground">
          {votes} {votes === 1 ? "vote" : "votes"}
        </Text>
      </View>
    </View>
  );
}

function ResultsSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton className="h-4 w-24 self-center rounded-full" />
      {[0, 1].map((index) => (
        <View key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
          <Skeleton className="h-64 w-full" />
          <View className="flex-row items-center gap-3 p-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 flex-1 rounded-md" />
            <Skeleton className="h-4 w-14 rounded-md" />
          </View>
        </View>
      ))}
    </View>
  );
}
