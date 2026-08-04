import { Link, type Href } from "expo-router";
import { Camera, Radio, type LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { useGroupId } from "@/lib/group-id";
import { useActiveQuestions } from "@/lib/api/questions";
import { ErrorCard } from "@/components/ui/error-card";
import { HapticPressable } from "@/components/ui/haptic-pressable";
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
  const orange = useCSSVariable("--color-chart-3") as string;
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
                {total > 0 ? `you: ${answered}/${total} · ` : ""}tap to answer
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

      <FeatureLinkCard
        icon={Camera}
        title="Rally"
        subtitle="submit a photo, vote on the rest"
        href={`/groups/${groupId}/rally` as Href}
      />
      <FeatureLinkCard
        icon={Radio}
        title="Jukebox"
        subtitle="drop a track, rate the rest"
        href={`/groups/${groupId}/jukebox` as Href}
      />
    </Screen>
  );
}

function FeatureLinkCard({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: Href;
}) {
  return (
    <Link href={href} asChild>
      <HapticPressable
        className="flex-row items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-card px-5 py-5 active:opacity-80"
        style={{
          borderCurve: "continuous",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
        }}
      >
        <View className="flex-1 gap-1">
          <Text className="text-2xl font-extrabold text-card-foreground">{title}</Text>
          <Text className="text-sm text-muted-foreground">{subtitle}</Text>
        </View>

        <View className="size-[84px] items-center justify-center rounded-full bg-primary/5">
          <Icon as={icon} className="size-10 text-primary" />
        </View>
      </HapticPressable>
    </Link>
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
