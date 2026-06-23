import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { StyledImage } from "./styled-image";

// Question text + optional image. Shared by the daily-question tab and the
// standalone results page so both render the prompt identically.
export function QuestionHeader({
  question,
  imageUrl,
  imageCacheKey,
}: {
  question: string;
  imageUrl?: string;
  imageCacheKey?: string;
}) {
  return (
    <View className="gap-4">
      <View className="gap-2 rounded-xl bg-primary/10 p-4">
        <Text selectable className="text-center text-2xl font-extrabold">
          {question}
        </Text>
      </View>

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
