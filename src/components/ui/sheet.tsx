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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable, useResolveClassNames } from "uniwind";
import { cn } from "@/lib/utils";

export type SheetHandle = { present: () => void; dismiss: () => void };

type SheetProps = {
  children: ReactNode;
  /** Extra classes on the padded content container (e.g. a tighter `gap-3`). */
  className?: string;
  /** Fixed sheet height. Use for sheets that contain gorhom scrollables. */
  height?: number;
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
 * Auto-sizes simple content. Pass `height` for sheets that contain a gorhom
 * scrollable, so scrollable content sizing cannot race the static chrome.
 *
 * Content sits directly in `BottomSheetView` — no wrapper view. An extra wrapper
 * breaks dynamic-size measurement on the New Arch, leaving a gap below the
 * content (gorhom #1573/#2051), so the classes are resolved to a style instead.
 */
export const Sheet = forwardRef<SheetHandle, SheetProps>(function Sheet(
  { children, className, height, ...modalProps },
  ref
) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const background = useCSSVariable("--color-background") as string;
  const contentStyle = useResolveClassNames(cn("gap-4 px-5 pt-3", className));
  const snapPoints = useMemo(() => (height == null ? undefined : [height]), [height]);

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
      enableDynamicSizing={height == null}
      snapPoints={snapPoints}
      handleComponent={null}
      backgroundStyle={backgroundStyle}
      backdropComponent={renderBackdrop}
      {...modalProps}
    >
      <BottomSheetView
        style={[
          contentStyle,
          height == null ? null : { height },
          { paddingBottom: insets.bottom + 12 },
        ]}
      >
        <View className="h-1 w-10 self-center rounded-full bg-muted-foreground/30" />
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});
