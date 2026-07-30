import { Host, Slider } from "@expo/ui/swift-ui";
import { MAX_SONG_RATING, MIN_SONG_RATING } from "@/lib/api/types/jukebox";

export function SongRatingSlider({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (value: number) => void;
}) {
  return (
    <Host style={{ height: 44 }}>
      <Slider
        value={value}
        min={MIN_SONG_RATING}
        max={MAX_SONG_RATING}
        onValueChange={(next) => onValueChange(Math.round(next))}
      />
    </Host>
  );
}
