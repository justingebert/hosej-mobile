import { forwardRef, type ReactNode } from "react";
import { RefreshControl, ScrollView } from "react-native";

type ScreenProps = {
  children: ReactNode;
  /** Pass to enable pull-to-refresh. Wire to a query's `refetch`. */
  onRefresh?: () => void;
  /** Wire to a query's `isRefetching`. */
  refreshing?: boolean;
  /** iOS: inset + scroll so a focused input stays above the keyboard. */
  avoidKeyboard?: boolean;
  contentContainerClassName?: string;
};

/**
 * Standard scrollable screen container: themed background, safe-area aware
 * content insets, and optional pull-to-refresh. Use this instead of hand-rolling
 * a ScrollView + RefreshControl in every screen.
 */
export const Screen = forwardRef<ScrollView, ScreenProps>(function Screen(
  {
    children,
    onRefresh,
    refreshing = false,
    avoidKeyboard = false,
    contentContainerClassName = "grow gap-6 px-4 py-2",
  },
  ref
) {
  return (
    <ScrollView
      ref={ref}
      className="flex-1 bg-background"
      contentContainerClassName={contentContainerClassName}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets={avoidKeyboard}
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
});
