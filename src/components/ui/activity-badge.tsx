import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export function ActivityBadge({ count, className }: { count: number; className?: string }) {
  return (
    <Badge
      variant="default"
      pointerEvents="none"
      accessible
      accessibilityLabel={`${count} new`}
      className={cn("h-5 min-w-5 px-1.5 py-0", className)}
    >
      <Text className="text-[11px] font-bold">{count > 99 ? "99+" : count}</Text>
    </Badge>
  );
}
