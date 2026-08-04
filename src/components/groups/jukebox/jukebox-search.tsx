import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
import { useCSSVariable } from "uniwind";
import { Button } from "@/components/ui/button";
import { HapticPressable } from "@/components/ui/haptic-pressable";
import { Icon } from "@/components/ui/icon";
import { Sheet, type SheetHandle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { StyledImage } from "@/components/groups/question/styled-image";
import { toAddSongInput, useAddSong, useTrackSearch } from "@/lib/api/jukebox";
import type { JukeboxDTO, SpotifyTrackDTO } from "@/lib/api/types/jukebox";

export function JukeboxSearch({ jukebox }: { jukebox: JukeboxDTO }) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrackDTO | null>(null);
  const sheetRef = useRef<SheetHandle>(null);
  const placeholderColor = useCSSVariable("--color-muted-foreground") as string;

  const { data: tracks, isPending, isError, refetch } = useTrackSearch(jukebox.groupId, query);
  const addSong = useAddSong(jukebox.groupId, jukebox._id);

  const runSearch = () => {
    const trimmed = draft.trim();
    if (trimmed) setQuery(trimmed);
  };

  const selectTrack = (track: SpotifyTrackDTO) => {
    setSelectedTrack(track);
    sheetRef.current?.present();
  };

  const submit = () => {
    if (!selectedTrack) return;
    addSong.mutate(toAddSongInput(selectedTrack), {
      onSuccess: () => sheetRef.current?.dismiss(),
    });
  };

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text variant="large">Add your song</Text>
        <Text className="text-sm text-muted-foreground">
          You&apos;ll see everyone else&apos;s once you&apos;ve picked yours.
        </Text>
      </View>

      <View className="flex-row items-center gap-2 rounded-2xl bg-card px-4 py-2.5">
        <Icon as={Search} className="size-5 text-muted-foreground" />
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={runSearch}
          placeholder="Search for a song…"
          placeholderTextColor={placeholderColor}
          returnKeyType="search"
          autoCorrect={false}
          className="flex-1 text-base text-foreground"
        />
      </View>

      {/* Embedded region: the search field above stays valid whatever happens here. */}
      {query.length === 0 ? null : isPending ? (
        <SearchResultsSkeleton />
      ) : isError ? (
        <Button variant="link" size="sm" onPress={() => refetch()} className="self-start">
          <Text>Couldn&apos;t search · Try again</Text>
        </Button>
      ) : tracks.length === 0 ? (
        <Text className="text-sm text-muted-foreground">
          No results for &ldquo;{query}&rdquo;.
        </Text>
      ) : (
        <View className="gap-2">
          {tracks.map((track) => (
            <TrackRow key={track.id} track={track} onPress={() => selectTrack(track)} />
          ))}
        </View>
      )}

      <Sheet ref={sheetRef}>
        {selectedTrack ? (
          <>
            <View className="items-center gap-2">
              <StyledImage
                uri={selectedTrack.album.images[0]?.url ?? ""}
                className="size-36 rounded-xl"
              />
              <Text variant="large" className="text-center">
                {selectedTrack.name}
              </Text>
              <Text className="text-center text-sm text-muted-foreground">
                {selectedTrack.artists.map((artist) => artist.name).join(", ")}
              </Text>
            </View>

            <Button disabled={addSong.isPending} onPress={submit}>
              <Text>{addSong.isPending ? "Adding…" : "Add this song"}</Text>
            </Button>
          </>
        ) : null}
      </Sheet>
    </View>
  );
}

function TrackRow({
  track,
  onPress,
}: {
  track: SpotifyTrackDTO;
  onPress: () => void;
}) {
  return (
    <HapticPressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3 active:opacity-80"
      style={{ borderCurve: "continuous" }}
    >
      <StyledImage uri={track.album.images[0]?.url ?? ""} className="size-16 rounded-lg" />
      <View className="flex-1 gap-0.5">
        <Text className="font-bold text-card-foreground" numberOfLines={1}>
          {track.name}
        </Text>
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          {track.artists.map((artist) => artist.name).join(", ")}
        </Text>
        <Text className="text-xs text-muted-foreground/70" numberOfLines={1}>
          {track.album.name}
        </Text>
      </View>
    </HapticPressable>
  );
}

function SearchResultsSkeleton() {
  return (
    <View className="gap-2">
      {[0, 1, 2, 3, 4].map((index) => (
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
  );
}
