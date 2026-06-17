// Shared API error primitives. Extracted from client.ts so the auth endpoint
// wrappers (lib/auth/api.ts) can throw the same error type without importing
// client.ts (which imports them back — that would be a cycle). client.ts
// re-exports these, so existing `@/lib/api/client` imports keep working.

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}
