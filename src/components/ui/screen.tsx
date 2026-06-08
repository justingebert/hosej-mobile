import type { ReactNode } from "react";
import { RefreshControl, ScrollView } from "react-native";

type ScreenProps = {
  children: ReactNode;
  /** Pass to enable pull-to-refresh. Wire to a query's `refetch`. */
  onRefresh?: () => void;
  /** Wire to a query's `isRefetching`. */
  refreshing?: boolean;
  contentContainerClassName?: string;
};

/**
 * Standard scrollable screen container: themed background, safe-area aware
 * content insets, and optional pull-to-refresh. Use this instead of hand-rolling
 * a ScrollView + RefreshControl in every screen.
 */
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  contentContainerClassName = "grow gap-6 p-4",
}: ScreenProps) {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName={contentContainerClassName}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colorsClassName="accent-muted-foreground"
            tintColorClassName="accent-muted-foreground"
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}
