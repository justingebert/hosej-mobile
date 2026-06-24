import { useState } from "react";
import { Switch, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { Check, Copy } from "lucide-react-native";
import { AvatarPicker } from "@/components/ui/avatar-picker";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Segmented } from "@/components/ui/segmented";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsGroup, SettingsRow } from "@/components/settings/settings-group";
import { ReportBugButton } from "@/components/help/report-bug-button";
import { useUpdateUser, useUploadAvatar, useUser } from "@/lib/api/user";
import {
  NOTIFICATION_LANGUAGES,
  NOTIFICATION_STYLES,
  type UserDTO,
} from "@/lib/api/types/user";
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
        <View className="flex-1 justify-between gap-8">
          <View className="gap-6">
            <SettingsGroup title="Preferences">
              <SettingsRow label="Push notifications">
                <Switch
                  value={notificationsEnabled}
                  // TODO: implement push registration; this does nothing yet.
                  onValueChange={setNotificationsEnabled}
                />
              </SettingsRow>
              <SettingsRow label="Language">
                <Segmented
                  options={NOTIFICATION_LANGUAGES.map((lang) => ({
                    label: lang.toUpperCase(),
                    value: lang,
                  }))}
                  value={user.notificationLanguage}
                  onChange={(value) => updateUser.mutate({ notificationLanguage: value })}
                />
              </SettingsRow>
              <SettingsRow label="Style">
                <Segmented
                  options={NOTIFICATION_STYLES.map((style) => ({ label: style, value: style }))}
                  value={user.notificationStyle}
                  onChange={(value) => updateUser.mutate({ notificationStyle: value })}
                />
              </SettingsRow>
            </SettingsGroup>

            <SettingsGroup title="Profile">
              <AvatarField user={user} />
              <SettingsRow label="Name">
                <Text className="text-muted-foreground">{user.username}</Text>
              </SettingsRow>
              <SettingsRow label="Joined">
                <Text className="text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </SettingsRow>
              {deviceId ? (
                <SettingsRow label="Device ID">
                  <DeviceIdValue deviceId={deviceId} />
                </SettingsRow>
              ) : null}
            </SettingsGroup>

            <SettingsGroup title="Connections">
              <SettingsRow
                label="Google"
                description={user.googleConnected ? "Connected" : "Sign in across devices"}
              >
                {user.googleConnected ? (
                  <Icon as={Check} className="size-5 text-success" />
                ) : isGoogleConfigured ? (
                  <GoogleLinkButton
                    isBusy={isLinkingGoogle}
                    onIdToken={(getIdToken) => void runGoogleLink(getIdToken)}
                  />
                ) : (
                  <Text className="text-xs text-muted-foreground">Unavailable</Text>
                )}
              </SettingsRow>
            </SettingsGroup>
            {linkGoogleError ? (
              <Text className="px-1 text-sm text-destructive">{linkGoogleError}</Text>
            ) : null}
          </View>

          <View className="gap-3">
            <ReportBugButton variant="outline" />
            <Button variant="destructive" onPress={() => signOut()}>
              <Text>Log out</Text>
            </Button>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function AvatarField({ user }: { user: UserDTO }) {
  const uploadAvatar = useUploadAvatar();
  const updateUser = useUpdateUser();
  const busy = uploadAvatar.isPending || updateUser.isPending;
  const initial = (user.username || "?").slice(0, 1).toUpperCase();

  return (
    <View className="items-center py-5">
      <AvatarPicker
        imageUri={user.avatarUrl}
        initial={initial}
        busy={busy}
        alt={`${user.username}'s profile photo`}
        onPick={(asset) => uploadAvatar.mutate(asset)}
        onRemove={() => updateUser.mutate({ avatar: null })}
      />
    </View>
  );
}

function DeviceIdValue({ deviceId }: { deviceId: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await Clipboard.setStringAsync(deviceId);
    setCopied(true);
    Toast.show({ type: "success", text1: "Device ID copied" });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View className="flex-row items-center gap-1">
      <Text numberOfLines={1} className="max-w-[150px] text-muted-foreground">
        {deviceId}
      </Text>
      <Button variant="ghost" size="icon" className="size-8" onPress={onCopy}>
        <Icon as={copied ? Check : Copy} className="size-4" />
      </Button>
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
      size="sm"
      disabled={!ready || isBusy}
      onPress={() => onIdToken(promptForIdToken)}
    >
      <Text>{isBusy ? "Connecting…" : "Connect"}</Text>
    </Button>
  );
}

function SettingsSkeleton() {
  return (
    <View className="gap-6">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </View>
  );
}
