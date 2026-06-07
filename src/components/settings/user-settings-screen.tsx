import { useState } from "react";
import { Image } from "expo-image";
import { Pressable, Switch, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useUpdateUser, useUser } from "@/lib/api/user";
import { NOTIFICATION_LANGUAGES, NOTIFICATION_STYLES } from "@/lib/api/types/user";
import { ErrorCard } from "@/components/ui/error-card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";

export function UserSettingsScreen() {
  const { data: user, isPending, isError, error, isRefetching, refetch } = useUser();
  const updateUser = useUpdateUser();

  // Cosmetic only for now — TODO: implement push registration / persistence.
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

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
          </View>

          {/* Logout — placeholder, auth not wired yet */}
          <Button variant="outline">
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
