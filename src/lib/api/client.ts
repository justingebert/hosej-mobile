import { fetch } from "expo/fetch";
import { API_URL } from "@/lib/config";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const DEV_TOKEN = process.env.EXPO_PUBLIC_DEV_TOKEN;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-hosej-client": "mobile",
        ...(DEV_TOKEN ? { Authorization: `Bearer ${DEV_TOKEN}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Could not reach the HoseJ API.");
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (body as { message?: string })?.message) || `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return body as T;
}
