import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { AvatarPicker } from "@/components/ui/avatar-picker";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { getErrorMessage } from "@/lib/api/client";
import { useUpdateUser, useUploadAvatar, type PickedAvatar } from "@/lib/api/user";
import { useAuth } from "@/lib/auth/auth-context";
import { toastError } from "@/lib/toast";

export default function SetupNameScreen() {
  const router = useRouter();
  const { completeNameSetup, needsNameSetup, user } = useAuth();
  const updateUser = useUpdateUser();
  const uploadAvatar = useUploadAvatar();
  const [username, setUsername] = useState(
    user?.username === "New user" ? "" : (user?.username ?? "")
  );
  const [avatar, setAvatar] = useState<PickedAvatar | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saving = updateUser.isPending || uploadAvatar.isPending;

  useEffect(() => {
    if (!needsNameSetup) router.replace("/");
  }, [needsNameSetup, router]);

  const submit = async () => {
    const nextUsername = username.trim();
    if (!nextUsername) return;

    setError(null);
    try {
      // Name is the required step; the avatar is best-effort on top of it.
      const updatedUser = await updateUser.mutateAsync({ username: nextUsername });
      if (avatar) {
        try {
          await uploadAvatar.mutateAsync(avatar);
        } catch {
          toastError("Could not set photo", "You can add it later in Settings.");
        }
      }
      completeNameSetup(updatedUser.username);
      router.replace("/");
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (!needsNameSetup) {
    return null;
  }

  const initial = (username || "?").slice(0, 1).toUpperCase();

  return (
    <Screen contentContainerClassName="grow justify-center gap-8 p-6">
      <View className="items-center gap-2">
        <Text variant="h2" className="text-center">
          Choose a name!
        </Text>
      </View>

      <AvatarPicker
        className="size-28"
        imageUri={avatar?.uri}
        initial={initial}
        busy={saving}
        onPick={setAvatar}
        onRemove={() => setAvatar(null)}
      />

      <View className="gap-3">
        <TextInput
          autoCapitalize="words"
          placeholder="What do your friends call you?"
          value={username}
          onChangeText={setUsername}
          className="rounded-xl border border-border bg-card p-4 text-center text-foreground"
        />
        {error ? <Text className="text-center text-sm text-destructive">{error}</Text> : null}
        <Button disabled={!username.trim() || saving} onPress={() => void submit()}>
          <Text>{saving ? "Saving..." : "Continue"}</Text>
        </Button>
      </View>
    </Screen>
  );
}
