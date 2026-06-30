import { Link, type Href } from "expo-router";
import { Camera, MessageSquareText, Radio, type LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { useGroupId } from "@/lib/group-id";
import { useActiveQuestions } from "@/lib/api/questions";
import { ErrorCard } from "@/components/ui/error-card";
import { Icon } from "@/components/ui/icon";
import { RadialProgress } from "@/components/ui/radial-progress";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";

export function GroupDashboardScreen() {
  const groupId = useGroupId();
  const questionHref = `/groups/${groupId}/question` as Href;
  const { data, error, isError, isPending, isRefetching, refetch } = useActiveQuestions(groupId);

  // Traffic-light ring (web parity): red < 33 < orange < 66 < green.
  // useCSSVariable resolves to a hex string on native; cast for the SVG stroke.
  const red = useCSSVariable("--color-destructive") as string;
  const orange = useCSSVariable("--color-chart-5") as string;
  const green = useCSSVariable("--color-success") as string;
  const track = useCSSVariable("--color-muted") as string;

  const questions = data?.questions ?? [];
  const completion = data?.completionPercentage ?? 0;
  const total = questions.length;
  const answered = questions.filter((q) => q.userHasVoted).length;
  const ringColor = completion < 33 ? red : completion < 66 ? orange : green;

  return (
    <Screen
      onRefresh={refetch}
      refreshing={isRefetching}
      contentContainerClassName="grow justify-center gap-4 px-4 pb-24"
    >
      {isPending ? (
        <DailyQuestionSkeleton />
      ) : isError ? (
        <ErrorCard
          title="Could not load today's question"
          error={error}
          onRetry={refetch}
          isRetrying={isRefetching}
        />
      ) : (
        <Link href={questionHref} asChild>
          <Pressable
            className="flex-row items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-card px-5 py-5 active:opacity-80"
            style={{
              borderCurve: "continuous",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
            }}
          >
            <View className="flex-1 gap-1">
              <Text className="text-2xl font-extrabold text-card-foreground">
                Daily Question
              </Text>
              <Text className="text-sm text-muted-foreground">
                {total > 0 ? `you: ${answered}/${total} · ` : ""}tap to answer →
              </Text>
            </View>

            <RadialProgress
              value={completion}
              color={ringColor}
              trackColor={track}
              size={84}
              strokeWidth={9}
            >
              <Text className="text-base font-extrabold text-card-foreground">
                {completion}%
              </Text>
            </RadialProgress>
          </Pressable>
        </Link>
      )}

      <ComingSoonFeatureCard icon={Camera} eyebrow="Photo Rallies" title="Rally" />
      <ComingSoonFeatureCard icon={Radio} eyebrow="Group Playlist" title="Jukebox" />
    </Screen>
  );
}

function ComingSoonFeatureCard({
  icon,
  eyebrow,
  title,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
}) {
  return (
    <View
      className="flex-row items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-card px-5 py-5"
      style={{
        borderCurve: "continuous",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
      }}
    >
      <View className="flex-1 gap-2">
        <View className="flex-row flex-wrap items-center gap-2">
        <Text className="text-2xl font-extrabold text-card-foreground">{title}</Text>
          <View className="rounded-full bg-secondary px-2.5 py-1">
            <Text className="text-xs font-bold uppercase tracking-wider text-secondary-foreground">
              Coming soon
            </Text>
          </View>
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="text-sm text-muted-foreground">Use on web today</Text>
        </View>
      </View>

      <View className="size-[84px] items-center justify-center rounded-full bg-primary/5">
        <Icon as={icon} className="size-10 text-primary" />
      </View>
    </View>
  );
}

function DailyQuestionSkeleton() {
  return (
    <View className="flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-5">
      <View className="flex-1 gap-2">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-6 w-40 rounded-md" />
        <Skeleton className="h-4 w-32 rounded-md" />
      </View>
      <Skeleton className="size-[84px] rounded-full" />
    </View>
  );
}
