import { useLocalSearchParams } from "expo-router";
import { QuestionResultsDetailScreen } from "@/components/groups/question/question-results-detail-screen";

export default function QuestionResultsDetailedRoute() {
  const { groupId, questionId } = useLocalSearchParams<{
    groupId: string;
    questionId: string;
  }>();

  return (
    <QuestionResultsDetailScreen
      groupId={groupId ?? ""}
      questionId={questionId ?? ""}
    />
  );
}
