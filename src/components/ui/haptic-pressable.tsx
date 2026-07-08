import { haptics, type HapticStyle } from "@/lib/haptics";
import { Pressable, type GestureResponderEvent } from "react-native";

type HapticPressableProps = React.ComponentProps<typeof Pressable> & {
  /** Haptic fired on press. Defaults to "selection"; pass false to disable. */
  haptic?: HapticStyle | false;
};

/**
 * Drop-in replacement for react-native's Pressable that fires a haptic on
 * press. For tappable surfaces (cards, tabs, segmented toggles, icon taps)
 * that aren't a <Button>. Swap the import to opt a surface in.
 */
function HapticPressable({ haptic = "selection", onPress, ...props }: HapticPressableProps) {
  function handlePress(event: GestureResponderEvent) {
    if (haptic) haptics[haptic]();
    onPress?.(event);
  }

  return <Pressable onPress={handlePress} {...props} />;
}

export { HapticPressable };
export type { HapticPressableProps };
