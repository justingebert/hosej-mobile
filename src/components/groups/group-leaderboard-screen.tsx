import { View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useGroup } from "@/lib/api/groups";
import type { GroupMemberDTO } from "@/lib/api/types/group";
import { useGroupId } from "@/lib/group-id";

export function GroupLeaderboardScreen() {
  const groupId = useGroupId();
  const { data: group, error, isError, isPending, isRefetching, refetch } = useGroup(groupId);

  const members = [...(group?.members ?? [])].sort((a, b) => b.points - a.points);

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      {isPending ? (
        <LeaderboardSkeleton />
      ) : isError ? (
        <ErrorCard
          title="Could not load leaderboard"
          error={error}
          onRetry={refetch}
          isRetrying={isRefetching}
        />
      ) : members.length === 0 ? (
        <EmptyState title="No members yet" />
      ) : (
        <View className="gap-1">
          {members.map((member, index) => (
            <LeaderboardRow key={member.user} rank={index + 1} member={member} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function LeaderboardRow({ rank, member }: { rank: number; member: GroupMemberDTO }) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <Text className="w-6 text-center font-medium text-muted-foreground">{rank}</Text>
      <UserAvatar name={member.name} avatarUrl={member.avatarUrl} className="size-9" />
      <Text className="flex-1 font-medium" numberOfLines={1}>
        {member.name}
      </Text>
      <Text
        className="w-20 shrink-0 text-right text-sm font-semibold"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {member.points} pts
      </Text>
      <Text className="w-12 shrink-0 text-right text-sm text-muted-foreground">
        {member.streak > 0 ? `${member.streak} 👖` : "—"}
      </Text>
    </View>
  );
}

function LeaderboardSkeleton() {
  return (
    <View className="gap-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} className="flex-row items-center gap-3 py-2">
          <Skeleton className="h-4 w-6 rounded" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-4 flex-1 rounded" />
          <Skeleton className="h-4 w-14 rounded" />
          <Skeleton className="h-4 w-10 rounded" />
        </View>
      ))}
    </View>
  );
}
