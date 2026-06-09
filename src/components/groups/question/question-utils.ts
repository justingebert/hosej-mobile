import type { QuestionOptionDTO, QuestionWithUserStateDTO } from "@/lib/api/types/question";
import type { FlatQuestionItem } from "./types";

export function buildFlatQuestionList(
  questions: QuestionWithUserStateDTO[]
): FlatQuestionItem[] {
  const grouped: Record<string, QuestionWithUserStateDTO[]> = {};

  for (const question of questions) {
    const category = getDisplayCategory(question);
    grouped[category] = [...(grouped[category] ?? []), question];
  }

  return Object.keys(grouped)
    .sort((a, b) => {
      if (a === "Custom") return -1;
      if (b === "Custom") return 1;
      return a.localeCompare(b);
    })
    .flatMap((category) =>
      grouped[category].map((question, index) => ({
        question,
        label:
          grouped[category].length === 1
            ? category
            : `${category} ${index + 1}`,
      }))
    );
}

export function optionKey(option: QuestionOptionDTO) {
  return typeof option === "string" ? option : option.key;
}

function getDisplayCategory(
  question: Pick<QuestionWithUserStateDTO, "submittedBy" | "category">
) {
  if (question.submittedBy) return "Custom";
  return question.category || "Daily";
}
