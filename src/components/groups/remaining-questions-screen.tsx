import { View } from "react-native";

import { Card, CardContent } from "@/components/ui/card";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useGroupStats } from "@/lib/api/stats";
import type { GroupStatsDTO } from "@/lib/api/types/group";
import { useGroupId } from "@/lib/group-id";

export function RemainingQuestionsScreen() {
  const groupId = useGroupId();
  const { data: stats, error, isError, isPending, isRefetching, refetch } = useGroupStats(groupId);

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      {isPending ? (
        <RemainingSkeleton />
      ) : isError ? (
        <ErrorCard
          title="Could not load details"
          error={error}
          onRetry={refetch}
          isRetrying={isRefetching}
        />
      ) : (
        <RemainingContent stats={stats!} />
      )}
    </Screen>
  );
}

function RemainingContent({ stats }: { stats: GroupStatsDTO }) {
  return (
    <View className="gap-4">
      <Card>
        <CardContent className="gap-3">
          <SourceRow
            label="Self-created"
            left={stats.selfCreatedLeftCount}
            used={stats.selfCreatedUsedCount}
          />
          <SourceRow
            label="From packs"
            left={stats.packQuestionsLeftCount}
            used={stats.packQuestionsUsedCount}
          />
        </CardContent>
      </Card>

      {stats.packs.length > 0 ? (
        <View className="gap-2">
          <Text className="text-sm font-semibold text-muted-foreground">Packs</Text>
          <Card>
            <CardContent className="gap-2">
              <View className="flex-row">
                <Text className="flex-1 text-xs text-muted-foreground">Pack</Text>
                <Text className="w-12 text-right text-xs text-muted-foreground">Left</Text>
                <Text className="w-12 text-right text-xs text-muted-foreground">Used</Text>
                <Text className="w-12 text-right text-xs text-muted-foreground">Total</Text>
              </View>
              {stats.packs.map((pack) => (
                <View key={pack.packId} className="flex-row">
                  <Text className="flex-1 font-medium" numberOfLines={1}>
                    {pack.name}
                  </Text>
                  <Text className="w-12 text-right">{pack.left}</Text>
                  <Text className="w-12 text-right text-muted-foreground">{pack.used}</Text>
                  <Text className="w-12 text-right text-muted-foreground">{pack.total}</Text>
                </View>
              ))}
            </CardContent>
          </Card>
        </View>
      ) : null}
    </View>
  );
}

function SourceRow({ label, left, used }: { label: string; left: number; used: number }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="font-medium">{label}</Text>
      <Text className="text-sm text-muted-foreground">
        {left} left · {used} used
      </Text>
    </View>
  );
}

function RemainingSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </View>
  );
}
