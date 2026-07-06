import { type Href, Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "react-native";

import { GroupHeaderButton, GroupHeaderTitle } from "@/components/groups/group-header";
import { useGroup } from "@/lib/api/groups";
import { ArrowLeft, Users, X } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { GroupIdProvider } from "@/lib/group-id";
import { Text } from "@/components/ui/text";

export default function GroupLayout() {
  const router = useRouter();
  const scheme = useColorScheme();
  const { groupId } = useGlobalSearchParams<{ groupId: string }>();
  const { data: group } = useGroup(groupId);
  const headerBackground = scheme === "dark" ? "#0a0a0a" : "#ffffff";
  const sharedHeaderOptions = {
    headerShown: true,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: headerBackground },
    headerTitleAlign: "center" as const,
  };
  const backHeaderOptions = (title: string) => ({
    ...sharedHeaderOptions,
    headerTitle: () => <GroupHeaderTitle>{title}</GroupHeaderTitle>,
    headerBackVisible: false,
    headerLeft: () => (
      <GroupHeaderButton onPress={router.back}>
        <Icon as={ArrowLeft} className="size-5" />
      </GroupHeaderButton>
    ),
  });
  const modalHeaderOptions = (title: string) => ({
    ...sharedHeaderOptions,
    presentation: "modal" as const,
    headerTitle: () => <GroupHeaderTitle>{title}</GroupHeaderTitle>,
    headerRight: () => (
      <GroupHeaderButton onPress={router.back}>
        <Icon as={X} className="size-5" />
      </GroupHeaderButton>
    ),
  });

  return (
    <GroupIdProvider groupId={groupId}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="(tabs)"
          options={{
            ...sharedHeaderOptions,
            headerTitle: () => <GroupHeaderTitle>{group?.name ?? "Group"}</GroupHeaderTitle>,
            headerBackVisible: false,
            headerLeft: () => (
              <GroupHeaderButton onPress={() => router.dismissTo("/")}>
                <Icon as={Users} className="size-5" />
              </GroupHeaderButton>
            ),
            headerRight: () => (
              <GroupHeaderButton
                onPress={() => router.push(`/groups/${groupId}/leaderboard` as Href)}
              >
                <Text>👖</Text>
              </GroupHeaderButton>
            ),
          }}
        />
        <Stack.Screen
          name="question"
          options={{
            ...backHeaderOptions("Daily Questions"),
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="question/[questionId]/index"
          options={backHeaderOptions("Results")}
        />
        <Stack.Screen
          name="question/[questionId]/resultsdetailed"
          options={backHeaderOptions("Results")}
        />
        <Stack.Screen
          name="leaderboard"
          options={modalHeaderOptions("Leaderboard")}
        />
        <Stack.Screen
          name="remaining"
          options={modalHeaderOptions("Remaining")}
        />
      </Stack>
    </GroupIdProvider>
  );
}
