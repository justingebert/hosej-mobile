import { useMemo } from "react";
import { type Href, Link } from "expo-router";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useGroups } from "@/lib/api/groups";
import type { GroupDTO } from "@/lib/api/types/group";
import { API_URL } from "@/lib/config";

const GROUP_VIBES = [
  "hosej-ing...",
  "gossiping...",
  "rallying...",
  "jukeboxing...",
  "group-chatting...",
  "tallying votes...",
] as const;

export function GroupsRootScreen() {
  const {data, error, isError, isPending, isRefetching, refetch} = useGroups();
  const groups = useMemo(() => data?.groups ?? [], [data?.groups]);

  const vibesByGroup = useMemo(() => {
    const vibes: Record<string, string> = {};
    groups.forEach((group, index) => {
      vibes[group._id] = GROUP_VIBES[index % GROUP_VIBES.length];
    });
    return vibes;
  }, [groups]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow gap-6 p-5"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colorsClassName="accent-muted-foreground"
          tintColorClassName="accent-muted-foreground"
        />
      }
    >
      <View className="w-full flex-1 gap-6">
        <View className="flex-row items-center justify-between">
          <Link href="/help" asChild>
            <Pressable>
              <CircleHelp className="h-5 w-5" />
            </Pressable>
          </Link>

          <Text className="text-4xl font-extrabold text-foreground">Groups</Text>

          <Link href="/settings" asChild>
            <Pressable>
              <User className="h-5 w-5" />
            </Pressable>
          </Link>
        </View>

        {isPending ? (
          <GroupsSkeleton/>
        ) : isError ? (
          <GroupsErrorState error={error} isRetrying={isRefetching} onRetry={refetch}/>
        ) : groups.length === 0 ? (
          <EmptyState/>
        ) : (
          <View className="gap-3">
            {groups.map((group) => (
              <GroupCard key={group._id} group={group} vibe={vibesByGroup[group._id]}/>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function GroupCard({group, vibe}: { group: GroupDTO; vibe: string }) {
  const dashboardHref = `/groups/${group._id}/dashboard` as Href;

  return (
    <Link href={dashboardHref} asChild>
      <Pressable
        className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm"
        style={{
          borderCurve: "continuous",
        }}
      >
        <View className="absolute bottom-4 left-0 top-4 w-1 rounded-r-full bg-accent"/>
        <View className="flex-row items-center justify-between gap-4 pl-1">
          <View className="flex-1 gap-1">
            <Text numberOfLines={1} className="text-xl font-extrabold text-card-foreground">
              {group.name}
            </Text>
            <Text className="text-sm text-muted-foreground">{vibe}</Text>
          </View>

          <View className="items-end">
            <Text>Share</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function GroupsSkeleton() {
  return (
    <View className="gap-3">
      {[0, 1, 2].map((item) => (
        <View
          key={item}
          className="gap-3 rounded-2xl border border-border bg-card p-5 opacity-70"
          style={{
            borderCurve: "continuous",
          }}
        >
          <View className="h-5 w-1/2 rounded bg-muted"/>
          <View className="h-4 w-1/3 rounded bg-muted"/>
        </View>
      ))}
    </View>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-2xl font-extrabold text-foreground">No groups yet</Text>
    </View>
  );
}

function GroupsErrorState({
                            error,
                            isRetrying,
                            onRetry,
                          }: {
  error: Error | null;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <View
      className="gap-3 rounded-2xl border border-border bg-card p-5"
      style={{
        borderCurve: "continuous",
      }}
    >
      <Text className="text-sm font-extrabold text-destructive">
        Could not load groups
      </Text>
      <Text selectable className="text-base text-card-foreground">
        {error?.message}
      </Text>
      <Text selectable className="text-xs text-muted-foreground">
        API: {API_URL}
      </Text>
      <Pressable
        className="self-start rounded-full bg-primary px-4 py-2 disabled:opacity-60"
        disabled={isRetrying}
        onPress={onRetry}
      >
        <Text className="text-sm font-bold text-primary-foreground">
          {isRetrying ? "Retrying..." : "Try again"}
        </Text>
      </Pressable>
    </View>
  );
}
