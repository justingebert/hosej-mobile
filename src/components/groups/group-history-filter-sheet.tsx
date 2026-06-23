import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Check } from "lucide-react-native";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type Option = { label: string; value: string };
type MemberOption = Option & { avatarUrl?: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  typeOptions: Option[];
  memberOptions: MemberOption[];
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

      <ScrollView style={{ maxHeight: 380 }} className="grow-0">
        <Text variant="muted" className="mb-2">
          Type
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {typeOptions.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              selected={types.includes(opt.value)}
              onPress={() => toggle(opt.value, setTypes)}
            />
          ))}
        </View>

        <Text variant="muted" className="mb-2 mt-5">
          Submitted by
        </Text>
        {memberOptions.length === 0 ? (
          <Text variant="muted">No members</Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {memberOptions.map((opt) => (
              <MemberChip
                key={opt.value}
                option={opt}
                selected={members.includes(opt.value)}
                onPress={() => toggle(opt.value, setMembers)}
              />
            ))}
          </View>
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

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-1.5 rounded-full border px-3 py-2 active:opacity-70",
        selected ? "border-primary bg-primary" : "border-border bg-background"
      )}
    >
      {selected ? <Icon as={Check} className="size-3.5 text-primary-foreground" /> : null}
      <Text
        className={cn(
          "text-sm font-medium",
          selected ? "text-primary-foreground" : "text-foreground"
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MemberChip({
  option,
  selected,
  onPress,
}: {
  option: MemberOption;
  selected: boolean;
  onPress: () => void;
}) {
  const initial = option.label.slice(0, 1).toUpperCase();
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "max-w-full flex-row items-center gap-2 rounded-full border py-1 pl-1 pr-3 active:opacity-70",
        selected ? "border-primary bg-primary" : "border-border bg-background"
      )}
    >
      <Avatar alt={`${option.label} avatar`} className="size-6">
        {option.avatarUrl ? <AvatarImage source={{ uri: option.avatarUrl }} /> : null}
        <AvatarFallback>
          <Text className="text-[10px] font-extrabold text-foreground">{initial}</Text>
        </AvatarFallback>
      </Avatar>
      <Text
        numberOfLines={1}
        className={cn(
          "shrink text-sm font-medium",
          selected ? "text-primary-foreground" : "text-foreground"
        )}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}
