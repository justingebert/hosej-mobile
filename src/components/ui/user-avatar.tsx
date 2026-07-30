import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

/**
 * A person's avatar: their photo, or their initial on a muted circle.
 *
 * Composes the RNR `Avatar` primitive (Root/Image/Fallback) so the fallback
 * letter, the `alt` text, and the empty-name guard are derived in exactly one
 * place. Use this for *displaying* someone; `AvatarPicker` is the editable one.
 *
 * Size comes from `className` (e.g. "size-6", "size-10"), same as `Avatar`.
 */
export function UserAvatar({
  name,
  avatarUrl,
  className,
  fallbackClassName,
}: {
  name: string;
  avatarUrl?: string;
  /** Avatar size, e.g. "size-10". Defaults to the primitive's size-8. */
  className?: string;
  /** Overrides the initial's type styling — only needed on larger avatars. */
  fallbackClassName?: string;
}) {
  const initial = (name || "?").slice(0, 1).toUpperCase();

  return (
    <Avatar alt={`${name} avatar`} className={className}>
      {avatarUrl ? <AvatarImage source={{ uri: avatarUrl }} /> : null}
      <AvatarFallback>
        <Text className={cn("text-xs font-extrabold text-foreground", fallbackClassName)}>
          {initial}
        </Text>
      </AvatarFallback>
    </Avatar>
  );
}
