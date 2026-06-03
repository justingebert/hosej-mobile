import {
  QuestionType,
  type QuestionOptionDTO,
  type QuestionWithUserStateDTO,
} from "@/lib/api/types/question";
import { FeaturePlaceholder } from "./question-placeholders";
import {
  OptionQuestionScreen,
  type OptionQuestionScreenProps,
} from "./question-option-screen";
import { TextQuestionScreen } from "./question-text-screen";

export function QuestionTypeScreen({
  question,
  textResponse,
  selectedResponses,
  isSubmitting,
  canSubmit,
  submitError,
  onTextChange,
  onToggleOption,
  onSubmit,
}: {
  question: QuestionWithUserStateDTO;
  textResponse: string;
  selectedResponses: string[];
  isSubmitting: boolean;
  canSubmit: boolean;
  submitError: string | null;
  onTextChange: (value: string) => void;
  onToggleOption: (option: QuestionOptionDTO) => void;
  onSubmit: () => void;
}) {
  switch (question.questionType) {
    case QuestionType.Text:
      return (
        <TextQuestionScreen
          value={textResponse}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          submitError={submitError}
          onChange={onTextChange}
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
      return <PairingQuestionScreen question={question} />;
  }

  function optionProps(): OptionQuestionScreenProps {
    return {
      question,
      selectedResponses,
      isSubmitting,
      canSubmit,
      submitError,
      onToggleOption,
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

function PairingQuestionScreen({
  question,
}: {
  question: QuestionWithUserStateDTO;
}) {
  return (
    <FeaturePlaceholder
      title="Pairing question"
      body={`Mobile matching controls are not built yet. ${question.pairing?.values.length ?? 0} values available.`}
    />
  );
}
