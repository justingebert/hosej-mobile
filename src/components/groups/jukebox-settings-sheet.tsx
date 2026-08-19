import { forwardRef, useImperativeHandle, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Plus, Trash2 } from "lucide-react-native";
import { useCSSVariable } from "uniwind";
import { Button } from "@/components/ui/button";
import { HapticPressable } from "@/components/ui/haptic-pressable";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import {
  FeatureSheetActions,
  FeatureSheetHeader,
  ReadOnlyNote,
  useCommitOnDismiss,
  useFeatureSheet,
  type CommitRef,
  type FeatureSheetRef,
} from "@/components/groups/feature-settings-sheet";
import { cn } from "@/lib/utils";
import type { GroupJukeboxFeatureDTO } from "@/lib/api/types/group";

const MAX_JUKEBOXES = 3;
const MAX_NAME_LENGTH = 40;
const DEFAULT_NAME_POOL = ["Jukebox", "Jukebox 2", "Jukebox 3"];

// 0 is the server's "last day of month" sentinel (jukebox.ts checks
// `activationDays.includes(0) && isLastDayOfMonth`). Real days stop at 28 so
// every selectable day exists in every month.
const LAST_DAY = 0;
const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);
// Sheet's own horizontal padding (px-5 both sides).
const SHEET_PADDING_X = 40;

type Settings = GroupJukeboxFeatureDTO["settings"];

type Props = {
  settings: Settings;
  canEdit: boolean;
  onSave: (settings: Partial<Settings>) => void;
};

export type JukeboxSettingsSheetRef = FeatureSheetRef;

