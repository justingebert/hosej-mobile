import { MutationCache, QueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/api/client";
import { haptics } from "@/lib/haptics";
import { toastError } from "@/lib/toast";

type MutationToastMeta = {
  errorToastTitle?: string;
  errorToastMessage?: string;
  suppressErrorToast?: boolean;
};

function getMutationToastMeta(meta: unknown): MutationToastMeta {
  if (!meta || typeof meta !== "object") return {};
  return meta as MutationToastMeta;
}

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const meta = getMutationToastMeta(mutation.options.meta);

      if (meta.suppressErrorToast) return;

      haptics.error();
      toastError(
        meta.errorToastTitle ?? "Action failed",
        meta.errorToastMessage ?? getErrorMessage(error)
      );
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});
