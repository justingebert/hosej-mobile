import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
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
      { onSuccess: () => router.back() }
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

      <View className="flex-row gap-2">
        {GROUP_LANGUAGES.map((lang) => (
          <Pressable
            key={lang}
            onPress={() => setLanguage(lang)}
            className={`rounded-full border border-border px-4 py-2 ${
              language === lang ? "bg-primary" : "bg-card"
            }`}
          >
            <Text className={language === lang ? "text-primary-foreground" : "text-foreground"}>
              {lang.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {createGroup.isError ? (
        <Text className="text-sm text-destructive">{createGroup.error.message}</Text>
      ) : null}

      <Button onPress={handleCreate} disabled={!name.trim() || createGroup.isPending}>
        <Text>{createGroup.isPending ? "Creating..." : "Create"}</Text>
      </Button>
    </View>
  );
}
