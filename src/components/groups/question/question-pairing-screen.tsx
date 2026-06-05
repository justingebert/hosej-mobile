import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { PairingMode, type QuestionWithUserStateDTO } from "@/lib/api/types/question";
import { FeaturePlaceholder } from "./question-placeholders";
import { QuestionSubmitButton } from "./question-submit-button";
import type { QuestionResponseSubmitHandler } from "./types";

export function PairingQuestionScreen({
  question,
  isSubmitting,
  submitError,
  onSubmit,
}: {
  question: QuestionWithUserStateDTO;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: QuestionResponseSubmitHandler;
}) {
  const keys = question.pairing?.keys ?? [];
  const values = question.pairing?.values ?? [];
  const isExclusive = question.pairing?.mode === PairingMode.Exclusive;
  const [selectedByKey, setSelectedByKey] = useState<Record<string, string>>({});

  if (keys.length === 0 || values.length === 0) {
    return (
      <FeaturePlaceholder
        title="Pairing question"
        body="This pairing question is missing keys or values."
      />
    );
  }

  const canSubmit = keys.every((key) => selectedByKey[key]);

  const selectValue = (key: string, value: string) => {
    setSelectedByKey((current) => {
      const next = { ...current };

      if (next[key] === value) {
        delete next[key];
        return next;
      }

      if (isExclusive) {
        for (const [existingKey, existingValue] of Object.entries(next)) {
          if (existingKey !== key && existingValue === value) {
            delete next[existingKey];
          }
        }
      }

      next[key] = value;
      return next;
    });
  };

  return (
    <View className="gap-4">
      <Text className="text-sm font-bold text-muted-foreground">
        Pick one value for each item.
      </Text>

      <View className="gap-4">
        {keys.map((key) => (
          <View key={key} className="gap-2">
            <Text selectable className="text-base font-extrabold text-foreground">
              {key}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {values.map((value) => {
                const isSelected = selectedByKey[key] === value;

                return (
                  <Pressable
                    key={`${key}-${value}`}
                    className={`rounded-full border px-3 py-2 ${
                      isSelected ? "border-primary bg-primary" : "border-border bg-secondary"
                    }`}
                    onPress={() => selectValue(key, value)}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        isSelected ? "text-primary-foreground" : "text-secondary-foreground"
                      }`}
                    >
                      {value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <QuestionSubmitButton
        canSubmit={canSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={() => onSubmit(selectedByKey)}
      />
    </View>
  );
}
