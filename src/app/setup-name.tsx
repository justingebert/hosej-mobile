import { useEffect, useState } from "react";
import { TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { getErrorMessage } from "@/lib/api/client";
import { useUpdateUser } from "@/lib/api/user";
import { useAuth } from "@/lib/auth/auth-context";

export default function SetupNameScreen() {
  const router = useRouter();
  const { completeNameSetup, needsNameSetup, user } = useAuth();
  const updateUser = useUpdateUser();
  const [username, setUsername] = useState(
    user?.username === "New user" ? "" : (user?.username ?? "")
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!needsNameSetup) router.replace("/");
  }, [needsNameSetup, router]);

  const submit = async () => {
    const nextUsername = username.trim();
    if (!nextUsername) return;

    setError(null);
    try {
      const updatedUser = await updateUser.mutateAsync({ username: nextUsername });
      completeNameSetup(updatedUser.username);
      router.replace("/");
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (!needsNameSetup) {
    return null;
  }

  return (
    <Screen contentContainerClassName="grow justify-center gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose a display name</CardTitle>
          <CardDescription>This is shown to your groups.</CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          <TextInput
            autoCapitalize="words"
            placeholder="Display name"
            value={username}
            onChangeText={setUsername}
            className="rounded-xl border border-border bg-card p-4 text-foreground"
          />
          {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
          <Button disabled={!username.trim() || updateUser.isPending} onPress={() => void submit()}>
            <Text>{updateUser.isPending ? "Saving..." : "Continue"}</Text>
          </Button>
        </CardContent>
      </Card>
    </Screen>
  );
}
