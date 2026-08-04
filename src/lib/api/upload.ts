import { fetch } from "expo/fetch";
import { File } from "expo-file-system";
import { apiFetch } from "./client";

/** A photo chosen from the device, as returned by expo-image-picker. */
export type PickedImage = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

type UploadTarget = {
  /** Bucket prefix. The literal "user" for avatars, otherwise a real group id. */
  groupId: string;
  /** What the image belongs to — "avatar", "rally", … */
  entity: string;
  entityId: string;
  userId: string;
};

// Image upload is three hops against the existing API:
//   1. apiFetch    → presigned S3 POST (Bearer + JSON)
//   2. expo/fetch  → the file straight to S3 (no Bearer; auth is in the fields)
//   3. caller      → persists the returned key wherever it belongs
// The S3 step uses expo/fetch + an expo-file-system File (the SDK 55 way), not
// the legacy { uri, name, type } FormData shape.
export async function uploadImage(
  asset: PickedImage,
  { groupId, entity, entityId, userId }: UploadTarget
): Promise<string> {
  const contentType = asset.mimeType ?? "image/jpeg";
  const filename = asset.fileName ?? "photo.jpg";

  const { url, fields } = await apiFetch<{ url: string; fields: Record<string, string> }>(
    "/api/uploadimage",
    {
      method: "POST",
      body: JSON.stringify({ filename, contentType, groupId, entity, entityId, userId }),
    }
  );

  // Presigned POST requires every policy field first and the file LAST.
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  form.append("file", new File(asset.uri) as unknown as Blob);

  const upload = await fetch(url, { method: "POST", body: form });
  if (!upload.ok) throw new Error(`Image upload failed (${upload.status})`);

  return fields.key;
}
