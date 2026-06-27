import { useMemo } from "react";
import { type Href, Link } from "expo-router";
import { Platform, Pressable, Share as RNShare, StyleSheet, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { buildInviteLink, fetchInviteCode, useGroups } from "@/lib/api/groups";
import { toastError } from "@/lib/toast";
import type { GroupDTO } from "@/lib/api/types/group";
import { Share, Star } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";

const GROUP_VIBES = [
  "hosej-ing...",
  "gossiping...",
  "rallying...",
  "jukeboxing...",
  "group-chatting...",
  "tallying votes...",
] as const;

export function GroupsRootScreen() {
  const { data, error, isError, isPending, isRefetching, refetch } = useGroups();
  const groups = useMemo(() => data?.groups ?? [], [data?.groups]);

  const vibesByGroup = useMemo(() => {
    const vibes: Record<string, string> = {};
    groups.forEach((group, index) => {
      vibes[group._id] = GROUP_VIBES[index % GROUP_VIBES.length];
    });
    return vibes;
  }, [groups]);

  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();

  return (
    <View className="flex-1">
      <Screen
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerClassName="grow gap-6 px-5 pt-5 pb-36"
      >
        <View className="flex-1 gap-6">
          {isPending ? (
            <GroupsSkeleton />
          ) : isError ? (
            <ErrorCard
              title="Could not load groups"
              error={error}
              onRetry={refetch}
              isRetrying={isRefetching}
            />
          ) : groups.length === 0 ? (
            <EmptyState title="No groups yet" />
          ) : (
            <View className="gap-3">
              {groups.map((group) => (
                <GroupCard key={group._id} group={group} vibe={vibesByGroup[group._id]} />
              ))}
            </View>
          )}
        </View>
      </Screen>

      <View className="absolute inset-x-0 bottom-0">
        <View className="overflow-hidden">
          <View
            className="flex-row gap-3 px-5 pt-3 bg-background"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <Link href="/groups/join" asChild>
              <Button variant="outline" className="flex-1">
                <Text>Join</Text>
              </Button>
            </Link>
            <Link href="/groups/create" asChild>
              <Button className="flex-1">
                <Text>Create</Text>
              </Button>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}

function GroupCard({ group, vibe }: { group: GroupDTO; vibe: string }) {
  const dashboardHref = `/groups/${group._id}/dashboard` as Href;

  const handleShare = async () => {
    let code: string;
    try {
      ({ code } = await fetchInviteCode(group._id));
    } catch {
      toastError("Could not get invite link");
      return;
    }
    const joinLink = buildInviteLink(code);
    const message = `Join my group "${group.name}" on HoseJ!`;
    try {
      // iOS shows `url` as a rich link; Android only reads `message`, so fold it in there.
      await RNShare.share(
        Platform.OS === "ios"
          ? { title: message, url: joinLink, message }
          : { title: message, message: `${message}\n${joinLink}` },
      );
    } catch {
      // Share sheet dismissed or unavailable — nothing actionable.
    }
  };

  return (
    <Link href={dashboardHref} asChild>
      <Pressable
        className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm"
        style={{
          borderCurve: "continuous",
        }}
      >
        <View className="absolute bottom-4 left-0 top-4 w-1 rounded-r-full bg-accent" />
        <View className="flex-row items-center justify-between gap-4 pl-1">
          <View className="flex-1 gap-1">
            <Text numberOfLines={1} className="text-xl font-extrabold text-card-foreground">
              {group.name}
            </Text>
            <Text className="text-sm text-muted-foreground">{vibe}</Text>
          </View>

          <View className="flex-row items-center gap-4">
            <Icon as={Star} className="size-6" />
            <Pressable onPress={handleShare} hitSlop={8} accessibilityLabel={`Share ${group.name}`}>
              <Icon as={Share} className="size-5" />
            </Pressable>
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
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </View>
      ))}
    </View>
  );
}
