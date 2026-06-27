import { type Href, Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useInvitePreview, useJoinByCode } from "@/lib/api/groups";
import { useAuth } from "@/lib/auth/auth-context";
import { setPendingInvite } from "@/lib/auth/session";

// Invite landing reached via the deep link (hosejmobile://join/<code> or the Universal
// Link https://www.hosej.app/join/<code>). Registered outside the auth guards so it opens
// for new users. Logged-out users are sent straight to the invite-aware login (one fewer
// screen — the group is shown there); already-signed-in users get a preview + explicit Join.
export default function JoinByCodeScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { status, needsNameSetup } = useAuth();
  const preview = useInvitePreview(code ?? "");
  const join = useJoinByCode();

  // Redirect only on "unauthed", never while "loading" (the root navigator already gates
  // the whole stack on auth, so this screen mounts with status resolved — the check is
  // belt-and-suspenders). Stash the code first so login can show the group and the
  // post-auth resume can join; the preview fetch kicked off above warms login's cache.
  if (status === "unauthed") {
    if (code) setPendingInvite(code);
    return <Redirect href="/login" />;
  }
  if (status === "loading") return null;

  // Authed but hasn't named themselves yet (e.g. created a device account and bailed on
  // setup-name). Stash the code and send them through name setup first, otherwise they'd
  // join the group still called "New user". root-navigator's resume authority performs the
  // join once name setup completes — the same path the logged-out flow uses.
  if (needsNameSetup) {
    if (code) setPendingInvite(code);
    return <Redirect href="/setup-name" />;
  }

  const onPressJoin = () => {
    if (!code) return;
    join.mutate(code, {
      onSuccess: ({ group }) => router.replace(`/groups/${group._id}/dashboard` as Href),
    });
  };

  return (
    <Screen contentContainerClassName="grow justify-center gap-10 px-6">
      {preview.isPending ? (
        <JoinPreviewSkeleton />
      ) : preview.isError ? (
        <ErrorCard
          title="Invite not found"
          error={preview.error}
          onRetry={preview.refetch}
          isRetrying={preview.isRefetching}
        />
      ) : (
        <View className="items-center gap-10">
          <View className="items-center gap-1">
            <Text className="text-muted-foreground">You&apos;ve been invited to join</Text>
            <Text className="text-center text-3xl font-extrabold text-foreground">
              {preview.data.name}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {preview.data.memberCount} member{preview.data.memberCount === 1 ? "" : "s"}
            </Text>
          </View>

          <View className="w-full gap-3">
            {join.isError ? (
              <Text className="text-center text-sm text-destructive">{join.error.message}</Text>
            ) : null}
            <Button className="w-full" onPress={onPressJoin} disabled={join.isPending}>
              <Text>{join.isPending ? "Joining…" : "Join"}</Text>
            </Button>
          </View>
        </View>
      )}
    </Screen>
  );
}

function JoinPreviewSkeleton() {
  return (
    <View className="items-center gap-10">
      <View className="items-center gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-24" />
      </View>
      <Skeleton className="h-12 w-full rounded-xl" />
    </View>
  );
}
