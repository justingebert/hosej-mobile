import { QuestionType } from "@/lib/api/types/question";
import { OptionQuestionScreen } from "./question-option-screen";
import { TextQuestionScreen } from "./question-text-screen";
import type { QuestionInputProps } from "./types";

export function QuestionOptions(props: QuestionInputProps) {
  switch (props.question.questionType) {
    case QuestionType.Text:
      return <TextQuestionScreen {...props} />;
    default: // users | custom | rating | image
      return (
        <OptionQuestionScreen
          {...props}
          isImage={props.question.questionType === QuestionType.Image}
        />
      );
  }
}
