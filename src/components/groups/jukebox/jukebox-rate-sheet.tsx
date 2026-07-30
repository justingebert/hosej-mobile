import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Sheet, type SheetHandle } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { StyledImage } from "@/components/groups/question/styled-image";
import { SongLinks } from "./jukebox-song-links";
import { SongRatingSlider } from "./song-rating-slider";
import { ratingTextClass } from "./jukebox-utils";
import { useRateSong } from "@/lib/api/jukebox";
import type { JukeboxSongDTO } from "@/lib/api/types/jukebox";

const DEFAULT_RATING = 50;

export type JukeboxRateSheetHandle = { present: () => void };


export const JukeboxRateSheet = forwardRef<
  JukeboxRateSheetHandle,
  { groupId: string; jukeboxId: string; song: JukeboxSongDTO | null }
>(function JukeboxRateSheet({ groupId, jukeboxId, song }, ref) {
  const sheetRef = useRef<SheetHandle>(null);
  const [rating, setRating] = useState(DEFAULT_RATING);
  const [moved, setMoved] = useState(false);
  const rate = useRateSong(groupId, jukeboxId);

  useImperativeHandle(ref, () => ({ present: () => sheetRef.current?.present() }), []);

  // Each song starts fresh — otherwise the previous song's score carries over
  // and reads as already-chosen.
  useEffect(() => {
    setRating(DEFAULT_RATING);
    setMoved(false);
  }, [song?._id]);

  const submit = () => {
    if (!song || !moved) return;
    rate.mutate(
      { songId: song._id, rating },
      { onSuccess: () => sheetRef.current?.dismiss() }
    );
  };

  return (
    <Sheet ref={sheetRef}>
      {song ? (
        <>
          <View className="items-center gap-2">
            <StyledImage
              uri={song.coverImageUrl}
              className="size-36 rounded-xl"
            />
            <Text variant="large" className="text-center">
              {song.title}
            </Text>
            <Text className="text-center text-sm text-muted-foreground">
              {song.artist}
              {song.album ? ` · ${song.album}` : ""}
            </Text>
          </View>

          <View className="items-center">
            <SongLinks song={song} />
          </View>

          <View className="gap-2">
            <Text className={`text-center text-4xl font-extrabold ${ratingTextClass(rating)}`}>
              {rating}
            </Text>
            <SongRatingSlider value={rating} onValueChange={(next) => {
              setRating(next);
              setMoved(true);
            }} />
          </View>

          <Button disabled={!moved || rate.isPending} onPress={submit}>
            <Text>{rate.isPending ? "Submitting…" : moved ? "Submit rating" : "Move the slider"}</Text>
          </Button>
        </>
      ) : null}
    </Sheet>
  );
});
