import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "react-native";

import {
  GroupHeaderButton,
  GroupHeaderTitle,
} from "@/components/groups/group-header";
import { useGroup } from "@/lib/api/groups";
import { ArrowLeft, Info, Users } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";

export default function GroupLayout() {
  const router = useRouter();
  const scheme = useColorScheme();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { data: group } = useGroup(groupId);
  const headerBackground = scheme === "dark" ? "#0a0a0a" : "#ffffff";

  return (
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
            <GroupHeaderButton
              onPress={() => router.dismissTo("/")}
            >
              <Icon as={Users} className="size-5" />
            </GroupHeaderButton>
          ),
          headerRight: () => (
            <GroupHeaderButton
              onPress={(() => router.push(`/groups/${groupId}/stats`))}
            >
              <Icon as={Info} className="size-5" />
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
    </Stack>
  );
}
