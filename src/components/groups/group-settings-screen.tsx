import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useGroupId } from "@/lib/group-id";
import { DoorOpen, RefreshCw, Share, Trash, UserRoundMinus } from "lucide-react-native";
import { Alert, Platform, Share as RNShare, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorCard } from "@/components/ui/error-card";
import { Icon } from "@/components/ui/icon";
import { Screen } from "@/components/ui/screen";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
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
import type { GroupMemberDTO, GroupWithAdminDTO } from "@/lib/api/types/group";
import { useUser } from "@/lib/api/user";
import { toastSuccess } from "@/lib/toast";

const QUESTION_COUNTS = [1, 2, 3];

export function GroupSettingsScreen() {
  const groupId = useGroupId();
  const { data: group, error, isError, isPending, isRefetching, refetch } = useGroup(groupId);
  const { data: user } = useUser();

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
  const leaveGroup = useLeaveGroup(group._id);
  const deleteGroup = useDeleteGroup(group._id);
  const { data: invite } = useGroupInvite(group._id);
  const resetInvite = useResetInvite(group._id);

  const { userIsAdmin, members } = group;
  const yourName = members.find((m) => m.user === currentUserId)?.name ?? "You";
  const adminName = members.find((m) => m.user === group.admin)?.name ?? "N/A";
  const questionCount = group.features.questions.settings.questionCount;

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

  // Send the complete questions object: the server shallow-merges by feature
  // key, so a partial here would drop lastQuestionDate / packs.
  const setQuestionCount = (count: number) =>
    updateGroup.mutate({
      features: {
        questions: {
          ...group.features.questions,
          settings: { ...group.features.questions.settings, questionCount: count },
        },
      },
    });

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
              router.dismissTo("/");
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
              router.dismissTo("/");
            },
          }),
      },
    ]);

  return (
    <View className="gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Group Information</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Your name" value={yourName} />
          <InfoRow label="Admin" value={adminName} />
          <InfoRow label="Created" value={new Date(group.createdAt).toLocaleDateString()} />
          <View className="flex-row items-center justify-between gap-3 py-3">
            <Text className="text-muted-foreground">Invite</Text>
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
              <Button
                size="sm"
                variant="outline"
                onPress={shareInvite}
                disabled={!invite?.code}
              >
                <Icon as={Share} className="size-4" />
                <Text>Share link</Text>
              </Button>
            </View>
          </View>
        </CardContent>
      </Card>

      {userIsAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent className="flex-row items-center justify-between gap-4">
            <Text className="text-foreground">Questions per day</Text>
            <Segmented
              options={QUESTION_COUNTS.map((n) => ({ label: String(n), value: String(n) }))}
              value={String(questionCount)}
              onChange={(v) => setQuestionCount(Number(v))}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          {members.map((member) => (
            <View key={member.user} className="flex-row items-center justify-between gap-3">
              <View className="flex-1 flex-row items-center gap-3">
                <MemberAvatar member={member} />
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-medium text-foreground">
                    {member.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    last seen {formatLastOnline(member.lastOnline)}
                  </Text>
                </View>
              </View>
              {userIsAdmin && member.user !== currentUserId ? (
                <Button size="icon" variant="destructive" onPress={() => confirmKick(member)}>
                  <Icon as={UserRoundMinus} className="size-4" />
                </Button>
              ) : null}
            </View>
          ))}
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
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
        </CardContent>
      </Card>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3 border-b border-border py-3">
      <Text className="text-muted-foreground">{label}</Text>
      <Text numberOfLines={1} className="flex-1 text-right text-foreground">
        {value}
      </Text>
    </View>
  );
}

function MemberAvatar({ member }: { member: GroupMemberDTO }) {
  if (member.avatarUrl) {
    return (
      <Image
        source={{ uri: member.avatarUrl }}
        style={{ width: 40, height: 40, borderRadius: 20 }}
      />
    );
  }
  return (
    <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
      <Text className="font-bold text-foreground">
        {(member.name || "?").slice(0, 1).toUpperCase()}
      </Text>
    </View>
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
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-44 w-full rounded-xl" />
    </View>
  );
}
