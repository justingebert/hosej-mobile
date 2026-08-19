import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/config";
import { apiFetch } from "./client";
import type {
  CreateGroupInput,
  GroupDTO,
  GroupFeaturesDTO,
  GroupInviteDTO,
  GroupListResponseDTO,
  GroupQuestionPackDTO,
  GroupWithAdminDTO,
  InvitePreviewDTO,
  JoinByCodeResponseDTO,
  UpdateGroupInput,
} from "./types/group";

export const groupKeys = {
  all: ["groups"] as const,
  detail: (id: string) => ["groups", id] as const,
};

export const packKeys = {
  list: (groupId: string) => ["groups", groupId, "question-packs"] as const,
};

export const inviteKeys = {
  preview: (code: string) => ["invite-preview", code] as const,
  group: (groupId: string) => ["group-invite", groupId] as const,
};

export function useGroups() {
  return useQuery({
    queryKey: groupKeys.all,
    queryFn: () => apiFetch<GroupListResponseDTO>("/api/groups"),
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => apiFetch<GroupWithAdminDTO>(`/api/groups/${id}`),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGroupInput) =>
      apiFetch<GroupDTO>("/api/groups", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    meta: {
      errorToastTitle: "Could not create group",
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.all }),
  });
}

// Join by invite code (the deep link is /join/:code). Idempotent server-side.
export function useJoinByCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) =>
      apiFetch<JoinByCodeResponseDTO>(`/api/invites/${code}`, {
        method: "POST",
      }),
    meta: {
      errorToastTitle: "Could not join group",
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.all }),
  });
}

// Public invite preview — works without an account (the GET endpoint is public).
export function useInvitePreview(code: string) {
  return useQuery({
    queryKey: inviteKeys.preview(code),
    queryFn: () => apiFetch<InvitePreviewDTO>(`/api/invites/${code}`),
    enabled: !!code,
    retry: false,
  });
}

// A group's own shareable invite code (any member). Lazily created server-side.
export function useGroupInvite(groupId: string) {
  return useQuery({
    queryKey: inviteKeys.group(groupId),
    queryFn: () => apiFetch<GroupInviteDTO>(`/api/groups/${groupId}/invite`),
    enabled: !!groupId,
  });
}

// Regenerate the invite code (admin only), invalidating outstanding links.
export function useResetInvite(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<GroupInviteDTO>(`/api/groups/${groupId}/invite/reset`, {
        method: "POST",
      }),
    meta: {
      errorToastTitle: "Could not reset invite link",
    },
    onSuccess: (data) => queryClient.setQueryData(inviteKeys.group(groupId), data),
  });
}

// One-shot fetch of a group's invite code for an on-tap share (avoids a query per
// card in the group list).
export function fetchInviteCode(groupId: string): Promise<GroupInviteDTO> {
  return apiFetch<GroupInviteDTO>(`/api/groups/${groupId}/invite`);
}

/**
 * Settings writes. Optimistic, because the settings sheets close the instant you
 * hit Save — without this the disclosure row behind them keeps showing the old
 * value until the PUT and its refetch round-trip, and a failure reverts silently.
 *
 * Send only the setting keys you're changing. The server merges per key
 * (`applyFeatureUpdates` does `group.set("features.x.settings.y", value)`) and
 * the Zod schema is `.partial()` at both the feature and settings level, so a
 * narrow patch is the correct shape — never spread the whole feature in. Doing
 * so would write back stale siblings, and `packs` in particular is mutated by
 * its own endpoint, so a stale copy here silently un-adds a question pack.
 */
export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGroupInput) =>
      apiFetch<GroupDTO>(`/api/groups/${groupId}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    meta: {
      errorToastTitle: "Could not save settings",
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: groupKeys.detail(groupId) });
      const previous = queryClient.getQueryData<GroupWithAdminDTO>(groupKeys.detail(groupId));
      if (previous) {
        queryClient.setQueryData<GroupWithAdminDTO>(
          groupKeys.detail(groupId),
          applyGroupPatch(previous, input)
        );
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(groupKeys.detail(groupId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

// Packs visible to the group, each flagged `added`. Any member may read this;
// the settings sheet shows the list to everyone and gates the Add button.
export function useGroupPacks(groupId: string) {
  return useQuery({
    queryKey: packKeys.list(groupId),
    queryFn: () =>
      apiFetch<GroupQuestionPackDTO[]>(`/api/groups/${groupId}/question-packs`),
    enabled: !!groupId,
  });
}

/**
 * Add a pack's questions to the group's pool. Admin-only server-side, and
 * **irreversible** — there is no remove-pack endpoint — so the caller confirms
 * first. Not optimistic for the same reason: nothing here should look done
 * before the server says it is.
 */
export function useAddQuestionPack(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (packId: string) =>
      apiFetch(`/api/groups/${groupId}/question-packs`, {
        method: "POST",
        body: JSON.stringify({ packId }),
      }),
    meta: {
      errorToastTitle: "Could not add pack",
    },
    onSuccess: async () => {
      // The group's `features.questions.settings.packs` changed too, so the
      // detail query is stale alongside the pack list.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: packKeys.list(groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) }),
      ]);
    },
  });
}

/** Mirrors the server's per-settings-key merge onto the cached group. */
function applyGroupPatch(group: GroupWithAdminDTO, input: UpdateGroupInput): GroupWithAdminDTO {
  const patch = input.features;
  const features: GroupFeaturesDTO = patch
    ? {
        questions: mergeSettings(group.features.questions, patch.questions),
        rallies: mergeSettings(group.features.rallies, patch.rallies),
        jukebox: mergeSettings(group.features.jukebox, patch.jukebox),
      }
    : group.features;

  return {
    ...group,
    ...(input.name === undefined ? {} : { name: input.name }),
    features,
  };
}

function mergeSettings<T extends { settings: object }>(
  feature: T,
  patch?: { settings?: Partial<T["settings"]> }
): T {
  if (!patch?.settings) return feature;
  return { ...feature, settings: { ...feature.settings, ...patch.settings } };
}

export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      apiFetch<unknown>(`/api/groups/${groupId}/members/${memberId}`, { method: "DELETE" }),
    meta: {
      errorToastTitle: "Could not remove member",
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) }),
  });
}

// Leaving is removing yourself; unlike a kick it refreshes the group list (you
// navigate away), so the now-inaccessible detail query is left alone.
export function useLeaveGroup(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch<unknown>(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" }),
    meta: {
      errorToastTitle: "Could not leave group",
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.all }),
  });
}

export function useDeleteGroup(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<unknown>(`/api/groups/${groupId}`, { method: "DELETE" }),
    meta: {
      errorToastTitle: "Could not delete group",
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.all }),
  });
}

// Accepts a bare invite code or a /join/:code invite link.
export function extractInviteCode(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/join\/([^\s/?#]+)/);
  return match ? match[1] : trimmed;
}

export function buildInviteLink(code: string): string {
  return `${API_URL}/join/${code}`;
}
