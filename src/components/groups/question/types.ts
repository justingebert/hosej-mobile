import type {
  QuestionWithUserStateDTO,
  VoteResponseValue,
} from "@/lib/api/types/question";

export type FlatQuestionItem = {
  question: QuestionWithUserStateDTO;
  label: string;
};

export type QuestionResponseChangeHandler = (response: VoteResponseValue | null) => void;

export type QuestionInputProps = {
  question: QuestionWithUserStateDTO;
  response: VoteResponseValue | null;
  onResponseChange: QuestionResponseChangeHandler;
};
