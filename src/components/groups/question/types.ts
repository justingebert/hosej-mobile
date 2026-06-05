import type {
  QuestionWithUserStateDTO,
  VoteResponseValue,
} from "@/lib/api/types/question";

export type FlatQuestionItem = {
  question: QuestionWithUserStateDTO;
  label: string;
};

export type QuestionVoteHandler = (
  questionId: string,
  response: VoteResponseValue
) => void;

export type QuestionResponseSubmitHandler = (response: VoteResponseValue) => void;
