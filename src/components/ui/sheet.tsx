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
import { useCSSVariable } from "uniwind";
import { cn } from "@/lib/utils";

export type SheetHandle = { present: () => void; dismiss: () => void };

type SheetProps = {
  children: ReactNode;
  /** Extra classes on the padded content container (e.g. a tighter `gap-3`). */
  className?: string;
} & Pick<
  BottomSheetModalProps,
  | "onDismiss"
  | "keyboardBehavior"
  | "keyboardBlurBehavior"
  | "android_keyboardInputMode"
>;

/**
 * The one bottom-sheet chrome for the app. Owns everything every sheet was
 * hand-rolling: a **solid** themed background with rounded top (so the sheet
 * paints its own surface flush to the bottom — a content-measurement mismatch
 * can never show the backdrop through as a gap), the backdrop, the grabber, the
 * bottom safe-area inset, and `present()` / `dismiss()` via ref. Callers supply
 * only content. Auto-sizes to that content (`enableDynamicSizing`); for a long
 * body, drop a `BottomSheetScrollView` (capped with `maxHeight`) inside.
 */
export const Sheet = forwardRef<SheetHandle, SheetProps>(function Sheet(
  { children, className, ...modalProps },
  ref
) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const background = useCSSVariable("--color-background") as string;

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
      enableDynamicSizing
      handleComponent={null}
      backgroundStyle={backgroundStyle}
      backdropComponent={renderBackdrop}
      {...modalProps}
    >
      <BottomSheetView>
        <View
          className={cn("gap-4 px-5 pt-3", className)}
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View className="h-1 w-10 self-center rounded-full bg-muted-foreground/30" />
          {children}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
