// Mirrors the web repo's rally routes under /api/groups/:groupId/rally.
// Hand-maintained on purpose: the backend's `ToDTO<IRally>` is derived from the
// mongoose model, so these narrower, serialization-correct shapes are the actual
// API contract.

export enum RallyStatus {
  Created = "created",
  Scheduled = "scheduled",
  Submission = "submission",
  Voting = "voting",
  Results = "results",
  Completed = "completed",
}

export interface RallyVoteDTO {
  user: string;
  time: string;
}

export interface RallySubmissionDTO {
  _id: string;
  userId: string;
  username: string;
  votes: RallyVoteDTO[];
}

// GET /api/groups/:groupId/rally — only submission/voting/results rallies. The
// server sends the raw document, so `submissions` carry S3 keys rather than URLs
// and there are no per-user flags: "did I vote / submit" is derived client-side
// from `userId` and `votes[].user` (see deriveUserState).
export interface RallyDTO {
  _id: string;
  groupId: string;
  task: string;
  status: RallyStatus;
  submissions: RallySubmissionDTO[];
  lengthInDays: number;
  // The *nominal* submission window, not enforced deadlines. Null until the
  // rally is scheduled. Only ever rendered as a coarse "about N days" — see
  // deriveSubmissionWindow in rally-utils.ts for why never a countdown.
  startTime: string | null;
  submissionEnd: string | null;
  createdBy: string;
  chat?: string;
  createdAt: string;
  updatedAt: string;
}

// `votingEnd` / `resultsEnd` stay omitted: unlike the submission window they're
// set at transition time, so how long they last depends on when the cron fired.
// Those phases show a label and nothing else. See docs/migration-decisions.md.

export interface RallyListResponseDTO {
  rallies: RallyDTO[];
  message?: string;
}

// GET /api/groups/:groupId/rally/:rallyId/submissions — same submissions, but
// with a signed `imageUrl` (1h) and the submitter's avatar, sorted by vote count
// descending.
export interface RallySubmissionWithUrlDTO extends RallySubmissionDTO {
  imageUrl: string;
  avatarUrl?: string;
}

export interface RallySubmissionsResponseDTO {
  submissions: RallySubmissionWithUrlDTO[];
}

// POST /api/groups/:groupId/rally — the creator picks how long submissions stay
// open. Presets only (see RALLY_LENGTH_OPTIONS); the backend accepts 1–365.
export interface CreateRallyInput {
  task: string;
  lengthInDays: number;
}

// The cron advances phases once a day, so a rally overruns its length by up to
// 24h. Short rallies are worst hit proportionally (a 1-day rally can run twice
// its length), so the floor is 3 days.
export const RALLY_LENGTH_OPTIONS = [3, 5, 7, 10, 14] as const;
export const DEFAULT_RALLY_LENGTH_DAYS = 7;
export const MAX_RALLY_TASK_LENGTH = 300;
