import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/config";
import { apiFetch } from "./client";
import type {
  CreateGroupInput,
  GroupDTO,
  GroupListResponseDTO,
  GroupWithAdminDTO,
  JoinGroupResponseDTO,
  UpdateGroupInput,
} from "./types/group";

export const groupKeys = {
  all: ["groups"] as const,
  detail: (id: string) => ["groups", id] as const,
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

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    // Join is keyed by groupId; the invite link is just /join/:groupId.
    mutationFn: (groupId: string) =>
      apiFetch<JoinGroupResponseDTO>(`/api/groups/${groupId}/members`, {
        method: "POST",
      }),
    meta: {
      errorToastTitle: "Could not join group",
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.all }),
  });
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

// Accepts a raw group id or a /join/:groupId invite link.
export function extractGroupId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/join\/([^\s/?#]+)/);
  return match ? match[1] : trimmed;
}


export function buildInviteLink(groupId: string): string {
  return `${API_URL}/join/${groupId}`;
}
