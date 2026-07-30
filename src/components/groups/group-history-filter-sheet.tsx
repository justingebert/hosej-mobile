import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Check } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Sheet, type SheetHandle } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";

type Option = { label: string; value: string };
type MemberOption = Option & { avatarUrl?: string };

type Props = {
  typeOptions: Option[];
  memberOptions: MemberOption[];
  selectedTypes: string[];
  selectedMembers: string[];
  onApply: (next: { questionType: string[]; submittedBy: string[] }) => void;
};

const FILTER_SHEET_HEIGHT = 540;

export type GroupHistoryFilterSheetRef = { present: () => void };

export const GroupHistoryFilterSheet = forwardRef<GroupHistoryFilterSheetRef, Props>(
  function GroupHistoryFilterSheet(props, ref) {
  const modalRef = useRef<SheetHandle>(null);
  const [openKey, setOpenKey] = useState(0);
  const { height } = useWindowDimensions();
  const sheetHeight = Math.min(FILTER_SHEET_HEIGHT, Math.round(height * 0.82));

  useImperativeHandle(
    ref,
    () => ({
      present: () => {
        setOpenKey((key) => key + 1);
        modalRef.current?.present();
      },
    }),
    []
  );

  const dismiss = () => modalRef.current?.dismiss();

  return (
    <Sheet ref={modalRef} snapPoint={sheetHeight}>
      <SheetBody key={openKey} onClose={dismiss} {...props} />
    </Sheet>
  );
});

function SheetBody({
  onClose,
  typeOptions,
  memberOptions,
  selectedTypes,
  selectedMembers,
  onApply,
}: Props & { onClose: () => void }) {
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
      <Text variant="large">Filters</Text>

      <BottomSheetScrollView style={{ flex: 1 }}>
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
      </BottomSheetScrollView>

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
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "max-w-full flex-row items-center gap-2 rounded-full border py-1 pl-1 pr-3 active:opacity-70",
        selected ? "border-primary bg-primary" : "border-border bg-background"
      )}
    >
      <UserAvatar name={option.label} avatarUrl={option.avatarUrl} className="size-6" />
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
