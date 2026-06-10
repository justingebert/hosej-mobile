import { useLocalSearchParams } from "expo-router";
import { useGroupId } from "@/lib/group-id";
import { View } from "react-native";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useQuestionResults } from "@/lib/api/questions";
import {
  QuestionType,
  type QuestionResultDTO,
  type QuestionResultUserDTO,
} from "@/lib/api/types/question";
import { StyledImage } from "./styled-image";

export function QuestionResultsDetailScreen() {
  const groupId = useGroupId();
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  const { data, error, isError, isPending, isRefetching, refetch } = useQuestionResults(
    groupId,
    questionId
  );

  const results = data?.results ?? [];
  const isImage = data?.questionType === QuestionType.Image;

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      {isPending ? (
        <ResultsDetailSkeleton />
      ) : isError ? (
        <ErrorCard
          title="Could not load detailed results"
          error={error}
          onRetry={refetch}
          isRetrying={isRefetching}
        />
      ) : results.length === 0 ? (
        <EmptyState title="No results yet" />
      ) : (
        <View className="gap-3">
          {results.map((result, index) => (
            <ResultDetailCard
              key={`${result.option}-${index}`}
              isImage={isImage}
              result={result}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function ResultDetailCard({
  isImage,
  result,
}: {
  isImage: boolean;
  result: QuestionResultDTO;
}) {
  const voteLabel = result.count === 1 ? "vote" : "votes";

  return (
    <View className="items-center justify-center gap-3 rounded-xl border border-border bg-card p-4">
      <View className="w-full items-center gap-1.5">
        {isImage ? (
          <StyledImage uri={result.option} className="h-32 w-full rounded-lg" />
        ) : (
          <Text selectable className="text-center text-lg font-black text-card-foreground">
            {result.option}
          </Text>
        )}

        <Text className="text-center text-sm text-muted-foreground">
          {result.count} {voteLabel} ({result.percentage}%)
        </Text>
      </View>

      {result.users.length > 0 ? (
        <View className="w-full flex-row flex-wrap justify-center gap-2">
          {result.users.map((user, index) => (
            <ResultUserChip key={`${user.username}-${index}`} user={user} />
          ))}
        </View>
      ) : (
        <Text className="text-center text-sm text-muted-foreground">No votes</Text>
      )}
    </View>
  );
}

function ResultUserChip({ user }: { user: QuestionResultUserDTO }) {
  const displayName = user.username || "Unknown";
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <View className="max-w-44 flex-row items-center gap-2 rounded-full border border-border bg-primary px-2 py-1.5">
      <Avatar alt={`${displayName} avatar`} className="h-6 w-6">
        {user.avatarUrl ? <AvatarImage source={{ uri: user.avatarUrl }} /> : null}
        <AvatarFallback>
          <Text className="text-[10px] font-extrabold text-foreground">{initial}</Text>
        </AvatarFallback>
      </Avatar>
      <Text numberOfLines={1} className="max-w-32 text-sm font-semibold text-secondary">
        {displayName}
      </Text>
    </View>
  );
}

function ResultsDetailSkeleton() {
  return (
    <View className="gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} className="gap-3 rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-24" />
          <View className="flex-row gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </View>
        </View>
      ))}
    </View>
  );
}
