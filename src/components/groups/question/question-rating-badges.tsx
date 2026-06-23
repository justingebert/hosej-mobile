import { View } from "react-native";
import { Text } from "@/components/ui/text";
import type { QuestionRatingDTO } from "@/lib/api/types/question";

// Read-only 👎 / 👌 / 👍 counts of how the group rated the question itself.
export function QuestionRatingBadges({ rating }: { rating: QuestionRatingDTO }) {
  const badges = [
    { emoji: "👎", count: rating.bad?.length ?? 0 },
    { emoji: "👌", count: rating.ok?.length ?? 0 },
    { emoji: "👍", count: rating.good?.length ?? 0 },
  ];

  return (
    <View className="flex-row justify-around">
      {badges.map((badge) => (
        <View
          key={badge.emoji}
          className="flex-row items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5"
        >
          <Text className="text-base">{badge.emoji}</Text>
          <Text className="text-sm font-bold text-secondary-foreground">
            {badge.count}
          </Text>
        </View>
      ))}
    </View>
  );
}
