import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
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
      className="flex-1 items-center justify-center gap-3 p-5"
    >
      <Text className="text-center text-sm font-extrabold text-destructive">{title}</Text>

      {error != null ? (
        <Text selectable className="text-center text-base text-card-foreground">
          {getErrorMessage(error)}
        </Text>
      ) : null}

      {__DEV__ ? (
        <Text selectable className="text-center text-xs text-muted-foreground">
          API: {API_URL}
        </Text>
      ) : null}

      {onRetry ? (
        <Button className="self-center" disabled={isRetrying} onPress={onRetry}>
          <Text>{isRetrying ? "Retrying…" : "Try again"}</Text>
        </Button>
      ) : null}
    </View>
  );
}
