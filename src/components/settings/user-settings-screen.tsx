import { useState } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useUpdateUser, useUser } from "@/lib/api/user";
import { NOTIFICATION_LANGUAGES, NOTIFICATION_STYLES } from "@/lib/api/types/user";

export function UserSettingsScreen() {
  const router = useRouter();
  const { data: user, isError, error, refetch } = useUser();
  const updateUser = useUpdateUser();

  // Cosmetic only for now — TODO: implement push registration / persistence.
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow gap-6 p-5"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => router.back()}>
          <Text className="text-foreground">Back</Text>
        </Pressable>
        <Text className="text-2xl font-extrabold text-foreground">Settings</Text>
        <View className="w-10" />
      </View>

      {isError ? (
        <View className="gap-2">
          <Text className="text-destructive">{error?.message}</Text>
          <Pressable onPress={() => refetch()}>
            <Text className="text-foreground">Try again</Text>
          </Pressable>
        </View>
      ) : !user ? (
        <Text className="text-muted-foreground">Loading...</Text>
      ) : (
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

            <View className="gap-2">
              <Text className="font-bold text-foreground">Notification Language</Text>
              <Segmented
                options={NOTIFICATION_LANGUAGES.map((lang) => ({
                  label: lang.toUpperCase(),
                  value: lang,
                }))}
                value={user.notificationLanguage}
                onChange={(value) => updateUser.mutate({ notificationLanguage: value })}
              />
            </View>

            <View className="gap-2">
              <Text className="font-bold text-foreground">Notification Style</Text>
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
              {user.deviceId ? <InfoRow label="Device ID" value={user.deviceId} /> : null}
            </View>
          </View>0

          {/* Logout — placeholder, auth not wired yet */}
          <Pressable className="rounded-full border border-border px-4 py-3">
            <Text className="text-center font-bold text-foreground">Log out</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row rounded-lg border border-border bg-muted p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={
              active
                ? "flex-1 items-center rounded-md bg-card py-2"
                : "flex-1 items-center rounded-md py-2"
            }
          >
            <Text className={active ? "font-bold text-foreground" : "text-muted-foreground"}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
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
