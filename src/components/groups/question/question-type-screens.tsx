import {
  QuestionType,
  type QuestionWithUserStateDTO,
} from "@/lib/api/types/question";
import {
  OptionQuestionScreen,
  type OptionQuestionScreenProps,
} from "./question-option-screen";
import { PairingQuestionScreen } from "./question-pairing-screen";
import { TextQuestionScreen } from "./question-text-screen";
import type { QuestionResponseSubmitHandler } from "./types";

export function QuestionTypeScreen({
  question,
  isSubmitting,
  submitError,
  onSubmit,
}: {
  question: QuestionWithUserStateDTO;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: QuestionResponseSubmitHandler;
}) {
  switch (question.questionType) {
    case QuestionType.Text:
      return (
        <TextQuestionScreen
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={onSubmit}
        />
      );
    case QuestionType.Custom:
      return <CustomQuestionScreen {...optionProps()} />;
    case QuestionType.Users:
      return <UsersQuestionScreen {...optionProps()} />;
    case QuestionType.Rating:
      return <RatingQuestionScreen {...optionProps()} />;
    case QuestionType.Image:
      return <ImageQuestionScreen {...optionProps()} />;
    case QuestionType.Pairing:
      return (
        <PairingQuestionScreen
          question={question}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={onSubmit}
        />
      );
  }

  function optionProps(): OptionQuestionScreenProps {
    return {
      question,
      isSubmitting,
      submitError,
      onSubmit,
    };
  }
}

function CustomQuestionScreen(props: OptionQuestionScreenProps) {
  return <OptionQuestionScreen {...props} />;
}

function UsersQuestionScreen(props: OptionQuestionScreenProps) {
  return <OptionQuestionScreen {...props} />;
}

function RatingQuestionScreen(props: OptionQuestionScreenProps) {
  return <OptionQuestionScreen {...props} />;
}

function ImageQuestionScreen(props: OptionQuestionScreenProps) {
  return <OptionQuestionScreen {...props} isImage />;
}
