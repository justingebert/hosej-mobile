import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Text } from "@/components/ui/text";

type Option = { label: string; value: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  typeOptions: Option[];
  memberOptions: Option[];
  selectedTypes: string[];
  selectedMembers: string[];
  onApply: (next: { questionType: string[]; submittedBy: string[] }) => void;
};

export function GroupHistoryFilterSheet({ visible, onClose, ...rest }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop closes on tap; the sheet is its own Pressable so taps inside
          don't fall through. Body is mounted only while open so its staged
          state re-seeds from the committed filters each time. */}
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="gap-4 rounded-t-3xl bg-background p-5" onPress={() => {}}>
          {visible ? <SheetBody onClose={onClose} {...rest} /> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetBody({
  onClose,
  typeOptions,
  memberOptions,
  selectedTypes,
  selectedMembers,
  onApply,
}: Omit<Props, "visible">) {
  const [types, setTypes] = useState<string[]>(selectedTypes);
  const [members, setMembers] = useState<string[]>(selectedMembers);

  const toggle = (value: string, setList: typeof setTypes) =>
    setList((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const activeCount = types.length + members.length;

  const apply = () => {
    onApply({ questionType: [...types].sort(), submittedBy: [...members].sort() });
    onClose();
  };

  return (
    <>
      <View className="items-center">
        <View className="h-1 w-10 rounded-full bg-muted" />
      </View>
      <Text variant="large">Filters</Text>

      <ScrollView style={{ maxHeight: 360 }} className="grow-0">
        <Text variant="muted" className="mb-1">
          Type
        </Text>
        {typeOptions.map((opt) => (
          <OptionRow
            key={opt.value}
            label={opt.label}
            checked={types.includes(opt.value)}
            onToggle={() => toggle(opt.value, setTypes)}
          />
        ))}

        <Text variant="muted" className="mb-1 mt-4">
          Submitted by
        </Text>
        {memberOptions.length === 0 ? (
          <Text variant="muted">No members</Text>
        ) : (
          memberOptions.map((opt) => (
            <OptionRow
              key={opt.value}
              label={opt.label}
              checked={members.includes(opt.value)}
              onToggle={() => toggle(opt.value, setMembers)}
            />
          ))
        )}
      </ScrollView>
      <View className="flex-row gap-3 pt-1">
        <Button
          variant="outline"
          className="flex-1"
          disabled={activeCount === 0}
          onPress={() => {
            setTypes([]);
            setMembers([]);
          }}
        >
          <Text>Clear</Text>
        </Button>
        <Button className="flex-1" onPress={apply}>
          <Text>Apply{activeCount ? ` (${activeCount})` : ""}</Text>
        </Button>
      </View>
    </>
  );
}

function OptionRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} className="flex-row items-center gap-3 py-2.5 active:opacity-60">
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <Text className="flex-1">{label}</Text>
    </Pressable>
  );
}
