import { Stack, useGlobalSearchParams, useRouter, type Href } from "expo-router";
import { useColorScheme } from "react-native";

import {
  GroupHeaderButton,
  GroupHeaderTitle,
} from "@/components/groups/group-header";
import { useGroup } from "@/lib/api/groups";
import { ArrowLeft, Info, Users, X } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { GroupIdProvider } from "@/lib/group-id";
import { Text } from "@/components/ui/text";

export default function GroupLayout() {
  const router = useRouter();
  const scheme = useColorScheme();
  const { groupId } = useGlobalSearchParams<{ groupId: string }>();
  const { data: group } = useGroup(groupId);
  const headerBackground = scheme === "dark" ? "#0a0a0a" : "#ffffff";

  return (
    <GroupIdProvider groupId={groupId}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: headerBackground },
            headerTitle: () => <GroupHeaderTitle>{group?.name ?? "Group"}</GroupHeaderTitle>,
            headerTitleAlign: "center",
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
            animation: "fade_from_bottom",
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: headerBackground },
            headerTitle: () => <GroupHeaderTitle>Daily Questions</GroupHeaderTitle>,
            headerTitleAlign: "center",
            headerBackVisible: false,
            headerLeft: () => (
              <GroupHeaderButton onPress={router.back}>
                <Icon as={ArrowLeft} className="size-5" />
              </GroupHeaderButton>
            ),
          }}
        />
        <Stack.Screen
          name="question/[questionId]/index"
          options={{
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: headerBackground },
            headerTitle: () => <GroupHeaderTitle>Results</GroupHeaderTitle>,
            headerTitleAlign: "center",
            headerBackVisible: false,
            headerLeft: () => (
              <GroupHeaderButton onPress={router.back}>
                <Icon as={ArrowLeft} className="size-5" />
              </GroupHeaderButton>
            ),
          }}
        />
        <Stack.Screen
          name="question/[questionId]/resultsdetailed"
          options={{
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: headerBackground },
            headerTitle: () => <GroupHeaderTitle>Results</GroupHeaderTitle>,
            headerTitleAlign: "center",
            headerBackVisible: false,
            headerLeft: () => (
              <GroupHeaderButton onPress={router.back}>
                <Icon as={ArrowLeft} className="size-5" />
              </GroupHeaderButton>
            ),
          }}
        />
        <Stack.Screen
          name="leaderboard"
          options={{
            presentation: "modal",
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: headerBackground },
            headerTitle: () => <GroupHeaderTitle>Leaderboard</GroupHeaderTitle>,
            headerTitleAlign: "center",
            headerRight: () => (
              <GroupHeaderButton onPress={router.back}>
                <Icon as={X} className="size-5" />
              </GroupHeaderButton>
            ),
          }}
        />
        <Stack.Screen
          name="remaining"
          options={{
            presentation: "modal",
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: headerBackground },
            headerTitle: () => <GroupHeaderTitle>Remaining</GroupHeaderTitle>,
            headerTitleAlign: "center",
            headerLeft: () => (
              <GroupHeaderButton onPress={router.back}>
                <Icon as={X} className="size-5" />
              </GroupHeaderButton>
            ),
          }}
        />
      </Stack>
    </GroupIdProvider>
  );
}
