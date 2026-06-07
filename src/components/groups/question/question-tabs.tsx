import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import type { FlatQuestionItem } from "./types";

export function QuestionTabs({
  activeQuestionId,
  questions,
  onSelect,
}: {
  activeQuestionId: string;
  questions: FlatQuestionItem[];
  onSelect: (questionId: string) => void;
}) {
  return (
    <Tabs value={activeQuestionId} onValueChange={onSelect}>
      <TabsList>
        {questions.map(({ question, label }) => (
          <TabsTrigger key={question._id} value={question._id} className="flex-1">
            <Text>
              {label}
            </Text>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
