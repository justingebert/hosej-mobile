import { Image } from "expo-image";
import { ActivityIndicator, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useQuestionResults } from "@/lib/api/questions";
import { ErrorCard } from "@/components/ui/error-card";
import {
  QuestionType,
  type PairingResultDTO,
  type QuestionResultDTO,
  type QuestionWithUserStateDTO,
} from "@/lib/api/types/question";

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

  if (!data) return null;

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-extrabold text-foreground">Results</Text>
        <Text className="text-sm font-bold text-muted-foreground">
          {data.totalVotes} of {data.totalUsers} voted
        </Text>
      </View>

      {data.totalVotes === 0 ? (
        <Text className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
          No votes yet.
        </Text>
      ) : data.questionType === QuestionType.Pairing ? (
        <PairingResults results={data.pairingResults ?? []} />
      ) : (
        <StandardResults
          isImage={data.questionType === QuestionType.Image}
          results={data.results}
        />
      )}
    </View>
  );
}

function StandardResults({
  isImage,
  results,
}: {
  isImage: boolean;
  results: QuestionResultDTO[];
}) {
  if (results.length === 0) {
    return (
      <Text className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
        No result rows yet.
      </Text>
    );
  }

  return (
    <View className="gap-3">
      {results.map((result, index) => (
        <ResultRow
          key={`${result.option}-${index}`}
          isImage={isImage}
          result={result}
        />
      ))}
    </View>
  );
}

function ResultRow({
  isImage,
  result,
}: {
  isImage: boolean;
  result: QuestionResultDTO;
}) {
  const width = `${Math.max(0, Math.min(100, result.percentage))}%` as `${number}%`;

  return (
    <View className="overflow-hidden rounded-xl bg-secondary">
      <View className="absolute bottom-0 left-0 top-0 bg-primary/10" style={{ width }} />
      <View className="min-h-14 flex-row items-center gap-3 p-3">
        {isImage && (
          <Image
            source={{ uri: result.option }}
            className="h-10 w-10 rounded-lg bg-muted"
            contentFit="cover"
          />
        )}
        {!isImage && (
          <Text selectable numberOfLines={2} className="flex-1 text-sm text-secondary-foreground">
            {result.option}
          </Text>
        )}
        {isImage && <View className="flex-1" />}
        <Text className="text-sm font-extrabold text-secondary-foreground">
          {result.percentage}%
        </Text>
        <Text className="text-xs font-bold text-muted-foreground">
          {result.count}
        </Text>
      </View>
    </View>
  );
}

function PairingResults({ results }: { results: PairingResultDTO[] }) {
  if (results.length === 0) {
    return (
      <Text className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
        No pairing results yet.
      </Text>
    );
  }

  return (
    <View className="gap-3">
      {results.map((result) => {
        const topCount = result.valueCounts[0]?.count ?? 0;
        const topValues = result.valueCounts
          .filter((valueResult) => valueResult.count === topCount && topCount > 0)
          .slice(0, 2);

        return (
          <View
            key={result.key}
            className="gap-2 rounded-xl bg-secondary p-3"
            style={{ borderCurve: "continuous" }}
          >
            <Text selectable className="text-sm font-extrabold text-secondary-foreground">
              {result.key}
            </Text>
            {topValues.length === 0 ? (
              <Text className="text-sm text-muted-foreground">No match yet.</Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {topValues.map((valueResult) => (
                  <Text
                    key={valueResult.value}
                    selectable
                    className="rounded-full bg-background px-3 py-1 text-sm font-bold text-foreground"
                  >
                    {valueResult.value} · {valueResult.percentage}%
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
