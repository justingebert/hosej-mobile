import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import { initialWindowMetrics, useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable, useResolveClassNames } from "uniwind";
import { cn } from "@/lib/utils";

/** Air below a sheet's last row, on top of the safe-area inset. */
const BOTTOM_GAP = 16;

export type SheetHandle = { present: () => void; dismiss: () => void };

type SheetProps = {
  children: ReactNode;
  /** Extra classes on the padded content container (e.g. a tighter `gap-3`). */
  className?: string;
  /** Selects fixed sizing for sheets with scrollable content. */
  snapPoint?: number;
  /**
   * Fixed sizing at the full height of the screen, stopping below the status
   * bar so the sheet still reads as a sheet. Takes precedence over `snapPoint`.
   */
  fullHeight?: boolean;
} & Pick<
  BottomSheetModalProps,
  | "onDismiss"
  | "keyboardBehavior"
  | "keyboardBlurBehavior"
  | "android_keyboardInputMode"
>;

/**
 * The one bottom-sheet chrome for the app: solid themed background, backdrop,
 * grabber, bottom safe-area inset, and `present()` / `dismiss()` via ref.
 * Auto-sizes simple content. Pass `snapPoint` (or `fullHeight`) for sheets with
 * a gorhom scrollable; the snap point owns the height and the content fills it.
 */
export const Sheet = forwardRef<SheetHandle, SheetProps>(function Sheet(
  { children, className, snapPoint, fullHeight, ...modalProps },
  ref
) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const background = useCSSVariable("--color-background") as string;
  const contentStyle = useResolveClassNames(cn("gap-4 px-5 pt-3", className));
  // Anything but a hugging sheet stretches its content to the sheet's height.
  const isFixed = fullHeight || snapPoint != null;
  // A native-stack header zeroes `insets.top` for the screen under it, but a
  // sheet is a portal at the window root — it still has to clear the notch, so
  // fall back to the device's own metrics.
  const topInset = Math.max(insets.top, initialWindowMetrics?.insets.top ?? 0);
  // Same story at the bottom, inverted: a tab navigator *inflates*
  // `insets.bottom` with the tab bar height (83 vs 34 on an iPhone), and the
  // sheet covers the tab bar rather than sitting behind it — so trusting the
  // context left ~50pt of dead space under the last row on every tab screen.
  const bottomInset = initialWindowMetrics?.insets.bottom ?? insets.bottom;
  const snapPoints = useMemo(
    () => (fullHeight ? ["100%"] : snapPoint == null ? undefined : [snapPoint]),
    [fullHeight, snapPoint]
  );
  const contentContainerStyle = useMemo(
    () => ({
      ...contentStyle,
      ...(isFixed ? { bottom: 0 } : {}),
      paddingBottom: bottomInset + BOTTOM_GAP,
    }),
    [contentStyle, bottomInset, isFixed]
  );

  useImperativeHandle(
    ref,
    () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }),
    []
  );

  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    }),
    [background]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      enableDynamicSizing={!isFixed}
      snapPoints={snapPoints}
      // A fixed sheet stretches its content with `bottom: 0`, which resolves
      // against gorhom's border box — and that box is taller than the visible
      // sheet by an over-drag safety pad of
      // `sqrt(containerHeight + topSnapPoint) * overDragResistanceFactor`
      // (~76pt on an iPhone), which pushed a pinned footer off-screen. Zeroing
      // the factor removes both the pad and the rubber-band over-drag; swipe to
      // dismiss is unaffected (it's clamped, not resisted).
      overDragResistanceFactor={isFixed ? 0 : undefined}
      // "100%" is measured against this, so it lands below the status bar
      // rather than behind it.
      topInset={fullHeight ? topInset : 0}
      handleComponent={null}
      backgroundStyle={backgroundStyle}
      backdropComponent={renderBackdrop}
      {...modalProps}
    >
      <BottomSheetView style={contentContainerStyle}>
        <View className="h-1 w-10 self-center rounded-full bg-muted-foreground/30" />
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});
