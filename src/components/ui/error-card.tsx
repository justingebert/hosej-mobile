import { Pressable, Text, View } from "react-native";
import { getErrorMessage } from "@/lib/api/client";
import { API_URL } from "@/lib/config";

type ErrorCardProps = {
  /** Headline, e.g. "Could not load groups". */
  title?: string;
  /** The thrown error; its message is shown to the user. */
  error?: unknown;
  /** Show a retry button when provided. Wire to a query's `refetch`. */
  onRetry?: () => void;
  /** Wire to a query's `isRefetching`. */
  isRetrying?: boolean;
};

/**
 * The single error view for failed queries. Renders where the missing content
 * would have been so the user keeps screen context. For mutation/action errors,
 * prefer transient feedback (a toast) over this card.
 */
export function ErrorCard({
  title = "Something went wrong",
  error,
  onRetry,
  isRetrying = false,
}: ErrorCardProps) {
  return (
    <View
      className="gap-3 rounded-2xl border border-border bg-card p-5"
      style={{ borderCurve: "continuous" }}
    >
      <Text className="text-sm font-extrabold text-destructive">{title}</Text>

      {error != null ? (
        <Text selectable className="text-base text-card-foreground">
          {getErrorMessage(error)}
        </Text>
      ) : null}

      {__DEV__ ? (
        <Text selectable className="text-xs text-muted-foreground">
          API: {API_URL}
        </Text>
      ) : null}

      {onRetry ? (
        <Pressable
          className="self-start rounded-full bg-primary px-4 py-2 disabled:opacity-60"
          disabled={isRetrying}
          onPress={onRetry}
        >
          <Text className="text-sm font-bold text-primary-foreground">
            {isRetrying ? "Retrying…" : "Try again"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
