import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { Button } from "@/components/ui/button";
import { HapticPressable } from "@/components/ui/haptic-pressable";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, type SheetHandle } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { AspectImage } from "@/components/groups/question/aspect-image";
import { useRallySubmissions, useVoteOnSubmission } from "@/lib/api/rally";
import { useAuth } from "@/lib/auth/auth-context";
import { useReportAction } from "@/lib/moderation";
import { useGroupId } from "@/lib/group-id";
import type { RallyDTO, RallySubmissionWithUrlDTO } from "@/lib/api/types/rally";
import { PhotoViewer } from "./photo-viewer";

/**
 * Voting phase, pre-vote. Entries are anonymous here — the endpoint hands back
 * `username` and `avatarUrl`, and we deliberately don't render them until results.
 * You vote on the photo, not on your friend.
 */
export function RallyVote({ rally }: { rally: RallyDTO }) {
  const groupId = useGroupId();
  const { user } = useAuth();
  const { data, isPending, isError, refetch } = useRallySubmissions(groupId, rally._id);
  const vote = useVoteOnSubmission(groupId, rally._id);
  const reportContent = useReportAction();
  const sheetRef = useRef<SheetHandle>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [pending, setPending] = useState<RallySubmissionWithUrlDTO | null>(null);

  // The confirm sheet and the viewer are separate native layers, so a sheet
  // presented while the full-screen viewer is up would open behind it. Waiting
  // for the viewer to close keeps one code path for both vote entry points.
  useEffect(() => {
    if (pending && openIndex === null) sheetRef.current?.present();
  }, [pending, openIndex]);

  if (isPending) return <VoteSkeleton />;

  // Tier 2: the task card above is still valid content, so this stays an inline
  // retry rather than an ErrorCard.
  if (isError) {
    return (
      <Button variant="link" size="sm" onPress={() => refetch()} className="self-start">
        <Text>Couldn&rsquo;t load photos · Try again</Text>
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

  const photos = submissions.map((submission) => ({
    id: submission._id,
    uri: submission.imageUrl,
  }));

  const requestVote = (submission: RallySubmissionWithUrlDTO) => {
    setPending(submission);
    setOpenIndex(null);
  };

  const confirmVote = () => {
    if (!pending) return;
    const submissionId = pending._id;
    sheetRef.current?.dismiss();
    vote.mutate(submissionId);
  };

  return (
    <View className="gap-4">

      <Text variant="muted" className="text-center text-sm">
        Tap a photo to see it big
      </Text>

      {submissions.map((submission, index) => {
        const own = submission.userId === user?.id;
        return (
          <View
            key={submission._id}
            className="overflow-hidden rounded-2xl border border-border bg-card"
            style={{ borderCurve: "continuous" }}
          >
            <HapticPressable
              haptic="light"
              onPress={() => setOpenIndex(index)}
              accessibilityLabel={own ? "Your photo" : `Photo ${index + 1}`}
            >
              <AspectImage uri={submission.imageUrl} cacheKey={submission._id} />
              {own ? (
                <View className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1">
                  <Text className="text-xs font-bold text-white">Your photo</Text>
                </View>
              ) : null}
            </HapticPressable>

            {
              !own ? (
                <View className="p-3">
                  <Button
                    variant={"default"}
                    disabled={vote.isPending}
                    onPress={() => requestVote(submission)}
                  >
                    <Text>{"Vote for this photo"}</Text>
                  </Button>
                </View>
              ) :
                <></>
            }

          </View>
        );
      })}

      <PhotoViewer
        photos={photos}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
        onReport={(photo) => {
          const submission = submissions.find((item) => item._id === photo.id);
          if (!submission || submission.userId === user?.id) return;
          // The prompt names nobody: entries are anonymous until results, and the
          // server already knows who submitted this one.
          reportContent("photo", {
            targetType: "rallySubmission",
            targetId: submission._id,
            reportedUser: submission.userId,
            groupId,
            content: `Rally: ${rally.task}`,
          });
        }}
        footer={(photo) => {
          const submission = submissions.find((item) => item._id === photo.id);
          if (!submission) return null;
          const own = submission.userId === user?.id;
          return (
            <Button
              size="lg"
              variant={own ? "secondary" : "default"}
              disabled={own || vote.isPending}
              onPress={() => requestVote(submission)}
            >
              <Text>{own ? "Your photo" : "Vote for this photo"}</Text>
            </Button>
          );
        }}
      />

      <Sheet ref={sheetRef} className="gap-4" onDismiss={() => setPending(null)}>
        <Text className="text-center text-lg font-bold text-foreground">
          Vote for this photo?
        </Text>
        {pending ? (
          <Image
            source={{ uri: pending.imageUrl, cacheKey: pending._id }}
            style={{ width: "100%", height: 200, borderRadius: 16 }}
            contentFit="cover"
            transition={150}
          />
        ) : null}
        <View className="gap-2">
          <Button size="lg" disabled={vote.isPending} onPress={confirmVote}>
            <Text>{vote.isPending ? "Voting…" : "Yes, vote for it"}</Text>
          </Button>
          <Button variant="ghost" onPress={() => sheetRef.current?.dismiss()}>
            <Text>Cancel</Text>
          </Button>
        </View>
      </Sheet>
    </View>
  );
}

function VoteSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton className="h-4 w-56 self-center rounded-full" />
      {[0, 1].map((index) => (
        <View key={index} className="gap-3 rounded-2xl border border-border bg-card p-3">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </View>
      ))}
    </View>
  );
}
