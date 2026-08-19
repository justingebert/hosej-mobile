import { useRef } from "react";
import { useRouter } from "expo-router";
import { useGroupId } from "@/lib/group-id";
import {
  Camera,
  ChevronRight,
  DoorOpen,
  Flag,
  type LucideIcon,
  MessageSquare, MessageSquareWarning,
  Radio,
  RefreshCw,
  Share,
  Trash,
  UserRoundMinus,
} from "lucide-react-native";
import { Alert, Platform, Share as RNShare, View } from "react-native";

import { SettingsGroup, SettingsRow } from "@/components/settings/settings-group";
import { Button } from "@/components/ui/button";
import { ErrorCard } from "@/components/ui/error-card";
import { HapticPressable } from "@/components/ui/haptic-pressable";
import { Icon } from "@/components/ui/icon";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  JukeboxSettingsSheet,
  type JukeboxSettingsSheetRef,
} from "@/components/groups/jukebox-settings-sheet";
import {
  QuestionSettingsSheet,
  type QuestionSettingsSheetRef,
} from "@/components/groups/question-settings-sheet";
import {
  RallySettingsSheet,
  type RallySettingsSheetRef,
} from "@/components/groups/rally-settings-sheet";
import {
  buildInviteLink,
  useDeleteGroup,
  useGroup,
  useGroupInvite,
  useLeaveGroup,
  useRemoveMember,
  useResetInvite,
  useUpdateGroup,
} from "@/lib/api/groups";
import type {
  GroupFeaturesDTO,
  GroupFeaturesPatch,
  GroupMemberDTO,
  GroupWithAdminDTO,
} from "@/lib/api/types/group";
import { useUser } from "@/lib/api/user";
import { useReportAction } from "@/lib/moderation";
import { toastSuccess } from "@/lib/toast";

export function GroupSettingsScreen() {
  const groupId = useGroupId();
  const { data: group, error, isError, isPending, isRefetching, refetch } = useGroup(groupId);
  const { data: user } = useUser();

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching} avoidKeyboard>
      {isPending ? (
        <SettingsSkeleton />
      ) : isError ? (
        <ErrorCard
          title="Could not load settings"
          error={error}
          onRetry={refetch}
          isRetrying={isRefetching}
        />
      ) : group ? (
        <GroupSettingsContent group={group} currentUserId={user?._id} />
      ) : null}
    </Screen>
  );
}

