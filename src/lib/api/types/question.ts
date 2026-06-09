export enum QuestionType {
  Users = "users",
  Custom = "custom",
  Image = "image",
  Text = "text",
  Rating = "rating",
}

export interface QuestionAnswerDTO {
  user: string;
  response: string | string[] | Record<string, string>;
  time: string;
}

export interface QuestionRatingDTO {
  good: string[];
  ok: string[];
  bad: string[];
}

export type UserRating = "good" | "ok" | "bad" | null;

export type SignedUrlDTO = {
  key: string;
  url: string;
};

export type QuestionOptionDTO = string | SignedUrlDTO;

export interface QuestionWithUserStateDTO {
  _id: string;
  groupId: string;
  category: string;
  questionType: QuestionType;
  question: string;
  image?: string;
  imageUrl?: string;
  multiSelect: boolean;
  options?: QuestionOptionDTO[];
  answers: QuestionAnswerDTO[];
  rating: QuestionRatingDTO;
  used: boolean;
  active: boolean;
  usedAt?: string;
  submittedBy?: string | null;
  templateId?: string;
  chat?: string;
  createdAt: string;
  userHasVoted: boolean;
  userRating: UserRating;
}

export interface ActiveQuestionsResponseDTO {
  questions: QuestionWithUserStateDTO[];
  completionPercentage: number;
}

export type VoteResponseValue = string[] | Record<string, string>;

export interface QuestionResultUserDTO {
  username: string;
  avatarUrl?: string;
}

export interface QuestionResultDTO {
  option: string;
  count: number;
  percentage: number;
  users: QuestionResultUserDTO[];
}

export interface QuestionResultsResponseDTO {
  results: QuestionResultDTO[];
  totalVotes: number;
  totalUsers: number;
  questionType: QuestionType;
  multiSelect: boolean;
}

// POST /api/groups/:groupId/question
// The mobile create flow only handles the option-free / text-option types.
// `pairing` and `image` questions are not supported yet (image needs an
// upload pipeline; pairing needs the nested config UI).
export interface CreateQuestionInput {
  category: string;
  questionType: QuestionType;
  question: string;
  submittedBy: string;
  multiSelect: boolean;
  // Sent only for `custom`; the backend fills options for `users`/`rating`.
  options?: string[];
}
