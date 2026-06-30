import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import type { QuestionOptionDTO } from "@/lib/api/types/question";
import { cn } from "@/lib/utils";
import { StyledImage } from "./styled-image";
import { optionKey } from "./question-utils";
import type { QuestionInputProps } from "./types";

export function OptionQuestionScreen({
  question,
  response,
  onResponseChange,
  isImage = false,
}: QuestionInputProps & { isImage?: boolean }) {
  const options = question.options ?? [];
  const selectedResponses = Array.isArray(response) ? response : [];

  const toggleOption = (option: QuestionOptionDTO) => {
    const value = optionKey(option);

    const nextResponses = question.multiSelect
      ? selectedResponses.includes(value)
        ? selectedResponses.filter((item) => item !== value)
        : [...selectedResponses, value]
      : [value];

    onResponseChange(nextResponses.length > 0 ? nextResponses : null);
  };

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-3">
        {options.map((option, index) => (
          <QuestionOptionButton
            key={`${optionKey(option)}-${index}`}
            isImage={isImage}
            isSelected={selectedResponses.includes(optionKey(option))}
            option={option}
            onPress={() => toggleOption(option)}
          />
        ))}
      </View>
    </View>
  );
}

function QuestionOptionButton({
  isImage,
  isSelected,
  option,
  onPress,
}: {
  isImage: boolean;
  isSelected: boolean;
  option: QuestionOptionDTO;
  onPress: () => void;
}) {
  const isImageOption = isImage && typeof option !== "string";

  return (
    <Pressable
      className={cn(
        "basis-[47%] rounded-xl border",
        isImageOption ? "aspect-4/5 p-2" : "items-center justify-center p-3",
        isSelected ? "border-primary bg-primary" : "border-border bg-secondary"
      )}
      style={{ borderCurve: "continuous" }}
      onPress={onPress}
    >
      {isImageOption ? (
        <StyledImage
          uri={option.url}
          cacheKey={option.key}
          className="h-full w-full rounded-lg"
        />
      ) : (
        <Text
          selectable
          className={cn(
            "text-center text-sm font-bold",
            isSelected ? "text-primary-foreground" : "text-secondary-foreground"
          )}
        >
          {optionKey(option)}
        </Text>
      )}
    </Pressable>
  );
}
