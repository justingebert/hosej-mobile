import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { router, type Href } from "expo-router";
import { Calendar, MessageSquare, Users, type LucideIcon } from "lucide-react-native";
import { Pie, PolarChart } from "victory-native";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorCard } from "@/components/ui/error-card";
import { Icon } from "@/components/ui/icon";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useGroup } from "@/lib/api/groups";
import { useGroupStats } from "@/lib/api/stats";
import type { GroupStatsDTO, GroupWithAdminDTO } from "@/lib/api/types/group";
import { useGroupId } from "@/lib/group-id";

const CHART_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

const QUESTION_TYPE_LABELS: Record<string, string> = {
  users: "Members",
  custom: "Custom",
  image: "Image",
  text: "Text",
  rating: "Rating",
  pairing: "Pairing",
};

type Slice = { value: number; color: string; label: string };

export function GroupStatsScreen() {
  const groupId = useGroupId();
  const groupQ = useGroup(groupId);
  const statsQ = useGroupStats(groupId);

  const isPending = groupQ.isPending || statsQ.isPending;
  const isError = groupQ.isError || statsQ.isError;
  const isRefetching = groupQ.isRefetching || statsQ.isRefetching;
  const refetch = () => {
    groupQ.refetch();
    statsQ.refetch();
  };

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      {isPending ? (
        <StatsSkeleton />
      ) : isError ? (
        <ErrorCard
          title="Could not load stats"
          error={statsQ.error ?? groupQ.error}
          onRetry={refetch}
          isRetrying={isRefetching}
        />
      ) : (
        <StatsContent group={groupQ.data!} stats={statsQ.data!} />
      )}
    </Screen>
  );
}

function StatsContent({ group, stats }: { group: GroupWithAdminDTO; stats: GroupStatsDTO }) {
  const daysActive = Math.floor(
    (Date.now() - new Date(group.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalQuestions = stats.questionsUsedCount + stats.questionsLeftCount;

  const typeSlices: Slice[] = stats.questionsByType.map((d, i) => ({
    value: d.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
    label: QUESTION_TYPE_LABELS[d._id] ?? d._id,
  }));
  const userSlices: Slice[] = stats.questionsByUser.map((d, i) => ({
    value: d.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
    label: d.username,
  }));

  return (
    <View className="gap-6">
      <View className="flex-row gap-3">
        <StatCard label="days" value={daysActive} icon={Calendar} />
        <StatCard label="messages" value={stats.messagesCount} icon={MessageSquare} />
        <StatCard label="members" value={group.members.length} icon={Users} />
      </View>

      <View className="gap-3">
        <SectionTitle>Questions</SectionTitle>
        <View className="flex-row gap-3">
          <StatCard label="used" value={stats.questionsUsedCount} />
          <StatCard
            label="remaining"
            value={stats.questionsLeftCount}
            hint="tap for details"
            onPress={() => router.push(`/groups/${group._id}/remaining` as Href)}
          />
          <StatCard label="total" value={totalQuestions} />
        </View>
      </View>

      <DonutCard title="By Type" slices={typeSlices} />
      <DonutCard title="By User" slices={userSlices} />
    </View>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <Text className="text-lg font-semibold">{children}</Text>;
}

function StatCard({
  label,
  value,
  icon,
  hint,
  onPress,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  onPress?: () => void;
}) {
  const card = (
    <Card className="flex-1 gap-0 py-3">
      <CardContent className="items-center gap-1 px-2">
        {icon ? <Icon as={icon} className="size-4 text-muted-foreground" /> : null}
        <Text className="text-2xl font-bold">{value}</Text>
        <Text className="text-xs text-muted-foreground">{label}</Text>
        {hint ? <Text className="text-[10px] text-muted-foreground">{hint}</Text> : null}
      </CardContent>
    </Card>
  );

  if (!onPress) return card;
  return (
    <Pressable onPress={onPress} className="flex-1 active:opacity-60">
      {card}
    </Pressable>
  );
}

function DonutCard({ title, slices }: { title: string; slices: Slice[] }) {
  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        {slices.length === 0 ? (
          <Text className="py-8 text-center text-sm text-muted-foreground">No data yet</Text>
        ) : (
          <>
            <View style={{ height: 220 }}>
              <PolarChart data={slices} labelKey="label" valueKey="value" colorKey="color">
                <Pie.Chart innerRadius="60%" />
              </PolarChart>
            </View>
            <View className="gap-2">
              {slices.map((s) => (
                <View key={s.label} className="flex-row items-center gap-2">
                  <View className="size-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <Text className="flex-1 text-sm" numberOfLines={1}>
                    {s.label}
                  </Text>
                  <Text className="text-sm text-muted-foreground">{s.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <View className="gap-6">
      <View className="flex-row gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 flex-1 rounded-xl" />
        ))}
      </View>
      <View className="flex-row gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 flex-1 rounded-xl" />
        ))}
      </View>
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </View>
  );
}
