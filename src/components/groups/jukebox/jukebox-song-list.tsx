import { useRef, useState } from "react";
import { View } from "react-native";
import { HapticPressable } from "@/components/ui/haptic-pressable";
import { Text } from "@/components/ui/text";
import { UserAvatar } from "@/components/ui/user-avatar";
import { StyledImage } from "@/components/groups/question/styled-image";
import { SongLinks } from "./jukebox-song-links";
import { JukeboxRateSheet, type JukeboxRateSheetHandle } from "./jukebox-rate-sheet";
import { ratingBgClass, ratingTextClass } from "./jukebox-utils";
import type { JukeboxDTO, JukeboxSongDTO } from "@/lib/api/types/jukebox";


export function JukeboxSongList({ jukebox }: { jukebox: JukeboxDTO }) {
  const sheetRef = useRef<JukeboxRateSheetHandle>(null);
  const [selectedSong, setSelectedSong] = useState<JukeboxSongDTO | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const onSongPress = (song: JukeboxSongDTO) => {
    if (!song.userHasRated) {
      setSelectedSong(song);
      sheetRef.current?.present();
      return;
    }
    setExpandedIds((prev) => ({ ...prev, [song._id]: !prev[song._id] }));
  };

  // No empty branch: the server derives `userHasSubmitted` from the songs
  // themselves, so reaching this list guarantees at least your own song.
  return (
    <>
      <View className="gap-3">
        {jukebox.songs.map((song) => (
          <SongRow
            key={song._id}
            song={song}
            expanded={!!expandedIds[song._id]}
            onPress={() => onSongPress(song)}
          />
        ))}
      </View>

      <JukeboxRateSheet
        ref={sheetRef}
        groupId={jukebox.groupId}
        jukeboxId={jukebox._id}
        song={selectedSong}
      />
    </>
  );
}

function SongRow({
  song,
  expanded,
  onPress,
}: {
  song: JukeboxSongDTO;
  expanded: boolean;
  onPress: () => void;
}) {
  return (
    <View className="gap-2">
      <HapticPressable
        onPress={onPress}
        className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3 active:opacity-80"
        style={{ borderCurve: "continuous" }}
      >
        <StyledImage uri={song.coverImageUrl} className="size-16 rounded-lg" />

        <View className="flex-1 gap-0.5">
          <Text className="font-bold text-card-foreground" numberOfLines={1}>
            {song.title}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {song.artist}
          </Text>
          {song.album ? (
            <Text className="text-xs text-muted-foreground/70" numberOfLines={1}>
              {song.album}
            </Text>
          ) : null}
        </View>

        {song.userHasRated ? <ScoreBadge avgRating={song.avgRating} /> : <RatePrompt />}
      </HapticPressable>

      {expanded && song.userHasRated ? <SongDetail song={song} /> : null}
    </View>
  );
}

function ScoreBadge({ avgRating }: { avgRating: number | null }) {
  if (avgRating === null) {
    return (
      <View className="rounded-full bg-muted px-2.5 py-1">
        <Text className="text-xs font-bold text-muted-foreground">–</Text>
      </View>
    );
  }

  return (
    <View className={`rounded-full px-2.5 py-1 ${ratingBgClass(avgRating)}`}>
      <Text className="text-sm font-extrabold text-primary-foreground">
        {avgRating.toFixed(1)}
      </Text>
    </View>
  );
}

function RatePrompt() {
  return (
    <View className="rounded-full bg-primary px-3 py-1.5">
      <Text className="text-xs font-bold text-primary-foreground">Rate</Text>
    </View>
  );
}

function SongDetail({ song }: { song: JukeboxSongDTO }) {
  return (
    <View className="gap-2 px-2">
      {/* Submitter on the left, music-service handoff on the right — same row, as on web. */}
      <View className="flex-row items-center justify-between gap-3 rounded-xl bg-secondary py-1 pl-3 pr-1">
        <View className="flex-1 flex-row items-center gap-2">
          <UserAvatar
            name={song.submittedBy.username}
            avatarUrl={song.submittedBy.avatarUrl}
            className="size-6"
          />
          <Text className="flex-1 text-sm text-secondary-foreground" numberOfLines={1}>
            {song.submittedBy.username}
          </Text>
        </View>
        <SongLinks song={song} />
      </View>

      {song.ratings.map((rating) => (
        <View
          key={rating.userId._id}
          className="flex-row items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2"
        >
          <View className="flex-row items-center gap-2">
            <UserAvatar
              name={rating.userId.username}
              avatarUrl={rating.userId.avatarUrl}
              className="size-6"
            />
            <Text className="text-sm text-secondary-foreground">
              {rating.userId.username}
            </Text>
          </View>
          <Text className={`font-extrabold ${ratingTextClass(rating.rating)}`}>
            {rating.rating}
          </Text>
        </View>
      ))}
    </View>
  );
}
