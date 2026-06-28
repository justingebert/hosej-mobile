import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { useGroupId } from "@/lib/group-id";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuestion } from "@/lib/api/questions";
import { QuestionHeader } from "./question-header";
import { QuestionRatingBadges } from "./question-rating-badges";
import { QuestionOptionsList } from "./question-options-list";
import { QuestionResults } from "./question-results";
import { QuestionChatMessages } from "./question-chat";

// Standalone results page for a single question: the prompt, its rating, its
// options, and the aggregated vote bars (which drill into the detailed view).
export function QuestionResultsScreen() {
  const groupId = useGroupId();
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  const { data: question, error, isError, isPending, isRefetching, refetch } =
    useQuestion(groupId, questionId);

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      {isPending ? (
        <QuestionResultsSkeleton />
      ) : isError ? (
        <ErrorCard
          title="Could not load question"
          error={error}
          onRetry={refetch}
          isRetrying={isRefetching}
        />
      ) : (
        <View className="gap-6">
          <QuestionHeader
            question={question.question}
            imageUrl={question.imageUrl}
            imageCacheKey={question.image}
          />

          <QuestionRatingBadges rating={question.rating} />

          {question.options && question.options.length > 0 ? (
            <QuestionOptionsList
              options={question.options}
              questionType={question.questionType}
            />
          ) : null}

          <QuestionResults groupId={groupId} questionId={questionId} />

          {question.chat ? (
            <QuestionChatMessages groupId={groupId} chatId={question.chat} />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function QuestionResultsSkeleton() {
  return (
    <View className="gap-6">
      <Skeleton className="h-24 w-full rounded-xl" />
      <View className="flex-row justify-around">
        <Skeleton className="h-9 w-16 rounded-full" />
        <Skeleton className="h-9 w-16 rounded-full" />
        <Skeleton className="h-9 w-16 rounded-full" />
      </View>
      <View className="gap-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </View>
    </View>
  );
}