/** Compact form for the settings row, e.g. "1, 15 & last day". */
export function formatActivationDays(days: number[]): string {
  const numeric = days.filter((d) => d > 0).sort((a, b) => a - b);
  const parts = numeric.map(String);
  if (days.includes(LAST_DAY)) parts.push("last day");
  if (parts.length === 0) return "Never";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} & ${parts[parts.length - 1]}`;
}

export const JukeboxSettingsSheet = forwardRef<JukeboxSettingsSheetRef, Props>(
  function JukeboxSettingsSheet(props, ref) {
    const { modalRef, commitRef, openKey, present, dismiss, onDismiss } = useFeatureSheet();

    useImperativeHandle(ref, () => ({ present }), [present]);

    return (
      // Names + a 4-row day grid fill the screen, so this one runs full-height
      // and scrolls inside.
      <Sheet
        ref={modalRef}
        fullHeight
        onDismiss={onDismiss}
        android_keyboardInputMode="adjustResize"
      >
        <SheetBody key={openKey} commitRef={commitRef} onClose={dismiss} {...props} />
      </Sheet>
    );
  }
);

function SheetBody({
  settings,
  canEdit,
  onSave,
  onClose,
  commitRef,
}: Props & { onClose: () => void; commitRef: CommitRef }) {
  const [names, setNames] = useState<string[]>(settings.concurrent);
  const [days, setDays] = useState<number[]>(settings.activationDays);
  const [error, setError] = useState<string | null>(null);

  // BottomSheetTextInput is a third-party component, so uniwind's className
  // doesn't reach it — style it from the theme variables instead.
  const foreground = useCSSVariable("--color-foreground") as string;
  const border = useCSSVariable("--color-border") as string;
  const card = useCSSVariable("--color-card") as string;

  // Floor the seventh: an exact fit rounds up in float math and wraps the row
  // to six columns.
  const { width } = useWindowDimensions();
  const cellWidth = Math.floor((width - SHEET_PADDING_X) / 7);

  const rename = (index: number, value: string) => {
    setNames((prev) => prev.map((name, i) => (i === index ? value : name)));
    setError(null);
  };

  const add = () => {
    const used = new Set(names.map((n) => n.trim().toLowerCase()));
    const next =
      DEFAULT_NAME_POOL.find((candidate) => !used.has(candidate.toLowerCase())) ??
      `Jukebox ${names.length + 1}`;
    setNames((prev) => [...prev, next]);
    setError(null);
  };

  const remove = (index: number) => {
    setNames((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const toggleDay = (day: number) =>
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );

  // Null when the draft is savable, otherwise the reason it isn't.
  const validate = (trimmed: string[]) => {
    if (trimmed.some((name) => name.length === 0)) return "Names can't be empty.";
    if (new Set(trimmed.map((n) => n.toLowerCase())).size !== trimmed.length) {
      return "Names must be unique.";
    }
    // Save is already disabled at zero days, but a swipe-down isn't — and an
    // empty activationDays means the jukebox never refreshes again.
    if (days.length === 0) return "Pick at least one refresh day.";
    return null;
  };

  const commit = () => {
    const trimmed = names.map((name) => name.trim());
    // Swiping the sheet away with an invalid draft discards it: there's nowhere
    // left to show the error, and blocking the gesture would be worse.
    if (validate(trimmed)) return;

    const patch: Partial<Settings> = {};
    if (!sameOrder(trimmed, settings.concurrent)) patch.concurrent = trimmed;
    if (!sameOrder(days, settings.activationDays)) patch.activationDays = days;
    if (Object.keys(patch).length > 0) onSave(patch);
  };
  const markSettled = useCommitOnDismiss(commitRef, commit, canEdit);

  const save = () => {
    const problem = validate(names.map((name) => name.trim()));
    if (problem) {
      setError(problem);
      return;
    }
    markSettled();
    commit();
    onClose();
  };

  const cancel = () => {
    markSettled();
    onClose();
  };

  return (
    <>
      <FeatureSheetHeader title="Jukebox Settings" onClose={onClose} />

      <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8 }}>
        <Text className="text-foreground">Jukeboxes</Text>
        <Text variant="muted" className="text-sm">
          Up to {MAX_JUKEBOXES} diffrent themes can run side by side each cycle. For example: Most Listened, Recommended, ...
        </Text>

        <View className="gap-2 pt-1">
          {names.map((name, index) => (
            <View key={index} className="flex-row items-center gap-2">
              {/* Must be gorhom's input, not react-native's: only this one tells
                  the sheet to lift when the keyboard opens. */}
              <BottomSheetTextInput
                value={name}
                onChangeText={(value) => rename(index, value)}
                editable={canEdit}
                maxLength={MAX_NAME_LENGTH}
                returnKeyType="done"
                accessibilityLabel={`Jukebox ${index + 1} name`}
                style={{
                  flex: 1,
                  height: 44,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: border,
                  backgroundColor: card,
                  color: foreground,
                  fontSize: 16,
                  opacity: canEdit ? 1 : 0.5,
                }}
              />
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={names.length <= 1}
                  accessibilityLabel={`Remove ${name}`}
                  onPress={() => remove(index)}
                >
                  <Icon as={Trash2} className="size-4" />
                </Button>
              ) : null}
            </View>
          ))}
        </View>

        {canEdit ? (
          <Button variant="outline" size="sm" disabled={names.length >= MAX_JUKEBOXES} onPress={add}>
            <Icon as={Plus} className="size-4" />
            <Text>
              Add jukebox ({names.length}/{MAX_JUKEBOXES})
            </Text>
          </Button>
        ) : null}

        {/* Two traps worth naming: the jukebox's title is copied at creation, and
            getJukeboxes limits the response to `concurrent.length`. */}
        <Text variant="muted" className="text-sm">
          Renaming applies to the next cycle, jukeboxes already running keep their name.
          {names.length < settings.concurrent.length
            ? " Removing one also hides the oldest running jukebox for everyone."
            : ""}
        </Text>

        <Text className="pt-4 text-foreground">Refreshes on</Text>
        <Text variant="muted" className="text-sm">
          Days of the month a fresh jukebox cycle starts.
        </Text>

        <View className="flex-row flex-wrap pt-1">
          {DAYS.map((day) => (
            <View key={day} style={{ width: cellWidth }} className="p-0.5">
              <DayCell
                label={String(day)}
                selected={days.includes(day)}
                disabled={!canEdit}
                onPress={() => toggleDay(day)}
              />
            </View>
          ))}
        </View>

        <DayCell
          label="Last day of month"
          selected={days.includes(LAST_DAY)}
          disabled={!canEdit}
          onPress={() => toggleDay(LAST_DAY)}
        />

        <Text variant="muted" className="text-sm">
          {days.length === 0
            ? "Pick at least one day — the jukebox would never refresh."
            : `Activates on ${formatActivationDays(days)} of every month.`}
        </Text>

        {canEdit ? null : <ReadOnlyNote />}
      </BottomSheetScrollView>

      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

      <FeatureSheetActions
        canEdit={canEdit}
        onClose={cancel}
        onSave={save}
        saveDisabled={days.length === 0}
      />
    </>
  );
}

const sameOrder = <T,>(a: T[], b: T[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

function DayCell({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <HapticPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      className={cn(
        "h-10 items-center justify-center rounded-md border active:opacity-70",
        selected ? "border-primary bg-primary" : "border-border bg-background",
        disabled && "opacity-60"
      )}
    >
      <Text
        className={cn(
          "text-sm font-medium",
          selected ? "text-primary-foreground" : "text-foreground"
        )}
      >
        {label}
      </Text>
    </HapticPressable>
  );
}
