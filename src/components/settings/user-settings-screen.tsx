import { useState } from "react";
import { Alert, Linking, Switch, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { Check, Copy, Trash2 } from "lucide-react-native";
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
import { useDeleteUser, useUpdateUser, useUploadAvatar, useUser } from "@/lib/api/user";
import {
  NOTIFICATION_LANGUAGES,
  NOTIFICATION_STYLES,
  type NotificationPrefs,
  type UserDTO,
} from "@/lib/api/types/user";
import { getErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { isGoogleConfigured, useGoogleSignIn } from "@/lib/auth/google";
import { usePushPermission } from "@/lib/push/hooks";
import { enablePush } from "@/lib/push/push";

export function UserSettingsScreen() {
  const { data: user, isPending, isError, error, isRefetching, refetch } = useUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { deviceId, linkGoogle, signOut } = useAuth();

  const { granted: pushGranted, canAskAgain: pushCanAskAgain, refresh: refreshPush } =
    usePushPermission();
  const [pushBusy, setPushBusy] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [linkGoogleError, setLinkGoogleError] = useState<string | null>(null);

  // What the user has opted into (defaults on). Used only to decide whether to
  // surface the "Allow notifications" prompt below.
  const wantsQuestionNew = user?.notificationPrefs?.questionNew ?? true;
  const wantsJukeboxNew = user?.notificationPrefs?.jukeboxNew ?? true;
  const wantsRallyNew = user?.notificationPrefs?.rallyNew ?? true;
  const wantsChatMessage = user?.notificationPrefs?.chatMessage ?? true;
  const wantsAny =
    wantsQuestionNew || wantsJukeboxNew || wantsRallyNew || wantsChatMessage;

  // OS permission gates *delivery*, so show the toggles as off until it's
  // granted — an "on" switch that delivers nothing is misleading. Flipping one
  // on while ungranted still chases OS permission (see togglePrefs).
  const questionNew = pushGranted && wantsQuestionNew;
  const jukeboxNew = pushGranted && wantsJukeboxNew;
  const rallyNew = pushGranted && wantsRallyNew;
  const chatMessage = pushGranted && wantsChatMessage;
  const anyPushOn = questionNew || jukeboxNew || rallyNew || chatMessage;

  // OS permission only gates *delivery* — it can be granted from here but never
  // revoked (iOS routes that to Settings). Best-effort: simulators and builds
  // without the push entitlement can't register, which is fine — the prefs still
  // apply once a real build is installed.
  const ensureDelivery = async () => {
    setPushBusy(true);
    try {
      await enablePush();
    } catch (e) {
      console.warn("[push] enable failed", e);
    } finally {
      setPushBusy(false);
      void refreshPush();
    }
  };

  // The toggles are in-app prefs, so flip immediately; only chase OS permission
  // (in the background) when switching something on without it.
  const togglePrefs = (prefs: Partial<NotificationPrefs>) => {
    updateUser.mutate({ notificationPrefs: prefs });
    if (!pushGranted && Object.values(prefs).some(Boolean)) void ensureDelivery();
  };

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

  const confirmDeleteAccount = () =>
    Alert.alert(
      "Delete account",
      "This permanently deletes your account and removes you from your groups. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteUser.mutate(undefined, {
              onSuccess: () => void signOut(),
            }),
        },
      ],
    );

  const confirmLogOut = () => {
    if (!deviceId) {
      void signOut();
      return;
    }

    Alert.alert(
      "Log out?",
      "Your Device ID is the only way back into this account. Make sure you have copied or noted it before logging out.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: () => void signOut(),
        },
      ],
    );
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

            <SettingsGroup title="Push Notification Preferences">
              <SettingsRow label="Notifications">
                <Switch
                  value={anyPushOn}
                  disabled={pushBusy}
                  onValueChange={(value) =>
                    togglePrefs({
                      questionNew: value,
                      jukeboxNew: value,
                      rallyNew: value,
                      chatMessage: value,
                    })
                  }
                />
              </SettingsRow>
              <SettingsRow label="New questions" className="pl-8">
                <Switch
                  value={questionNew}
                  disabled={pushBusy}
                  onValueChange={(value) => togglePrefs({ questionNew: value })}
                />
              </SettingsRow>
              <SettingsRow label="New jukebox" className="pl-8">
                <Switch
                  value={jukeboxNew}
                  disabled={pushBusy}
                  onValueChange={(value) => togglePrefs({ jukeboxNew: value })}
                />
              </SettingsRow>
              <SettingsRow label="New rallies" className="pl-8">
                <Switch
                  value={rallyNew}
                  disabled={pushBusy}
                  onValueChange={(value) => togglePrefs({ rallyNew: value })}
                />
              </SettingsRow>
              <SettingsRow label="Chat messages" className="pl-8">
                <Switch
                  value={chatMessage}
                  disabled={pushBusy}
                  onValueChange={(value) => togglePrefs({ chatMessage: value })}
                />
              </SettingsRow>
              {wantsAny && !pushGranted ? (
                <SettingsRow
                  label={pushCanAskAgain ? "Allow notifications" : "Turned off in iOS Settings"}
                  description={
                    pushCanAskAgain
                      ? "Notifications are paused until you allow them."
                      : "Turn on notifications for HoseJ in Settings to receive these."
                  }
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pushBusy}
                    onPress={() =>
                      pushCanAskAgain ? void ensureDelivery() : void Linking.openSettings()
                    }
                  >
                    <Text>{pushCanAskAgain ? "Allow" : "Open Settings"}</Text>
                  </Button>
                </SettingsRow>
              ) : null}
              <SettingsRow label="Notification Language">
                <Segmented
                  options={NOTIFICATION_LANGUAGES.map((lang) => ({
                    label: lang.toUpperCase(),
                    value: lang,
                  }))}
                  value={user.notificationLanguage}
                  onChange={(value) => updateUser.mutate({ notificationLanguage: value })}
                />
              </SettingsRow>
              <SettingsRow label="Notification Style">
                <Segmented
                  options={NOTIFICATION_STYLES.map((style) => ({ label: style, value: style }))}
                  value={user.notificationStyle}
                  onChange={(value) => updateUser.mutate({ notificationStyle: value })}
                />
              </SettingsRow>
            </SettingsGroup>

          </View>

          <View className="gap-3">
            <ReportBugButton variant="outline" />
            <Button
              variant="destructive"
              onPress={confirmDeleteAccount}
              disabled={deleteUser.isPending}
            >
              <Icon as={Trash2} className="size-4" />
              <Text>{deleteUser.isPending ? "Deleting…" : "Delete account"}</Text>
            </Button>
            <Button variant="destructive" onPress={confirmLogOut}>
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
