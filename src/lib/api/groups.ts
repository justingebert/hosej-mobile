import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/config";
import { apiFetch } from "./client";
import type {
  CreateGroupInput,
  GroupDTO,
  GroupInviteDTO,
  GroupListResponseDTO,
  GroupWithAdminDTO,
  InvitePreviewDTO,
  JoinByCodeResponseDTO,
  UpdateGroupInput,
} from "./types/group";

export const groupKeys = {
  all: ["groups"] as const,
  detail: (id: string) => ["groups", id] as const,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) }),
  });
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
