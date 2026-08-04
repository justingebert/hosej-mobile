import type { RallyDTO, RallySubmissionWithUrlDTO } from "@/lib/api/types/rally";

export const MEDALS = ["🥇", "🥈", "🥉"];

/** Below this, "winner + the rest" reads as a duel rather than a podium. */
const MIN_SUBMISSIONS_FOR_PODIUM = 3;

/**
 * The rally list carries no per-user flags — the server sends the raw document —
 * so participation is derived from the submissions themselves.
 */
export function deriveUserState(rally: RallyDTO | undefined, userId: string | undefined) {
  if (!rally || !userId) return { hasSubmitted: false, hasVoted: false };
  return {
    hasSubmitted: rally.submissions.some((submission) => submission.userId === userId),
    hasVoted: rally.submissions.some((submission) =>
      submission.votes.some((vote) => vote.user === userId)
    ),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Never a full bar: submissions are still accepted during the cron overrun. */
const MAX_PROGRESS = 0.97;

/**
 * Coarse, deliberately imprecise readout of the submission window.
 *
 * `submissionEnd` is not a deadline the backend enforces. It's fixed when the
 * rally is *scheduled* and never recomputed at activation, so cron lag eats
 * into the window; and submissions only close the next time the daily cron
 * runs, so the phase overruns by up to 24h — during which `addSubmission` still
 * accepts entries, because it gates on status rather than time.
 *
 * A ticking clock would therefore hit zero while the rally is wide open and
 * tell people they'd missed something they hadn't. So: whole days only, and
 * under a day (or past the nominal end) it reads "Closing soon" and stays there
 * for as long as the rally is open. See docs/migration-decisions.md.
 */
export function deriveSubmissionWindow(
  rally: RallyDTO,
  now: number = Date.now()
): { progress: number; label: string } | null {
  if (!rally.startTime || !rally.submissionEnd) return null;

  const start = new Date(rally.startTime).getTime();
  const end = new Date(rally.submissionEnd).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;

  const progress = Math.min(Math.max((now - start) / (end - start), 0), MAX_PROGRESS);
  const remaining = end - now;

  if (remaining < DAY_MS) return { progress, label: "Closing soon" };

  const days = Math.floor(remaining / DAY_MS);
  return { progress, label: `About ${days} ${days === 1 ? "day" : "days"} left to submit` };
}

export type RankedSubmission = RallySubmissionWithUrlDTO & { rank: number };

/**
 * Standard competition ranking (1, 2, 2, 4) over the server's vote-descending
 * order. Ties are common at group size — five friends can easily split 2/2/1 —
 * so equal vote counts share a rank rather than being ordered arbitrarily by
 * whatever Mongo returned first.
 */
export function rankSubmissions(
  submissions: RallySubmissionWithUrlDTO[]
): RankedSubmission[] {
  let previousVotes: number | null = null;
  let previousRank = 0;

  return submissions.map((submission, index) => {
    const votes = submission.votes.length;
    const rank = votes === previousVotes ? previousRank : index + 1;
    previousVotes = votes;
    previousRank = rank;
    return { ...submission, rank };
  });
}

/**
 * The winner only gets the featured treatment when there's a real podium and an
 * outright first place — a tie for first falls back to the flat list, where both
 * entries show the same medal.
 */
export function findFeaturedWinner(ranked: RankedSubmission[]): RankedSubmission | null {
  if (ranked.length < MIN_SUBMISSIONS_FOR_PODIUM) return null;
  const firstPlace = ranked.filter((submission) => submission.rank === 1);
  if (firstPlace.length !== 1) return null;
  // Nobody voted — there's no winner to celebrate, just photos.
  if (firstPlace[0].votes.length === 0) return null;
  return firstPlace[0];
}

/** Share of the total vote, for the fill bar behind each result row. */
export function votePercentage(votes: number, totalVotes: number): number {
  if (totalVotes <= 0) return 0;
  return Math.round((votes / totalVotes) * 100);
}
