import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { QuestionType, type QuestionOptionDTO } from "@/lib/api/types/question";
import { AspectImage } from "./aspect-image";
import { optionKey } from "./question-utils";

// Read-only list of the question's options (what people could pick). Image
// questions render the option images; everything else renders the option text.
export function QuestionOptionsList({
  options,
  questionType,
}: {
  options: QuestionOptionDTO[];
  questionType: QuestionType;
}) {
  const isImage = questionType === QuestionType.Image;

  return (
    <View className="gap-2">
      {options.map((option, index) => {
        const isImageOption = isImage && typeof option !== "string";

        return (
          <View
            key={`${optionKey(option)}-${index}`}
            className="rounded-xl bg-secondary p-3"
          >
            {isImageOption ? (
              <AspectImage
                uri={option.url}
                cacheKey={option.key}
                className="rounded-lg"
              />
            ) : (
              <Text className="text-center text-secondary-foreground">
                {optionKey(option)}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
