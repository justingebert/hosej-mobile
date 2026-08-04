import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import { uploadImage, type PickedImage } from "./upload";
import { haptics } from "@/lib/haptics";
import type {
  CreateRallyInput,
  RallyDTO,
  RallyListResponseDTO,
  RallySubmissionsResponseDTO,
  RallySubmissionWithUrlDTO,
} from "./types/rally";

export const rallyKeys = {
  all: ["rallies"] as const,
  active: (groupId: string) => ["groups", groupId, "rallies", "active"] as const,
  submissions: (groupId: string, rallyId: string) =>
    ["groups", groupId, "rallies", rallyId, "submissions"] as const,
};

export function useActiveRallies(groupId: string) {
  return useQuery({
    queryKey: rallyKeys.active(groupId),
    queryFn: async () => {
      const data = await apiFetch<RallyListResponseDTO>(`/api/groups/${groupId}/rally`);
      return data.rallies;
    },
    enabled: !!groupId,
  });
}

// The photos themselves, with signed URLs. Split from the rally list because the
// list only carries S3 keys. Left on the default staleTime: re-signing on refetch
// is free now that images are cached by submission id rather than by URL.
export function useRallySubmissions(groupId: string, rallyId: string | undefined) {
  return useQuery({
    queryKey: rallyKeys.submissions(groupId, rallyId ?? ""),
    queryFn: async () => {
      const data = await apiFetch<RallySubmissionsResponseDTO>(
        `/api/groups/${groupId}/rally/${rallyId}/submissions`
      );
      return data.submissions;
    },
    enabled: !!groupId && !!rallyId,
  });
}

export function useCreateRally(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRallyInput) =>
      apiFetch(`/api/groups/${groupId}/rally`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    meta: {
      errorToastTitle: "Could not create rally",
    },
    // A new rally lands in the `created` pool, so it doesn't show up in the
    // active list until an admin (or the cron) activates it — but invalidate
    // anyway so an activation racing this create isn't missed.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rallyKeys.active(groupId) }),
  });
}

/** Admin-only: pulls rallies out of the `created` pool into the submission phase. */
export function useActivateRallies(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<{ rallies: RallyDTO[] }>(`/api/groups/${groupId}/rally/activate`, {
        method: "POST",
      }),
    meta: {
      errorToastTitle: "Could not start a rally",
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rallyKeys.active(groupId) }),
  });
}

// Submitting is irreversible: one photo per person, no delete endpoint, and a
// second attempt is a 409. Uploads to S3 first, then persists the key.
export function useSubmitPhoto(groupId: string, rallyId: string, userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (asset: PickedImage) => {
      if (!userId) throw new Error("No user loaded");
      const imageKey = await uploadImage(asset, {
        groupId,
        entity: "rally",
        entityId: rallyId,
        userId,
      });
      return apiFetch(`/api/groups/${groupId}/rally/${rallyId}/submissions`, {
        method: "POST",
        body: JSON.stringify({ imageKey }),
      });
    },
    meta: {
      errorToastTitle: "Could not submit your photo",
    },
    onSuccess: async () => {
      haptics.success();
      await queryClient.invalidateQueries({ queryKey: rallyKeys.active(groupId) });
    },
  });
}

// Voting is write-once — the server rejects a second vote (and your own photo)
// with a 409 — so there's no optimistic update: a failed vote must not leave a
// phantom tally on screen. Both queries refresh, since the rally list is what
// tells us you've now voted.
export function useVoteOnSubmission(groupId: string, rallyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) =>
      apiFetch(`/api/groups/${groupId}/rally/${rallyId}/submissions/${submissionId}/vote`, {
        method: "POST",
      }),
    meta: {
      errorToastTitle: "Could not submit your vote",
    },
    onSuccess: async () => {
      haptics.success();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rallyKeys.active(groupId) }),
        queryClient.invalidateQueries({ queryKey: rallyKeys.submissions(groupId, rallyId) }),
      ]);
    },
  });
}

export type { RallySubmissionWithUrlDTO };
