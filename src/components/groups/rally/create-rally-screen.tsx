import { useState } from "react";
import { TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Text } from "@/components/ui/text";
import { useCreateRally } from "@/lib/api/rally";
import { useGroupId } from "@/lib/group-id";
import { toastSuccess } from "@/lib/toast";
import {
  DEFAULT_RALLY_LENGTH_DAYS,
  MAX_RALLY_TASK_LENGTH,
  RALLY_LENGTH_OPTIONS,
} from "@/lib/api/types/rally";

const LENGTH_OPTIONS = RALLY_LENGTH_OPTIONS.map((days) => ({
  label: String(days),
  value: String(days),
}));

export function CreateRallyScreen() {
  const groupId = useGroupId();
  const createRally = useCreateRally(groupId);
  const [task, setTask] = useState("");
  const [length, setLength] = useState(String(DEFAULT_RALLY_LENGTH_DAYS));

  const trimmedTask = task.trim();
  const canSubmit = !!groupId && trimmedTask.length > 0 && !createRally.isPending;

  const handleSubmit = () => {
    createRally.mutate(
      { task: trimmedTask, lengthInDays: Number(length) },
      {
        onSuccess: () => {
          setTask("");
          setLength(String(DEFAULT_RALLY_LENGTH_DAYS));
          toastSuccess("Rally created", "Added to the pool");
        },
      }
    );
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerClassName="gap-6 px-4 pt-4 pb-4"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
    >
      <View className="gap-3">
        <Text className="text-2xl font-extrabold text-foreground">Create a new rally</Text>
        <Text variant="muted" className="text-sm">
          Set a task or a setting for everyone to submit photos.
        </Text>

        <TextInput
          multiline
          maxLength={MAX_RALLY_TASK_LENGTH}
          placeholder="Submit a photo of…"
          value={task}
          onChangeText={setTask}
          className="min-h-24 rounded-xl bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground"
          style={{ textAlignVertical: "top" }}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Time to submit (days)</Text>
        <Segmented options={LENGTH_OPTIONS} value={length} onChange={setLength} stretch />
        <Text variant="muted" className="text-xs">
          Everyone gets about {length} days to submit a photo.
        </Text>
      </View>

      <Button onPress={handleSubmit} disabled={!canSubmit}>
        <Text>{createRally.isPending ? "Creating…" : "Create rally"}</Text>
      </Button>
    </KeyboardAwareScrollView>
  );
}
