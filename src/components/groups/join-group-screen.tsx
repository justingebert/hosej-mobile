import { useState } from "react";
import { useRouter } from "expo-router";
import { TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { extractGroupId, useJoinGroup } from "@/lib/api/groups";

export function JoinGroupScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const joinGroup = useJoinGroup();

  const handleJoin = () => {
    const groupId = extractGroupId(input);
    if (!groupId) return;
    joinGroup.mutate(groupId, { onSuccess: () => router.back() });
  };

  return (
    <View className="flex-1 gap-4 bg-background p-5">
      <Text className="text-2xl font-extrabold text-foreground">Join a group</Text>

      <TextInput
        autoFocus
        autoCapitalize="none"
        placeholder="Group ID or invite link"
        value={input}
        onChangeText={setInput}
        className="rounded-xl border border-border bg-card p-4 text-foreground"
      />

      {joinGroup.isError ? (
        <Text className="text-sm text-destructive">{joinGroup.error.message}</Text>
      ) : null}

      <Button onPress={handleJoin} disabled={!input.trim() || joinGroup.isPending}>
        <Text>{joinGroup.isPending ? "Joining..." : "Join"}</Text>
      </Button>
    </View>
  );
}
