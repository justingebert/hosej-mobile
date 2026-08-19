import { forwardRef, useImperativeHandle, useState } from "react";
import { Alert, View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAddQuestionPack, useGroupPacks } from "@/lib/api/groups";
import type { GroupQuestionPackDTO, GroupQuestionsFeatureDTO } from "@/lib/api/types/group";

type Settings = GroupQuestionsFeatureDTO["settings"];

type Props = {
  groupId: string;
  settings: Settings;
  canEdit: boolean;
  onSave: (settings: Partial<Settings>) => void;
};

export type QuestionSettingsSheetRef = FeatureSheetRef;

export const QuestionSettingsSheet = forwardRef<QuestionSettingsSheetRef, Props>(
  function QuestionSettingsSheet(props, ref) {
    const { modalRef, commitRef, openKey, present, dismiss, onDismiss } = useFeatureSheet();

    useImperativeHandle(ref, () => ({ present }), [present]);

    return (
      // Questions per day + the pack catalogue fill the screen, so this one
      // runs full-height and scrolls inside.
      <Sheet ref={modalRef} fullHeight onDismiss={onDismiss}>
        <SheetBody key={openKey} commitRef={commitRef} onClose={dismiss} {...props} />
      </Sheet>
    );
  }
);

function SheetBody({
  groupId,
  settings,
  canEdit,
  onSave,
  onClose,
  commitRef,
}: Props & { onClose: () => void; commitRef: CommitRef }) {
  const [questionCount, setQuestionCount] = useState(settings.questionCount);

  const commit = () => {
    if (questionCount !== settings.questionCount) onSave({ questionCount });
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
      <FeatureSheetHeader title="Question Settings" onClose={onClose} />

      <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8 }}>
        <Text className="text-foreground">Questions per day</Text>
        <Segmented
          stretch
          disabled={!canEdit}
          options={COUNT_OPTIONS}
          value={String(questionCount)}
          onChange={(value) => setQuestionCount(Number(value))}
        />

        <Text className="pt-4 text-foreground">Question packs</Text>
        <Text variant="muted" className="text-sm">
          Ready-made questions that top up the pool when members haven&apos;t written enough of
          their own.
        </Text>

        <PackList groupId={groupId} canEdit={canEdit} />

        {canEdit ? null : <ReadOnlyNote />}
      </BottomSheetScrollView>

      <FeatureSheetActions canEdit={canEdit} onClose={cancel} onSave={save} />
    </>
  );
}

/**
 * Tier 2 region: the sheet around it is valid without the catalogue, so a
 * failure here is an inline retry, never an ErrorCard.
 */
function PackList({ groupId, canEdit }: { groupId: string; canEdit: boolean }) {
  const { data, isPending, isError, refetch } = useGroupPacks(groupId);
  const addPack = useAddQuestionPack(groupId);

  // Adding creates a Question per template server-side and there is no
  // remove-pack endpoint, so it's confirmed rather than fired on the tap.
  const confirmAdd = (pack: GroupQuestionPackDTO) =>
    Alert.alert(
      `Add "${pack.name}"?`,
      `This adds ${pack.questionCount} questions to your group's pool. It can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Add", onPress: () => addPack.mutate(pack.packId) },
      ]
    );

  if (isPending) {
    return (
      <View className="gap-2 pt-1">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <Button variant="link" size="sm" className="self-start" onPress={() => refetch()}>
        <Text>Couldn&apos;t load packs · Try again</Text>
      </Button>
    );
  }

  const packs = data ?? [];
  if (packs.length === 0) {
    return (
      <Text variant="muted" className="text-sm">
        No packs available for this group.
      </Text>
    );
  }

  return (
    <View className="gap-2 pt-1">
      {packs.map((pack) => (
        <View
          key={pack.packId}
          className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3"
        >
          <View className="flex-1 gap-0.5">
            <Text numberOfLines={1} className="font-medium text-foreground">
              {pack.name}
            </Text>
            {pack.description ? (
              <Text numberOfLines={2} className="text-xs text-muted-foreground">
                {pack.description}
              </Text>
            ) : null}
            <Text className="text-xs text-muted-foreground">
              {pack.questionCount} questions
            </Text>
          </View>
          {pack.added ? (
            <Badge variant="secondary">
              <Text>Added</Text>
            </Badge>
          ) : canEdit ? (
            <Button
              variant="outline"
              size="sm"
              disabled={addPack.isPending}
              onPress={() => confirmAdd(pack)}
            >
              <Text>{addPack.isPending && addPack.variables === pack.packId ? "Adding…" : "Add"}</Text>
            </Button>
          ) : null}
        </View>
      ))}
    </View>
  );
}
