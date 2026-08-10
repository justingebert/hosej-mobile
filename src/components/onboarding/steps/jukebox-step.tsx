import { useState } from "react";
import { View } from "react-native";
import { Music } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { SongRatingSlider } from "@/components/groups/jukebox/song-rating-slider";
import { ratingTextClass } from "@/components/groups/jukebox/jukebox-utils";
import { StepHeader } from "../step-header";

const DEFAULT_RATING = 50;

export function JukeboxStep() {
  const [rating, setRating] = useState(DEFAULT_RATING);

  return (
    <View className="gap-4 py-2">
      <View className="gap-1">
        <StepHeader
          title="Jukebox"
          subtitle="Share music, listen and rate submissions and chat about results."
        />
        {/* Not "drag the slider" — the non-iOS fallback is preset buttons. */}
        <Text className="text-sm">Give it a score.</Text>
      </View>

      <View className="gap-3 rounded-2xl bg-secondary/30 p-4">
        <View className="flex-row items-center gap-3">
          <View className="size-14 items-center justify-center rounded-lg bg-primary/10">
            <Icon as={Music} className="size-7 text-primary" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold" numberOfLines={1}>
              Bohemian Rhapsody
            </Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              Queen
            </Text>
          </View>
        </View>

        <Text className={`text-center text-4xl font-extrabold ${ratingTextClass(rating)}`}>
          {rating}
        </Text>
        <SongRatingSlider value={rating} onValueChange={setRating} />
      </View>

      <Text className="text-center text-xs text-muted-foreground">
        Scores stay hidden until you&rsquo;ve rated a song yourself.
      </Text>
    </View>
  );
}
