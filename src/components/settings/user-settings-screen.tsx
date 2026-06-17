import { useState } from "react";
import { Image } from "expo-image";
import { Switch, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Segmented } from "@/components/ui/segmented";
import { useUpdateUser, useUser } from "@/lib/api/user";
import { NOTIFICATION_LANGUAGES, NOTIFICATION_STYLES } from "@/lib/api/types/user";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { isGoogleConfigured, useGoogleSignIn } from "@/lib/auth/google";

export function UserSettingsScreen() {
  const { data: user, isPending, isError, error, isRefetching, refetch } = useUser();
  const updateUser = useUpdateUser();
  const { deviceId, linkGoogle, signOut } = useAuth();

  // Cosmetic only for now — TODO: implement push registration / persistence.
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [linkGoogleError, setLinkGoogleError] = useState<string | null>(null);

  const runGoogleLink = async (getIdToken: () => Promise<string | null>) => {
    setLinkGoogleError(null);
    setIsLinkingGoogle(true);
    try {
      const idToken = await getIdToken();
      if (idToken) await linkGoogle(idToken);
    } catch (e) {
      setLinkGoogleError(getErrorMessage(e));
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      {isPending ? (
        <SettingsSkeleton />
      ) : isError ? (
        <ErrorCard
          title="Could not load settings"
          error={error}
          onRetry={refetch}
          isRetrying={isRefetching}
        />
      ) : user ? (
        <View className="gap-8">
          <View className="gap-4">
            <Text className="text-lg font-bold text-foreground">Preferences</Text>

            <View className="flex-row items-center justify-between">
              <Text className="text-foreground">Push notifications</Text>
              <Switch
                value={notificationsEnabled}
                // TODO: implement push registration; this does nothing yet.
                onValueChange={setNotificationsEnabled}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-foreground">Notification Language</Text>
              <Segmented
                options={NOTIFICATION_LANGUAGES.map((lang) => ({
                  label: lang.toUpperCase(),
                  value: lang,
                }))}
                value={user.notificationLanguage}
                onChange={(value) => updateUser.mutate({ notificationLanguage: value })}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-foreground">Notification Style</Text>
              <Segmented
                options={NOTIFICATION_STYLES.map((style) => ({ label: style, value: style }))}
                value={user.notificationStyle}
                onChange={(value) => updateUser.mutate({ notificationStyle: value })}
              />
            </View>
          </View>

          <View className="gap-4">
            <Text className="text-lg font-bold text-foreground">Profile</Text>

            <View className="flex-row items-center gap-4">
              {user.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 56, height: 56, borderRadius: 28 }}
                />
              ) : (
                <View className="h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Text className="text-xl font-bold text-foreground">
                    {(user.username || "?").slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}

              <Text className="flex-1 text-lg font-bold text-foreground">{user.username}</Text>
            </View>

            <View className="gap-1">
              <InfoRow label="User ID" value={user._id} />
              <InfoRow label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
              {deviceId ? <InfoRow label="Device ID" value={deviceId} /> : null}
            </View>

            {deviceId && !user.googleConnected ? (
              <View className="gap-2">
                {isGoogleConfigured ? (
                  <GoogleLinkButton
                    isBusy={isLinkingGoogle}
                    onIdToken={(getIdToken) => void runGoogleLink(getIdToken)}
                  />
                ) : (
                  <Button variant="secondary" disabled>
                    <Text>Connect Google</Text>
                  </Button>
                )}
                {linkGoogleError ? (
                  <Text className="text-sm text-destructive">{linkGoogleError}</Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <Button variant="outline" onPress={() => signOut()}>
            <Text>Log out</Text>
          </Button>
        </View>
      ) : null}
    </Screen>
  );
}

function SettingsSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-border py-2">
      <Text className="text-muted-foreground">{label}</Text>
      <Text numberOfLines={1} className="flex-1 text-right text-foreground">
        {value}
      </Text>
    </View>
  );
}

function GoogleLinkButton({
  isBusy,
  onIdToken,
}: {
  isBusy: boolean;
  onIdToken: (getIdToken: () => Promise<string | null>) => void;
}) {
  const { promptForIdToken, ready } = useGoogleSignIn();

  return (
    <Button
      variant="secondary"
      disabled={!ready || isBusy}
      onPress={() => onIdToken(promptForIdToken)}
    >
      <Text>{isBusy ? "Connecting..." : "Connect Google"}</Text>
    </Button>
  );
}
