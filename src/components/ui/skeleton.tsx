import { View } from "react-native";
import { cn } from "@/lib/utils";

/**
 * Skeleton building block — a muted placeholder bar. Compose these into a
 * content-shaped skeleton per screen (skeletons are layout-specific and stay
 * local; only this primitive is shared).
 */
export function Skeleton({ className }: { className?: string }) {
  return <View className={cn("rounded-md bg-muted", className)} />;
}
