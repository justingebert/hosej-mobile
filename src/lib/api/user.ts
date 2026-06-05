import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { UpdateUserData, UserDTO } from "./types/user";

// The current user lives in the React Query cache under this key — that cache is
// the single source of truth for the user object. Auth is still a dev token
// (see lib/api/client.ts), so there's no persistence yet; when real auth lands,
// the token/deviceId moves into secure storage and these hooks stay the same.
export const userKeys = {
  me: ["user", "me"] as const,
};

export function useUser() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: () => apiFetch<UserDTO>("/api/users"),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserData) =>
      apiFetch<UserDTO>("/api/users", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.me, user);
    },
  });
}
