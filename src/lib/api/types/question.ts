export enum QuestionType {
  Users = "users",
  Custom = "custom",
  Image = "image",
  Text = "text",
  Rating = "rating",
  Pairing = "pairing",
}

export enum PairingKeySource {
  Members = "members",
  Custom = "custom",
}

export enum PairingMode {
  Exclusive = "exclusive", // 1:1 — each value used at most once
  Open = "open", // many:1 — values can repeat
}

// `keys` are the left-hand items ("Match these"), `values` the right-hand
// choices ("With these"). A vote is a Record<key, value>. The model assumes
// unique key/value strings — the response Record can't represent duplicates.
export interface PairingConfig {
  keySource: PairingKeySource;
  mode: PairingMode;
  keys?: string[];
  values: string[];
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

// GET /api/groups/:groupId/question/:questionId — the raw question document with
// a signed `imageUrl` and resolved image `options`. Does NOT carry the per-user
// vote state; that's only computed for the active-questions list.
export interface QuestionDTO {
  _id: string;
  groupId: string;
  category: string;
  questionType: QuestionType;
  question: string;
  image?: string;
  imageUrl?: string;
  multiSelect: boolean;
  options?: QuestionOptionDTO[];
  pairing?: PairingConfig;
  answers: QuestionAnswerDTO[];
  rating: QuestionRatingDTO;
  used: boolean;
  active: boolean;
  usedAt?: string;
  submittedBy?: string | null;
  templateId?: string;
  chat?: string;
  createdAt: string;
}

export interface QuestionWithUserStateDTO extends QuestionDTO {
  userHasVoted: boolean;
  userRating: UserRating;
}

export interface ActiveQuestionsResponseDTO {
  questions: QuestionWithUserStateDTO[];
  completionPercentage: number;
}

export type VoteResponseValue = string[] | Record<string, string>;

export interface QuestionResultUserDTO {
  userId: string;
  username: string;
  avatarUrl?: string;
}

export interface QuestionResultDTO {
  option: string;
  count: number;
  percentage: number;
  users: QuestionResultUserDTO[];
}

// Pairing aggregates per key instead of per option: each key carries the
// distribution of values it was matched with (sorted by count desc).
export interface PairingValueCountDTO {
  value: string;
  count: number;
  percentage: number;
  users: QuestionResultUserDTO[];
}

export interface PairingResultDTO {
  key: string;
  valueCounts: PairingValueCountDTO[];
  topValue: string;
}

export interface QuestionResultsResponseDTO {
  results: QuestionResultDTO[];
  // Present (and `results` empty) only for pairing questions.
  pairingResults?: PairingResultDTO[];
  totalVotes: number;
  totalUsers: number;
  questionType: QuestionType;
  multiSelect: boolean;
}

// POST /api/groups/:groupId/question
// The `image` question *type* (image options) still isn't creatable on mobile;
// every other type — the text-option types and pairing — is supported, and any
// of them can carry an attached image.
export interface CreateQuestionInput {
  category: string;
  questionType: QuestionType;
  question: string;
  submittedBy: string;
  multiSelect: boolean;
  // S3 key of an attached image, uploaded before the question is created.
  image?: string;
  // Sent only for `custom`; the backend fills options for `users`/`rating`.
  options?: string[];
  // Sent only for `pairing`.
  pairing?: PairingConfig;
}

// GET /api/groups/:groupId/history — the endpoint returns full question docs,
// but the history list only reads these fields. Typed narrow on purpose.
export interface HistoryQuestionDTO {
  _id: string;
  groupId: string;
  question: string;
  questionType: QuestionType;
  submittedBy?: string | null;
  usedAt?: string;
  createdAt: string;
}

export interface GroupHistoryResponseDTO {
  questions: HistoryQuestionDTO[];
}