function GroupSettingsContent({
  group,
  currentUserId,
}: {
  group: GroupWithAdminDTO;
  currentUserId?: string;
}) {
  const router = useRouter();
  const updateGroup = useUpdateGroup(group._id);
  const removeMember = useRemoveMember(group._id);
  const reportContent = useReportAction();
  const leaveGroup = useLeaveGroup(group._id);
  const deleteGroup = useDeleteGroup(group._id);
  const { data: invite } = useGroupInvite(group._id);
  const resetInvite = useResetInvite(group._id);

  const questionSheet = useRef<QuestionSettingsSheetRef>(null);
  const rallySheet = useRef<RallySettingsSheetRef>(null);
  const jukeboxSheet = useRef<JukeboxSettingsSheetRef>(null);

  const { userIsAdmin, members } = group;
  const yourName = members.find((m) => m.user === currentUserId)?.name ?? "You";
  const adminName = members.find((m) => m.user === group.admin)?.name ?? "N/A";
  const { questions, rallies, jukebox } = group.features;

  // Only the keys that changed — the server merges per settings key, so
  // spreading the whole feature in would write back stale siblings (see
  // useUpdateGroup). `packs` especially: its own endpoint owns it.
  const saveFeature = <K extends keyof GroupFeaturesDTO>(
    key: K,
    settings: Partial<GroupFeaturesDTO[K]["settings"]>
  ) => updateGroup.mutate({ features: { [key]: { settings } } as GroupFeaturesPatch });

  const shareInvite = async () => {
    if (!invite?.code) return;
    const link = buildInviteLink(invite.code);
    const message = `Join my group "${group.name}" on HoseJ!`;
    try {
      await RNShare.share(
        Platform.OS === "ios"
          ? { title: message, url: link, message }
          : { title: message, message: `${message}\n${link}` },
      );
    } catch {
      // Share sheet dismissed — nothing to do.
    }
  };

  const confirmResetInvite = () =>
    Alert.alert(
      "Reset invite link",
      "The current link stops working. You'll need to share the new one.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () =>
            resetInvite.mutate(undefined, { onSuccess: () => toastSuccess("Invite link reset") }),
        },
      ],
    );

  const confirmKick = (member: GroupMemberDTO) =>
    Alert.alert("Remove member", `Remove ${member.name} from the group?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          removeMember.mutate(member.user, { onSuccess: () => toastSuccess("Member removed") }),
      },
    ]);

  const confirmLeave = () =>
    Alert.alert("Leave group", "You will lose access to this group.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () =>
          currentUserId &&
          leaveGroup.mutate(currentUserId, {
            onSuccess: () => {
              toastSuccess("You left the group");
              router.replace("/");
            },
          }),
      },
    ]);

  const confirmDelete = () =>
    Alert.alert("Delete group", `Permanently delete "${group.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteGroup.mutate(undefined, {
            onSuccess: () => {
              toastSuccess("Group deleted");
              router.replace("/");
            },
          }),
      },
    ]);

  return (
    <View className="flex-1 justify-between gap-8">
      <View className="gap-6">
        <SettingsGroup title="Group">
          <SettingsRow label="Your name">
            <Text className="text-muted-foreground">{yourName}</Text>
          </SettingsRow>
          <SettingsRow label="Admin">
            <Text className="text-muted-foreground">{adminName}</Text>
          </SettingsRow>
          <SettingsRow label="Created">
            <Text className="text-muted-foreground">
              {new Date(group.createdAt).toLocaleDateString()}
            </Text>
          </SettingsRow>
          <SettingsRow label="Invite">
            <View className="flex-row items-center gap-2">
              {userIsAdmin ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={confirmResetInvite}
                  disabled={resetInvite.isPending}
                  accessibilityLabel="Reset invite link"
                >
                  <Icon as={RefreshCw} className="size-4" />
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onPress={shareInvite} disabled={!invite?.code}>
                <Icon as={Share} className="size-4" />
                <Text>Share link</Text>
              </Button>
            </View>
          </SettingsRow>
        </SettingsGroup>

        {/* Every member can open these — the sheets themselves render read-only
            for non-admins. */}
        <SettingsGroup title="Feature Settings">
          <DisclosureRow
            icon={MessageSquare}
            label="Questions"
            description="Add question packs and adjust ammount"
            onPress={() => questionSheet.current?.present()}
          />
          <DisclosureRow
            icon={Camera}
            label="Rallies"
            description="How many run and the break between."
            onPress={() => rallySheet.current?.present()}
          />
          <DisclosureRow
            icon={Radio}
            label="Jukebox"
            description="When it starts and which themes."
            onPress={() => jukeboxSheet.current?.present()}
          />
        </SettingsGroup>

        <SettingsGroup title={`Members (${members.length})`}>
          {members.map((member) => (
            <SettingsRow key={member.user}>
              <View className="flex-1 flex-row items-center gap-3">
                <UserAvatar
                  name={member.name}
                  avatarUrl={member.avatarUrl}
                  className="size-10"
                  fallbackClassName="text-sm font-bold"
                />
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-medium text-foreground">
                    {member.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    last seen {formatLastOnline(member.lastOnline)}
                  </Text>
                </View>
              </View>
              {member.user !== currentUserId ? (
                <View className="flex-row items-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    accessibilityLabel={`Report ${member.name}`}
                    onPress={() =>
                      reportContent("member", {
                        targetType: "user",
                        targetId: member.user,
                        reportedUser: member.user,
                        groupId: group._id,
                        content: member.name,
                      })
                    }
                  >
                    <Icon as={MessageSquareWarning} className="size-4" />
                  </Button>
                  {userIsAdmin ? (
                    <Button size="icon" variant="destructive" onPress={() => confirmKick(member)}>
                      <Icon as={UserRoundMinus} className="size-4" />
                    </Button>
                  ) : null}
                </View>
              ) : null}
            </SettingsRow>
          ))}
        </SettingsGroup>
      </View>

      <View className="gap-3">
        <Button variant="destructive" onPress={confirmLeave}>
          <Icon as={DoorOpen} className="size-4" />
          <Text>Leave Group</Text>
        </Button>
        {userIsAdmin ? (
          <Button variant="destructive" onPress={confirmDelete}>
            <Icon as={Trash} className="size-4" />
            <Text>Delete Group</Text>
          </Button>
        ) : null}
      </View>

      <QuestionSettingsSheet
        ref={questionSheet}
        groupId={group._id}
        settings={questions.settings}
        canEdit={userIsAdmin}
        onSave={(settings) => saveFeature("questions", settings)}
      />
      <RallySettingsSheet
        ref={rallySheet}
        settings={rallies.settings}
        canEdit={userIsAdmin}
        onSave={(settings) => saveFeature("rallies", settings)}
      />
      <JukeboxSettingsSheet
        ref={jukeboxSheet}
        settings={jukebox.settings}
        canEdit={userIsAdmin}
        onSave={(settings) => saveFeature("jukebox", settings)}
      />
    </View>
  );
}

/** Grouped-list row that opens something — circled icon, label, chevron. */
function DisclosureRow({
  icon,
  label,
  description,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  description?: string;
  onPress: () => void;
}) {
  return (
    <HapticPressable onPress={onPress} className="active:opacity-70">
      <SettingsRow>
        <View className="size-8 items-center justify-center rounded-full bg-primary/5">
          <Icon as={icon} className="size-4 text-primary" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-foreground">{label}</Text>
          {description ? (
            <Text className="text-xs text-muted-foreground">{description}</Text>
          ) : null}
        </View>
        <Icon as={ChevronRight} className="size-4 text-muted-foreground" />
      </SettingsRow>
    </HapticPressable>
  );
}

function formatLastOnline(iso?: string): string {
  if (!iso) return "never";
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function SettingsSkeleton() {
  return (
    <View className="gap-6">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-44 w-full rounded-2xl" />
    </View>
  );
}
