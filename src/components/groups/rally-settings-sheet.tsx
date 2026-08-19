import { forwardRef, useImperativeHandle, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useCSSVariable } from "uniwind";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import {
  COUNT_OPTIONS,
  FeatureSheetActions,
  FeatureSheetHeader,
  ReadOnlyNote,
  useCommitOnDismiss,
  useFeatureSheet,
  type CommitRef,
  type FeatureSheetRef,
} from "@/components/groups/feature-settings-sheet";
import type { GroupRalliesFeatureDTO } from "@/lib/api/types/group";

const MAX_RALLY_GAP_DAYS = 90;

// A gorhom text input pads a *dynamically* sized sheet with dead space below the
// content, which parked the actions well above the other feature sheets'. Fixing
// the height side-steps it and lines all three footers up; the body grows to
// fill, so the actions stay pinned at the bottom.
const SHEET_HEIGHT = 440;

type Settings = GroupRalliesFeatureDTO["settings"];

type Props = {
  settings: Settings;
  canEdit: boolean;
  onSave: (settings: Partial<Settings>) => void;
};

export type RallySettingsSheetRef = FeatureSheetRef;

export const RallySettingsSheet = forwardRef<RallySettingsSheetRef, Props>(
  function RallySettingsSheet(props, ref) {
    const { modalRef, commitRef, openKey, present, dismiss, onDismiss } = useFeatureSheet();
    const { height } = useWindowDimensions();
    const sheetHeight = Math.min(SHEET_HEIGHT, Math.round(height * 0.85));

    useImperativeHandle(ref, () => ({ present }), [present]);

    return (
      <Sheet ref={modalRef} snapPoint={sheetHeight} onDismiss={onDismiss}>
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
  const [rallyCount, setRallyCount] = useState(settings.rallyCount);
  // Free-typed while the sheet is open — a half-typed "1" on the way to "14"
  // only has to be valid at commit time, where it's clamped to the server's range.
  const [gapText, setGapText] = useState(String(settings.rallyGapDays));

  // BottomSheetTextInput is a third-party component, so uniwind's className
  // doesn't reach it — style it from the theme variables instead.
  const foreground = useCSSVariable("--color-foreground") as string;
  const border = useCSSVariable("--color-border") as string;
  const card = useCSSVariable("--color-card") as string;

  const commit = () => {
    const parsed = Number.parseInt(gapText, 10);
    const rallyGapDays = Number.isNaN(parsed)
      ? settings.rallyGapDays
      : Math.min(MAX_RALLY_GAP_DAYS, Math.max(0, parsed));

    const patch: Partial<Settings> = {};
    if (rallyCount !== settings.rallyCount) patch.rallyCount = rallyCount;
    if (rallyGapDays !== settings.rallyGapDays) patch.rallyGapDays = rallyGapDays;
    if (Object.keys(patch).length > 0) onSave(patch);
  };
  const markSettled = useCommitOnDismiss(commitRef, commit, canEdit);

  const save = () => {
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
      <FeatureSheetHeader title="Rally Settings" onClose={onClose} />
      <Text variant="muted" className="-mt-2 text-sm">
        How many photo rallies run, and how often a new one starts.
      </Text>

      <View className="grow gap-4">
        <View className="gap-2">
          <Text className="text-foreground">Rallies at once</Text>
          <Segmented
            stretch
            disabled={!canEdit}
            options={COUNT_OPTIONS}
            value={String(rallyCount)}
            onChange={(value) => setRallyCount(Number(value))}
          />
        </View>

        <View className="gap-2">
          <Text className="text-foreground">Break between rallies</Text>
          <View className="flex-row items-center gap-3">
            <BottomSheetTextInput
              value={gapText}
              onChangeText={setGapText}
              editable={canEdit}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={2}
              accessibilityLabel="Days between rallies"
              style={{
                height: 44,
                width: 72,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: border,
                backgroundColor: card,
                color: foreground,
                textAlign: "center",
                fontSize: 16,
                opacity: canEdit ? 1 : 0.5,
              }}
            />
            <Text variant="muted" className="shrink text-sm">
              Days after one ends before the next starts.
            </Text>
          </View>
        </View>

        {canEdit ? null : <ReadOnlyNote />}
      </View>

      <FeatureSheetActions canEdit={canEdit} onClose={cancel} onSave={save} />
    </>
  );
}
