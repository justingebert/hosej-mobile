import { useCallback } from "react";
import { Alert } from "react-native";
import { useReportContent, type ReportInput } from "@/lib/api/reports";
import { toastSuccess } from "@/lib/toast";

/**
 * Confirm-then-report, behind a long-press or a "⋯" on someone else's content.
 * Confirmed rather than immediate: reporting a friend by fat finger is the kind
 * of mistake there's no undo for.
 *
 * `noun` is what's being reported, in the prompt: "message", "photo", "member".
 */
export function useReportAction() {
  const report = useReportContent();

  return useCallback(
    (noun: string, target: ReportInput) => {
      Alert.alert(
        `Report this ${noun}?`,
        "We review reports and will remove anything that breaks our rules.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Report",
            style: "destructive",
            onPress: () =>
              report.mutate(target, {
                onSuccess: () =>
                  toastSuccess("Report sent", "Thanks we will review reports."),
              }),
          },
        ]
      );
    },
    [report]
  );
}
