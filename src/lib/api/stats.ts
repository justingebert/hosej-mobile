import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { GroupStatsDTO } from "./types/group";

export const statsKeys = {
  detail: (groupId: string) => ["groups", groupId, "stats"] as const,
};

export function useGroupStats(groupId: string) {
  return useQuery({
    queryKey: statsKeys.detail(groupId),
    queryFn: () => apiFetch<GroupStatsDTO>(`/api/groups/${groupId}/stats`),
    enabled: !!groupId,
  });
}
