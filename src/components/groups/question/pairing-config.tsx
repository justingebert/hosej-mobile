import { Pressable, TextInput, View } from "react-native";
import { Plus, Trash } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  PairingKeySource,
  PairingMode,
  type PairingConfig,
} from "@/lib/api/types/question";

// Create-page config for a pairing question: choose where the keys come from
// (group members or custom items), the values to match against, and whether a
// value can be reused (open) or only used once (exclusive).
export function PairingConfigForm({
  pairing,
  memberNames,
  onChange,
}: {
  pairing: PairingConfig;
  memberNames: string[];
  onChange: (pairing: PairingConfig) => void;
}) {
  const isMembers = pairing.keySource === PairingKeySource.Members;
  const isOpen = pairing.mode === PairingMode.Open;

  const setUseMembers = (useMembers: boolean) =>
    onChange({
      ...pairing,
      keySource: useMembers ? PairingKeySource.Members : PairingKeySource.Custom,
      keys: useMembers ? memberNames : ["", ""],
    });

  const setReuse = (reuse: boolean) =>
    onChange({
      ...pairing,
      mode: reuse ? PairingMode.Open : PairingMode.Exclusive,
    });

  return (
    <View className="gap-6">
      <ToggleRow
        label="Use group members"
        checked={isMembers}
        onCheckedChange={setUseMembers}
      />

      <View className="gap-3">
        <Text className="text-sm font-medium text-foreground">Match these</Text>
        {isMembers ? (
          memberNames.length === 0 ? (
            <Text className="text-sm text-muted-foreground">
              No members in this group yet.
            </Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {memberNames.map((name) => (
                <View key={name} className="rounded-full bg-secondary px-3 py-1">
                  <Text className="text-xs text-secondary-foreground">{name}</Text>
                </View>
              ))}
            </View>
          )
        ) : (
          <EditableList
            items={pairing.keys ?? []}
            placeholder="Item"
            onChange={(keys) => onChange({ ...pairing, keys })}
          />
        )}
      </View>

      <View className="gap-3">
        <Text className="text-sm font-medium text-foreground">With these</Text>
        <EditableList
          items={pairing.values}
          placeholder="Choice"
          onChange={(values) => onChange({ ...pairing, values })}
        />
      </View>

      <ToggleRow
        label="Allow reuse"
        description={
          isOpen
            ? "Same choice can match multiple items"
            : "Each choice can only be used once"
        }
        checked={isOpen}
        onCheckedChange={setReuse}
      />
    </View>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onCheckedChange(!checked)}
      className={`flex-row items-center justify-between gap-3 rounded-2xl border px-5 py-3 ${
        checked ? "border-primary bg-primary/10" : "border-border bg-card"
      }`}
      style={{ borderCurve: "continuous" }}
    >
      <View className="flex-1 gap-0.5">
        <Text className="font-semibold text-foreground">{label}</Text>
        {description ? (
          <Text className="text-xs text-muted-foreground">{description}</Text>
        ) : null}
      </View>
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
    </Pressable>
  );
}

// Min of 2 inputs kept on screen so the remove affordance never strands a
// single (invalid) entry — mirrors the custom-options editor.
function EditableList({
  items,
  placeholder,
  onChange,
}: {
  items: string[];
  placeholder: string;
  onChange: (items: string[]) => void;
}) {
  const setItem = (value: string, index: number) =>
    onChange(items.map((item, i) => (i === index ? value : item)));
  const addItem = () => onChange([...items, ""]);
  const removeItem = (index: number) =>
    onChange(items.filter((_, i) => i !== index));
  const canRemove = items.length > 2;
  const lower = placeholder.toLowerCase();

  return (
    <View className="gap-3">
      {items.map((item, index) => (
        <View key={index} className="relative">
          <TextInput
            placeholder={`${placeholder} ${index + 1}`}
            value={item}
            onChangeText={(value) => setItem(value, index)}
            className={`rounded-xl border border-border bg-card py-3 pl-4 text-base text-foreground placeholder:text-muted-foreground ${
              canRemove ? "pr-12" : "pr-4"
            }`}
          />
          {canRemove ? (
            <Pressable
              onPress={() => removeItem(index)}
              hitSlop={8}
              className="absolute bottom-0 right-1 top-0 justify-center px-4"
              accessibilityLabel={`Remove ${lower} ${index + 1}`}
            >
              <Icon as={Trash} className="size-5 text-destructive" />
            </Pressable>
          ) : null}
        </View>
      ))}
      <Button variant="outline" onPress={addItem}>
        <Icon as={Plus} className="size-4" />
        <Text>Add {lower}</Text>
      </Button>
    </View>
  );
}
