import { useState } from "react";
import { useRouter } from "expo-router";
import { TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Segmented } from "@/components/ui/segmented";
import { useCreateGroup } from "@/lib/api/groups";
import { GROUP_LANGUAGES, type GroupLanguage } from "@/lib/api/types/group";

export function CreateGroupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<GroupLanguage>("de");
  const createGroup = useCreateGroup();

  const handleCreate = () => {
    if (!name.trim()) return;
    createGroup.mutate(
      { name: name.trim(), language },
      { onSettled: () => router.back() }
    );
  };

  return (
    <View className="gap-4 bg-background p-5">
      <Text className="text-2xl font-extrabold text-foreground text-center">Create a group</Text>

      <TextInput
        autoFocus
        placeholder="Group name"
        value={name}
        onChangeText={setName}
        className="rounded-xl border border-border bg-card p-4 text-foreground"
      />

      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1 gap-1">
          <Text className="font-bold text-foreground">Starting Question Language</Text>
          <Text className="text-xs text-muted-foreground">
            Only applies to the starting questions and question packs added to the group.
          </Text>
        </View>
        <Segmented
          options={GROUP_LANGUAGES.map((lang) => ({ label: lang.toUpperCase(), value: lang }))}
          value={language}
          onChange={setLanguage}
        />
      </View>

      <Button onPress={handleCreate} disabled={!name.trim() || createGroup.isPending}>
        <Text>{createGroup.isPending ? "Creating..." : "Create"}</Text>
      </Button>
    </View>
  );
}
