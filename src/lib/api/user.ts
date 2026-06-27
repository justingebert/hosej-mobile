import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetch } from "expo/fetch";
import { File } from "expo-file-system";
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
    meta: {
      errorToastTitle: "Could not save settings",
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

/** A photo chosen from the device, as returned by expo-image-picker. */
export type PickedAvatar = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

// Avatar upload is three hops and deliberately reuses the existing API as-is:
//   1. apiFetch    → presigned S3 POST (Bearer + JSON)
//   2. expo/fetch  → the file straight to S3 (no Bearer; auth is in the fields)
//   3. apiFetch    → persist the returned key; the server responds with the user
//                    carrying a fresh signed avatarUrl.
// The S3 step uses expo/fetch + an expo-file-system File (the SDK 55 way), not
// the legacy { uri, name, type } FormData shape. Removal is just
// useUpdateUser().mutate({ avatar: null }).
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (asset: PickedAvatar) => {
      const user = queryClient.getQueryData<UserDTO>(userKeys.me);
      if (!user?._id) throw new Error("No user loaded");

      const contentType = asset.mimeType ?? "image/jpeg";
      const filename = asset.fileName ?? "avatar.jpg";

      const { url, fields } = await apiFetch<{ url: string; fields: Record<string, string> }>(
        "/api/uploadimage",
        {
          method: "POST",
          body: JSON.stringify({
            filename,
            contentType,
            groupId: "user",
            entity: "avatar",
            entityId: user._id,
            userId: user._id,
          }),
        }
      );

      // Presigned POST requires every policy field first and the file LAST.
      const form = new FormData();
      Object.entries(fields).forEach(([key, value]) => form.append(key, value));
      form.append("file", new File(asset.uri) as unknown as Blob);

      const upload = await fetch(url, { method: "POST", body: form });
      if (!upload.ok) throw new Error(`Image upload failed (${upload.status})`);

      return apiFetch<UserDTO>("/api/users", {
        method: "PUT",
        body: JSON.stringify({ avatar: fields.key }),
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
