import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import { uploadImage, type PickedImage } from "./upload";
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
    meta: {
      errorToastTitle: "Could not save settings",
    },
    // Optimistically flip notification toggles so the Switch responds instantly —
    // a controlled Switch otherwise snaps back until the round-trip returns.
    onMutate: async (data) => {
      if (!data.notificationPrefs) return;
      await queryClient.cancelQueries({ queryKey: userKeys.me });
      const previous = queryClient.getQueryData<UserDTO>(userKeys.me);
      if (previous) {
        queryClient.setQueryData<UserDTO>(userKeys.me, {
          ...previous,
          notificationPrefs: { ...previous.notificationPrefs, ...data.notificationPrefs },
        });
      }
      return { previous };
    },
    onError: (_error, _data, context) => {
      if (context?.previous) queryClient.setQueryData(userKeys.me, context.previous);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.me, user);
    },
  });
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: () => apiFetch<{ message: string }>("/api/users", { method: "DELETE" }),
    meta: {
      errorToastTitle: "Could not delete account",
    },
  });
}

// Uploads the file (see uploadImage) and persists the returned key; the server
// responds with the user carrying a fresh signed avatarUrl. Removal is just
// useUpdateUser().mutate({ avatar: null }).
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (asset: PickedImage) => {
      const user = queryClient.getQueryData<UserDTO>(userKeys.me);
      if (!user?._id) throw new Error("No user loaded");

      const avatar = await uploadImage(asset, {
        groupId: "user",
        entity: "avatar",
        entityId: user._id,
        userId: user._id,
      });

      return apiFetch<UserDTO>("/api/users", {
        method: "PUT",
        body: JSON.stringify({ avatar }),
      });
    },
    meta: {
      errorToastTitle: "Could not update photo",
    },
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.me, user);
    },
  });
}
