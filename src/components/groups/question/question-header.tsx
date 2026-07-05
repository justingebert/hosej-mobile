import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { StyledImage } from "./styled-image";

// Question text + optional image. Shared by the daily-question tab and the
// standalone results page so both render the prompt identically. When `onPress`
// is set (post-vote, active flow), the prompt card is tappable — it opens the
// rating sheet.
export function QuestionHeader({
  question,
  imageUrl,
  imageCacheKey,
  onPress,
}: {
  question: string;
  imageUrl?: string;
  imageCacheKey?: string;
  onPress?: () => void;
}) {
  const prompt = (
    <Text selectable className="text-center text-2xl font-extrabold">
      {question}
    </Text>
  );

  return (
    <View className="gap-4">
      {onPress ? (
        <Pressable
          onPress={onPress}
          className="gap-2 rounded-xl bg-primary/10 p-4 active:opacity-80"
        >
          {prompt}
        </Pressable>
      ) : (
        <View className="gap-2 rounded-xl bg-primary/10 p-4">{prompt}</View>
      )}

      {imageUrl ? (
        <StyledImage
          uri={imageUrl}
          cacheKey={imageCacheKey}
          className="h-56 w-full rounded-xl"
        />
      ) : null}
    </View>
  );
}
