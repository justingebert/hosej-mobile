import { useEffect, useRef, useState, type RefObject } from "react";
import { View } from "react-native";
import { X } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { SheetHandle } from "@/components/ui/sheet";

/** 1–3 — the shared range for the "how many run at once" settings. */
export const COUNT_OPTIONS = [1, 2, 3].map((n) => ({ label: String(n), value: String(n) }));

export type FeatureSheetRef = { present: () => void };

/** Where a sheet body parks its commit function for the outer `onDismiss`. */
export type CommitRef = RefObject<(() => void) | null>;

/**
 * Wiring every feature sheet shares: the modal ref, a fresh `openKey` per
 * present (re-mounting the body resets its draft to the saved settings), and the
 * dismiss hook-up.
 *
 * A bottom sheet can be closed by swiping it down, which hits neither Cancel nor
 * Save — so on dismiss we flush whatever commit the body parked, rather than
 * silently dropping the edits.
 */
export function useFeatureSheet() {
  const modalRef = useRef<SheetHandle>(null);
  const commitRef: CommitRef = useRef<(() => void) | null>(null);
  const [openKey, setOpenKey] = useState(0);

  return {
    modalRef,
    commitRef,
    openKey,
    present: () => {
      setOpenKey((key) => key + 1);
      modalRef.current?.present();
    },
    dismiss: () => modalRef.current?.dismiss(),
    onDismiss: () => {
      commitRef.current?.();
      commitRef.current = null;
    },
  };
}

/**
 * Body side of the above. Re-registers `commit` on every render so the parked
 * closure always sees the current draft.
 *
 * Call `markSettled()` from Save and Cancel: both dismiss the sheet, which fires
 * `onDismiss` straight after, and without the flag Save would write twice and
 * Cancel would write the very draft it discarded.
 */
export function useCommitOnDismiss(
  commitRef: CommitRef,
  commit: () => void,
  canEdit: boolean
) {
  const settled = useRef(false);

  useEffect(() => {
    commitRef.current = () => {
      if (settled.current || !canEdit) return;
      commit();
    };
  });

  return () => {
    settled.current = true;
  };
}

/**
 * Header for a feature settings sheet: centred title with a close button in the
 * top-right corner. The X is the button form of the swipe-down, so it dismisses
 * the same way — the parked commit flushes the draft.
 */
export function FeatureSheetHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    // Row is button-height so the absolute X can't push the title off-centre.
    <View className="h-10 items-center justify-center">
      <Text variant="large">{title}</Text>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0"
        accessibilityLabel="Close settings"
        onPress={onClose}
      >
        <Icon as={X} className="size-5 text-muted-foreground" />
      </Button>
    </View>
  );
}

/**
 * Footer for a feature settings sheet. Every member can open these sheets to
 * see how their group is configured, so it's the write path that's gated: a
 * non-admin gets no footer at all and closes via the header's X.
 */
export function FeatureSheetActions({
  canEdit,
  onClose,
  onSave,
  saveDisabled,
}: {
  canEdit: boolean;
  onClose: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}) {
  if (!canEdit) return null;

  return (
    <View className="flex-row gap-3">
      <Button variant="outline" className="flex-1" onPress={onClose}>
        <Text>Cancel</Text>
      </Button>
      <Button className="flex-1" disabled={saveDisabled} onPress={onSave}>
        <Text>Save</Text>
      </Button>
    </View>
  );
}

/** Says why the controls above are inert. Render only when `canEdit` is false. */
export function ReadOnlyNote() {
  return (
    <Text variant="muted" className="text-sm">
      Only the group admin can change these settings.
    </Text>
  );
}
