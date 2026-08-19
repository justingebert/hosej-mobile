import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "./client";

// Mirrors the server's ReportTargetType.
export type ReportTargetType = "message" | "rallySubmission" | "user";

export type ReportInput = {
  targetType: ReportTargetType;
  /** Locator for the reported thing — see the server's IReport.targetId. */
  targetId: string;
  reportedUser?: string;
  groupId?: string;
  /** Snapshot of what was reported, so triage doesn't have to go find it. */
  content?: string;
};

/**
 * File a content report. Write-only from the app's side: reports go to a
 * moderation inbox a human reads, and re-reporting the same thing is a
 * server-side no-op, so there's nothing to invalidate or read back.
 */
export function useReportContent() {
  return useMutation({
    mutationFn: (input: ReportInput) =>
      apiFetch("/api/reports", { method: "POST", body: JSON.stringify(input) }),
    meta: { errorToastTitle: "Could not send report" },
  });
}
