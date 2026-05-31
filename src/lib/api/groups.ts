import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { GroupListResponseDTO, GroupWithAdminDTO } from "./types/group";

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
