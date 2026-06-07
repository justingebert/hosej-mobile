import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/config";
import { apiFetch } from "./client";
import type {
  CreateGroupInput,
  GroupDTO,
  GroupListResponseDTO,
  GroupWithAdminDTO,
  JoinGroupResponseDTO,
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
