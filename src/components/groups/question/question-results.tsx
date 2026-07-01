import { useEffect, useState } from "react";
import { Link, type Href } from "expo-router";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useQuestionResults } from "@/lib/api/questions";
import { cn } from "@/lib/utils";
import { StyledImage } from "./styled-image";
import {
  QuestionType,
  type PairingResultDTO,
  type QuestionResultDTO,
} from "@/lib/api/types/question";
import { ChevronRight } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";

// Both the bar fill and the count-up run over this window so they stay in step.
const RESULT_FILL_MS = 800;

// One-shot count-up (0 → value), easing in/out over RESULT_FILL_MS. Local helper
// — re-renders only the tiny percent label; the bar fill itself runs on the UI
// thread via Reanimated.
function useCountUp(value: number) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / RESULT_FILL_MS);
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return display;
}

export function QuestionResults({
  groupId,
  questionId,
}: {
  groupId: string;
  questionId: string;
}) {
  const { data, isError, isPending, refetch } = useQuestionResults(groupId, questionId);

  if (isPending) {
    return <ResultsBarsSkeleton />;
  }

  if (isError) {
    // Tier-2 embedded region: inline retry button, not a full ErrorCard — the
    // question header above is still valid.
    return (
      <Button variant="link" size="sm" onPress={() => refetch()} className="self-start">
        <Text>Couldn’t load results · Try again</Text>
      </Button>
    );
  }

  const detailsHref =
    `/groups/${groupId}/question/${questionId}/resultsdetailed` as Href;

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-center">
        <Text className="text-sm font-bold text-muted-foreground">
          {data.totalVotes} of {data.totalUsers} voted
        </Text>
      </View>

      {data.questionType === QuestionType.Pairing ? (
        <PairingSummary
          detailsHref={detailsHref}
          results={data.pairingResults ?? []}
        />
      ) : (
        <ResultBars
          detailsHref={detailsHref}
          isImage={data.questionType === QuestionType.Image}
          results={data.results}
        />
      )}
    </View>
  );
}

// Pairing summary: one row per key showing its leading value(s). Ties surface up
// to two winners, then a "+N" overflow badge; the whole row drills into the
// detailed per-key breakdown.
function PairingSummary({
  detailsHref,
  results,
}: {
  detailsHref: Href;
  results: PairingResultDTO[];
}) {
  return (
    <View className="gap-3">
      {results.map((result) => (
        <PairingSummaryRow
          detailsHref={detailsHref}
          key={result.key}
          result={result}
        />
      ))}
    </View>
  );
}

function PairingSummaryRow({
  detailsHref,
  result,
}: {
  detailsHref: Href;
  result: PairingResultDTO;
}) {
  const topCount = result.valueCounts[0]?.count ?? 0;
  const topValues = result.valueCounts.filter((vc) => vc.count === topCount);
  const visible = topValues.slice(0, 2);
  const overflow = topValues.length - visible.length;

  return (
    <Link href={detailsHref} push asChild>
      <Pressable className="min-h-14 flex-row items-center gap-2 rounded-xl bg-secondary p-3">
        <Text
          numberOfLines={1}
          className="shrink-0 basis-1/3 text-sm font-bold text-secondary-foreground"
        >
          {result.key}
        </Text>
        <View className="flex-1 flex-row flex-wrap items-center justify-end gap-1">
          {topValues.length === 0 ? (
            <ValueBadge label="—" muted />
          ) : (
            <>
              {visible.map((vc) => (
                <ValueBadge key={vc.value} label={vc.value} />
              ))}
              {overflow > 0 ? <ValueBadge label={`+${overflow}`} muted /> : null}
            </>
          )}
        </View>
        <Icon as={ChevronRight} className="size-5 shrink-0 text-muted-foreground" />
      </Pressable>
    </Link>
  );
}

function ValueBadge({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <View
      className={cn(
        "max-w-full rounded-full px-2.5 py-1",
        muted ? "bg-background" : "bg-primary"
      )}
    >
      <Text
        numberOfLines={1}
        className={cn(
          "text-xs font-semibold",
          muted ? "text-muted-foreground" : "text-primary-foreground"
        )}
      >
        {label}
      </Text>
    </View>
  );
}

function ResultBars({
  detailsHref,
  isImage,
  results,
}: {
  detailsHref: Href;
  isImage: boolean;
  results: QuestionResultDTO[];
}) {
  return (
    <View className="gap-3">
      {results.map((result, index) => (
        <ResultRow
          detailsHref={detailsHref}
          key={`${result.option}-${index}`}
          isImage={isImage}
          result={result}
        />
      ))}
    </View>
  );
}

function ResultRow({
  detailsHref,
  isImage,
  result,
}: {
  detailsHref: Href;
  isImage: boolean;
  result: QuestionResultDTO;
}) {
  const target = Math.max(0, Math.min(100, result.percentage));
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(target, {
      duration: RESULT_FILL_MS,
      easing: Easing.inOut(Easing.ease),
    });
  }, [target, progress]);
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value}%` }));
  const percent = useCountUp(result.percentage);

  return (
    <Link href={detailsHref} push asChild>
      <Pressable className="overflow-hidden rounded-xl bg-secondary">
        <Animated.View
          className="absolute bottom-0 left-0 top-0 bg-primary/10"
          style={barStyle}
        />
        <View className="min-h-14 flex-row items-center gap-3 p-2">
          {isImage && (
            <StyledImage uri={result.option} className="h-12 w-12 rounded-md" />
          )}
          {!isImage && (
            <Text selectable numberOfLines={2} className="flex-1 text-sm text-secondary-foreground ml-2">
              {result.option}
            </Text>
          )}
          {isImage && <View className="flex-1" />}
          <Text className="text-sm font-extrabold text-secondary-foreground">
            {percent}%
          </Text>
          <Icon as={ChevronRight} className="size-5" />
        </View>
      </Pressable>
    </Link>
  );
}

function ResultsBarsSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton className="h-4 w-28 self-center rounded-full" />
      <View className="gap-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </View>
    </View>
  );
}
