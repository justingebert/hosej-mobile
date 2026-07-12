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
  /** Selects fixed sizing for sheets with scrollable content. */
  snapPoint?: number;
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
 * Auto-sizes simple content. Pass `snapPoint` for sheets with a gorhom
 * scrollable; the snap point owns the height and the content fills it.
 */
export const Sheet = forwardRef<SheetHandle, SheetProps>(function Sheet(
  { children, className, snapPoint, ...modalProps },
  ref
) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const background = useCSSVariable("--color-background") as string;
  const contentStyle = useResolveClassNames(cn("gap-4 px-5 pt-3", className));
  const snapPoints = useMemo(
    () => (snapPoint == null ? undefined : [snapPoint]),
    [snapPoint]
  );
  const contentContainerStyle = useMemo(
    () => ({
      ...contentStyle,
      ...(snapPoint == null ? {} : { bottom: 0 }),
      paddingBottom: insets.bottom + 12,
    }),
    [contentStyle, insets.bottom, snapPoint]
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
      enableDynamicSizing={snapPoint == null}
      snapPoints={snapPoints}
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
