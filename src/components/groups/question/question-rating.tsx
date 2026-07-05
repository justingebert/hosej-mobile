import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Sheet, type SheetHandle } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { useRateQuestion } from "@/lib/api/questions";
import type { QuestionWithUserStateDTO, UserRating } from "@/lib/api/types/question";

type RateValue = Exclude<UserRating, null>;

const RATINGS: { value: RateValue; emoji: string }[] = [
  { value: "bad", emoji: "👎" },
  { value: "ok", emoji: "👌" },
  { value: "good", emoji: "👍" },
];

export type QuestionRatingHandle = { present: () => void };

// Post-vote meta-rating of the question itself, in a bottom sheet only. Auto-opens
// once right after voting (`autoOpen`); otherwise opened via `present()` (the
// tappable prompt card). Rating-only by design — options live in the results bars
// / detailed page, not here (bundling them in was the confusing pattern we replaced).
export const QuestionRating = forwardRef<
  QuestionRatingHandle,
  { question: QuestionWithUserStateDTO; autoOpen: boolean }
>(function QuestionRating({ question, autoOpen }, ref) {
  const sheetRef = useRef<SheetHandle>(null);
  const rate = useRateQuestion(question.groupId);

  const counts: Record<RateValue, number> = {
    bad: question.rating.bad?.length ?? 0,
    ok: question.rating.ok?.length ?? 0,
    good: question.rating.good?.length ?? 0,
  };

  useImperativeHandle(ref, () => ({ present: () => sheetRef.current?.present() }), []);

  // Present once when this question was just voted on, without re-popping on
  // every re-render (pull-to-refresh, optimistic cache writes).
  const presented = useRef(false);
  useEffect(() => {
    if (autoOpen && !presented.current) {
      presented.current = true;
      sheetRef.current?.present();
    }
  }, [autoOpen]);

  const onRate = (value: RateValue) => {
    if (question.userRating !== value) {
      rate.mutate({ questionId: question._id, rating: value });
    }
    // Brief pause so the highlight/count update is visible before the sheet closes.
    setTimeout(() => sheetRef.current?.dismiss(), 300);
  };

  return (
    <Sheet ref={sheetRef}>
      <Text variant="large" className="text-center">
        How was this question?
      </Text>

      <View className="flex-row gap-3">
        {RATINGS.map((r) => {
          const selected = question.userRating === r.value;
          return (
            <Button
              key={r.value}
              variant={selected ? "default" : "secondary"}
              className="h-20 flex-1 flex-col gap-1"
              onPress={() => onRate(r.value)}
            >
              <Text className="text-3xl">{r.emoji}</Text>
              <Text className="text-xs font-bold">{counts[r.value]}</Text>
            </Button>
          );
        })}
      </View>
    </Sheet>
  );
});
