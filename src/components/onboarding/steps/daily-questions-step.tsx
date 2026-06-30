import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { StepHeader } from "../step-header";

const QUESTION = "Best pizza topping?";
const OPTIONS = ["Pineapple", "Mushrooms", "Pepperoni", "Margherita"];
const RESULTS = [
  { option: "Pineapple", pct: 45 },
  { option: "Mushrooms", pct: 20 },
  { option: "Pepperoni", pct: 15 },
  { option: "Margherita", pct: 20 },
];

export function DailyQuestionsStep() {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <View className="gap-4 py-2">
      <View className="gap-1">
        <StepHeader
          title="Daily Questions"
          subtitle="Every day your group gets questions to vote on."
        />
        <Text className="text-sm">Tap an option to try it.</Text>
      </View>

      <View className="gap-4 rounded-2xl bg-secondary/30 p-4">
        <Text className="text-center font-semibold">{QUESTION}</Text>

        {submitted ? (
          <View className="gap-2">
            {RESULTS.map((r) => (
              <ResultBar key={r.option} option={r.option} pct={r.pct} />
            ))}
          </View>
        ) : (
          <View className="gap-3">
            <View className="flex-row flex-wrap gap-2">
              {OPTIONS.map((option) => (
                <Button
                  key={option}
                  variant={selected === option ? "default" : "secondary"}
                  className="grow basis-[47%]"
                  onPress={() => setSelected(option)}
                >
                  <Text>{option}</Text>
                </Button>
              ))}
            </View>
            <Button disabled={!selected} onPress={() => setSubmitted(true)}>
              <Text>Submit Vote</Text>
            </Button>
          </View>
        )}
      </View>

      {submitted ? (
        <Text className="text-center text-xs text-muted-foreground">
          See how your group voted, in real time.
        </Text>
      ) : null}
    </View>
  );
}

function ResultBar({ option, pct }: { option: string; pct: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(pct, { duration: 600, easing: Easing.inOut(Easing.ease) });
  }, [pct, progress]);
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value}%` }));

  return (
    <View className="flex-row items-center gap-2">
      <Text className="w-20 text-xs" numberOfLines={1}>
        {option}
      </Text>
      <View className="h-6 flex-1 overflow-hidden rounded-full bg-secondary">
        <Animated.View
          className="h-full items-end justify-center rounded-full bg-primary pr-2"
          style={barStyle}
        >
          <Text className="text-[10px] font-bold text-primary-foreground">{pct}%</Text>
        </Animated.View>
      </View>
    </View>
  );
}
