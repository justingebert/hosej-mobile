import { Children, isValidElement } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

/**
 * iOS-style inset grouped section: an optional muted title above a rounded,
 * filled container (no border). Each child is treated as a row and separated by
 * an inset hairline divider. All the grouped-list styling lives here so screens
 * stay declarative — pass rows (usually `SettingsRow`) as children.
 */
export function SettingsGroup({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View className="gap-2">
      {title ? (
        <Text className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </Text>
      ) : null}
      <View
        className={cn("overflow-hidden rounded-2xl bg-card", className)}
        style={{ borderCurve: "continuous" }}
      >
        {rows.map((row, i) => (
          <View key={row.key ?? i}>
            {i > 0 ? <View className="ml-4 h-px bg-border" /> : null}
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * A single grouped-list row: label (+ optional description) on the left, any
 * control or value passed as `children` on the right. Omit the label to use the
 * row as a free-form slot (e.g. a centered avatar block).
 */
export function SettingsRow({
  label,
  description,
  children,
  className,
}: {
  label?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "min-h-12 flex-row items-center justify-between gap-3 px-4 py-3",
        className
      )}
    >
      {label || description ? (
        <View className="flex-1 gap-0.5">
          {label ? <Text className="text-foreground">{label}</Text> : null}
          {description ? (
            <Text className="text-xs text-muted-foreground">{description}</Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}
