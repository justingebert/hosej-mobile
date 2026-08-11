import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

export type ActivityFeature = "question" | "rally" | "jukebox";

export type MissedActivity = Record<ActivityFeature, number>;

export const activityKeys = {
  groups: ["activity", "groups"] as const,
  missed: (groupId: string) => ["activity", "missed", groupId] as const,
};

// How much unseen activity each of the user's groups has (0 when nothing is
// new). One request for the whole list — every group card reads this query.
export function useGroupsActivity() {
  return useQuery({
    queryKey: activityKeys.groups,
    queryFn: () => apiFetch<Record<string, number>>("/api/activity/groups"),
  });
}

export function useMissedActivity(groupId: string) {
  return useQuery({
    queryKey: activityKeys.missed(groupId),
    queryFn: () => apiFetch<MissedActivity>(`/api/groups/${groupId}/activity/missed`),
    enabled: !!groupId,
  });
}

/**
 * Marks a feature seen for the current user whenever its screen comes into
 * focus, clearing that feature's dot.
 *
 * Focus, not mount: expo-router keeps screens mounted in the stack, so a
 * mount-only effect (what the web does) would fire once and then never again
 * when the user navigates back to the screen.
 */
export function useMarkFeatureSeen(groupId: string, feature: ActivityFeature) {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: () =>
      apiFetch<unknown>(`/api/groups/${groupId}/activity/seen`, {
        method: "POST",
        body: JSON.stringify({ feature }),
      }),
    // Clearing a badge is ambient bookkeeping the user never asked for — a
    // failure must not raise a toast. The dot simply stays until the next visit.
    meta: { suppressErrorToast: true },
    // Drop the dot immediately on arrival rather than waiting for the round
    // trip, so it never lingers on the screen the user is already looking at.
    onMutate: () => {
      queryClient.setQueryData<MissedActivity>(activityKeys.missed(groupId), (prev) =>
        prev ? { ...prev, [feature]: 0 } : prev,
      );
    },
    // The group-list flag is derived server-side from all three features, so it
    // has to be re-read rather than patched locally.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.groups });
      queryClient.invalidateQueries({ queryKey: activityKeys.missed(groupId) });
    },
  });

  useFocusEffect(
    useCallback(() => {
      if (groupId) mutate();
    }, [groupId, mutate]),
  );
}
