import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { QuestionType, type QuestionOptionDTO } from "@/lib/api/types/question";
import { cn } from "@/lib/utils";
import { AspectImage } from "./aspect-image";
import { optionKey } from "./question-utils";

type QuestionOptionsListProps = {
  options: QuestionOptionDTO[];
  questionType: QuestionType;
  title?: string;
  className?: string;
};

// Read-only list of the question's options (what people could pick). Image
// questions render the option images; everything else renders the option text.
export function QuestionOptionsList({
  className,
  options,
  questionType,
  title,
}: QuestionOptionsListProps) {
  if (options.length === 0) {
    return null;
  }

  const isImage = questionType === QuestionType.Image;

  return (
    <View className={cn("gap-2", className)}>
      {title ? (
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </Text>
      ) : null}

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
    </View>
  );
}
