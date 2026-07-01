import { useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { PairingMode } from "@/lib/api/types/question";
import type { QuestionInputProps } from "./types";

// Stable per-value palette: a paired key and its value both render the hue at
// `values.indexOf(value) % length`. Anchoring color to the value's *fixed*
// index — not the order pairs happen to be made — is what stops colors from
// shifting as you edit selections.
const PAIR_COLORS: { cell: string; text: string }[] = [
  { cell: "bg-chart-1/20 border-chart-1/40", text: "text-chart-1" },
  { cell: "bg-chart-2/20 border-chart-2/40", text: "text-chart-2" },
  { cell: "bg-chart-3/20 border-chart-3/40", text: "text-chart-3" },
  { cell: "bg-chart-4/20 border-chart-4/40", text: "text-chart-4" },
  { cell: "bg-chart-5/20 border-chart-5/40", text: "text-chart-5" },
  { cell: "bg-chart-6/20 border-chart-6/40", text: "text-chart-6" },
  { cell: "bg-chart-7/20 border-chart-7/40", text: "text-chart-7" },
  { cell: "bg-chart-8/20 border-chart-8/40", text: "text-chart-8" },
  { cell: "bg-chart-9/20 border-chart-9/40", text: "text-chart-9" },
  { cell: "bg-chart-10/20 border-chart-10/40", text: "text-chart-10" },
];

// Two-column matcher. Tap a key to make it active, then tap a value to assign
// it (re-tap the same value to clear). Exclusive mode locks values already used
// by another key; open mode lets values repeat — that boolean is the only
// difference between the two modes.
export function PairingQuestionScreen({
  question,
  response,
  onResponseChange,
}: QuestionInputProps) {
  const keys = question.pairing?.keys ?? [];
  const values = question.pairing?.values ?? [];
  const isExclusive = question.pairing?.mode === PairingMode.Exclusive;

  // Committed pairs are the controlled response; only the in-progress "which key
  // am I assigning right now?" lives locally.
  const pairs = response && !Array.isArray(response) ? response : {};
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const assignedValues = new Set(Object.values(pairs));
  const colorForValue = (value: string) => {
    const idx = values.indexOf(value);
    return idx >= 0 ? PAIR_COLORS[idx % PAIR_COLORS.length] : null;
  };

  const tapKey = (key: string) =>
    setActiveKey((prev) => (prev === key ? null : key));

  const tapValue = (value: string) => {
    if (activeKey === null) return;
    // Exclusive: a value taken by another key is locked. The active key's own
    // value stays tappable, so re-tapping it clears the pair.
    if (isExclusive && assignedValues.has(value) && pairs[activeKey] !== value) {
      return;
    }

    const next = { ...pairs };
    if (next[activeKey] === value) {
      delete next[activeKey]; // re-tap toggle → unpair
    } else {
      next[activeKey] = value;
    }
    onResponseChange(Object.keys(next).length > 0 ? next : null);
    setActiveKey(null);
  };

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <View className="flex-1 gap-2">
          <Text className="text-xs font-medium text-muted-foreground">Match</Text>
          {keys.map((key) => {
            const value = pairs[key];
            return (
              <PairCell
                key={key}
                label={key}
                color={value ? colorForValue(value) : null}
                active={activeKey === key}
                onPress={() => tapKey(key)}
              />
            );
          })}
        </View>

        <View className="flex-1 gap-2">
          <Text className="text-xs font-medium text-muted-foreground">With</Text>
          {values.map((value, index) => {
            const lockedInExclusive =
              isExclusive &&
              assignedValues.has(value) &&
              (activeKey === null || pairs[activeKey] !== value);
            return (
              <PairCell
                key={`${value}-${index}`}
                label={value}
                color={assignedValues.has(value) ? colorForValue(value) : null}
                disabled={activeKey === null || lockedInExclusive}
                onPress={() => tapValue(value)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function PairCell({
  label,
  color,
  active = false,
  disabled = false,
  onPress,
}: {
  label: string;
  color: { cell: string; text: string } | null;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        "min-h-12 items-center justify-center rounded-xl border-2 px-3 py-3",
        active
          ? "border-foreground bg-foreground/10"
          : color
            ? color.cell
            : "border-transparent bg-secondary",
        disabled && !active && "opacity-40"
      )}
      style={{ borderCurve: "continuous" }}
    >
      <Text
        numberOfLines={2}
        className={cn(
          "text-center text-sm font-semibold",
          active ? "text-foreground" : color ? color.text : "text-secondary-foreground"
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
