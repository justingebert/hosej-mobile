import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import type {
  QuestionOptionDTO,
  QuestionWithUserStateDTO,
} from "@/lib/api/types/question";
import { FeaturePlaceholder } from "./question-placeholders";
import { QuestionSubmitButton } from "./question-submit-button";
import { optionDisplayLabel, optionResponseValue } from "./question-utils";

export type OptionQuestionScreenProps = {
  question: QuestionWithUserStateDTO;
  selectedResponses: string[];
  isSubmitting: boolean;
  canSubmit: boolean;
  submitError: string | null;
  onToggleOption: (option: QuestionOptionDTO) => void;
  onSubmit: () => void;
};

export function OptionQuestionScreen({
  question,
  selectedResponses,
  isSubmitting,
  canSubmit,
  submitError,
  onToggleOption,
  onSubmit,
  isImage = false,
}: OptionQuestionScreenProps & { isImage?: boolean }) {
  const options = question.options ?? [];

  if (options.length === 0) {
    return (
      <FeaturePlaceholder
        title="No options"
        body="This question does not have selectable options."
      />
    );
  }

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-3">
        {options.map((option, index) => (
          <QuestionOptionButton
            key={`${optionResponseValue(option)}-${index}`}
            isImage={isImage}
            isSelected={selectedResponses.includes(optionResponseValue(option))}
            option={option}
            onPress={() => onToggleOption(option)}
          />
        ))}
      </View>
      <QuestionSubmitButton
        canSubmit={canSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={onSubmit}
      />
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
  const basis = "47%" as `${number}%`;

  return (
    <Pressable
      className={`rounded-xl border p-3 ${
        isSelected ? "border-primary bg-primary" : "border-border bg-secondary"
      }`}
      style={{
        borderCurve: "continuous",
        flexBasis: basis,
        flexGrow: 1,
        minHeight: isImage ? 120 : 64,
      }}
      onPress={onPress}
    >
      {isImage && typeof option !== "string" ? (
        <Image
          source={{ uri: option.url }}
          className="h-24 w-full rounded-lg bg-muted"
          contentFit="cover"
        />
      ) : (
        <Text
          selectable
          adjustsFontSizeToFit
          numberOfLines={3}
          className={`text-center text-sm font-bold ${
            isSelected ? "text-primary-foreground" : "text-secondary-foreground"
          }`}
        >
          {optionDisplayLabel(option)}
        </Text>
      )}
    </Pressable>
  );
}
