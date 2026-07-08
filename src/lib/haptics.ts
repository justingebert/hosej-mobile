import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Single source of truth for haptic feedback. Everything in the app calls
// through here so the expo-haptics API lives in exactly one place. Native only
// (web has no meaningful haptics), fire-and-forget, and never rejects.
const enabled = Platform.OS !== "web";

function fire(run: () => Promise<void>) {
  if (!enabled) return;
  run().catch(() => {});
}

export type HapticStyle = keyof typeof haptics;

export const haptics = {
  /** Button press / general tap. */
  light: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A heavier tap for weightier actions. */
  medium: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  /** Tiny tick for selection changes (tabs, segmented, toggles). */
  selection: () => fire(() => Haptics.selectionAsync()),
  /** Outcome of an action succeeding. */
  success: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};