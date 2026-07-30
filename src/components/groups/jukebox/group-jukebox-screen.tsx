import { useState } from "react";
import { View } from "react-native";
import { useGroupId } from "@/lib/group-id";
import { useActiveJukeboxes } from "@/lib/api/jukebox";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import { JukeboxSearch } from "./jukebox-search";
import { JukeboxSongList } from "./jukebox-song-list";
import type { JukeboxDTO } from "@/lib/api/types/jukebox";

export function GroupJukeboxScreen() {
  const groupId = useGroupId();
  const { data, error, isError, isPending, isRefetching, refetch } =
    useActiveJukeboxes(groupId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const jukeboxes = data ?? [];
  const activeJukebox =
    jukeboxes.find((jukebox) => jukebox._id === selectedId) ?? jukeboxes[0];

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching} avoidKeyboard>
      {isPending ? (
        <JukeboxSkeleton />
      ) : isError ? (
        <ErrorCard
          title="Could not load the jukebox"
          error={error}
          onRetry={refetch}
          isRetrying={isRefetching}
        />
      ) : jukeboxes.length === 0 ? (
        <EmptyState
          title="No jukebox running"
          description="Nothing to vote on right now — a new jukebox opens automatically."
        />
      ) : activeJukebox ? (
        <View className="gap-4">
          {/* A group can run several concurrent jukeboxes; one is the default. */}
          {jukeboxes.length > 1 ? (
            <JukeboxTabs
              jukeboxes={jukeboxes}
              activeId={activeJukebox._id}
              onSelect={setSelectedId}
            />
          ) : null}

          {activeJukebox.userHasSubmitted ? (
            <JukeboxSongList jukebox={activeJukebox} />
          ) : (
            <JukeboxSearch jukebox={activeJukebox} />
          )}
        </View>
      ) : null}
    </Screen>
  );
}

function JukeboxTabs({
  jukeboxes,
  activeId,
  onSelect,
}: {
  jukeboxes: JukeboxDTO[];
  activeId: string;
  onSelect: (jukeboxId: string) => void;
}) {
  return (
    <Tabs value={activeId} onValueChange={onSelect}>
      <TabsList>
        {jukeboxes.map((jukebox, index) => (
          <TabsTrigger key={jukebox._id} value={jukebox._id} className="flex-1">
            <Text>{jukebox.title ?? `Jukebox ${index + 1}`}</Text>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function JukeboxSkeleton() {
  return (
    <View className="gap-4">
      <View className="gap-2">
        <Skeleton className="h-6 w-40 rounded-md" />
        <Skeleton className="h-4 w-64 rounded-md" />
      </View>
      <Skeleton className="h-12 w-full rounded-2xl" />
      <View className="gap-2">
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <Skeleton className="size-16 rounded-lg" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
