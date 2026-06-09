import { Link, type Href } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useQuestionResults } from "@/lib/api/questions";
import { ErrorCard } from "@/components/ui/error-card";
import { StyledImage } from "./styled-image";
import {
  QuestionType,
  type QuestionResultDTO,
  type QuestionWithUserStateDTO,
} from "@/lib/api/types/question";
import { ChevronRight } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";

export function QuestionResults({
  question,
}: {
  question: QuestionWithUserStateDTO;
}) {
  const { data, error, isError, isPending, isRefetching, refetch } = useQuestionResults(
    question.groupId,
    question._id
  );


  if (isPending) {
    return (
      <View className="min-h-32 items-center justify-center rounded-xl bg-secondary p-4">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <ErrorCard
        title="Could not load results"
        error={error}
        onRetry={refetch}
        isRetrying={isRefetching}
      />
    );
  }

  const detailsHref =
    `/groups/${question.groupId}/question/${question._id}/resultsdetailed` as Href;

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-center">
        <Text className="text-sm font-bold text-muted-foreground">
          {data.totalVotes} of {data.totalUsers} voted
        </Text>
      </View>

      <ResultBars
        detailsHref={detailsHref}
        isImage={data.questionType === QuestionType.Image}
        results={data.results}
      />
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
  const width = `${Math.max(0, Math.min(100, result.percentage))}%` as `${number}%`;

  return (
    <Link href={detailsHref} push asChild>
      <Pressable className="overflow-hidden rounded-xl bg-secondary">
        <View className="absolute bottom-0 left-0 top-0 bg-primary/10" style={{ width }} />
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
            {result.percentage}%
          </Text>
          <Icon as={ChevronRight} className="size-5" />
        </View>
      </Pressable>
    </Link>
  );
}
