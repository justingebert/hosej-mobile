import { Link, Stack, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { ArrowLeft, CircleHelp, User } from "lucide-react-native";
import {
  GroupHeaderButton,
  GroupHeaderSpacer,
  GroupHeaderTitle,
} from "@/components/groups/group-header";
import { Icon } from "@/components/ui/icon";

export function AuthedStackScreens() {
  const router = useRouter();
  const scheme = useColorScheme();
  const sheetBackground = scheme === "dark" ? "#0a0a0a" : "#ffffff";

  return (
    <>
      <Stack.Screen
        name="setup-name"
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: sheetBackground },
          headerTitle: () => <GroupHeaderTitle>Profile</GroupHeaderTitle>,
          headerTitleAlign: "center",
          headerBackVisible: false,
          headerLeft: () => <GroupHeaderSpacer />,
          headerRight: () => <GroupHeaderSpacer />,
        }}
      />
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: sheetBackground },
          headerTitle: () => <GroupHeaderTitle>Groups</GroupHeaderTitle>,
          headerTitleAlign: "center",
          headerLeft: () => (
            <Link href="/help" asChild>
              <GroupHeaderButton>
                <Icon as={CircleHelp} className="size-5" />
              </GroupHeaderButton>
            </Link>
          ),
          headerRight: () => (
            <Link href="/settings" asChild>
              <GroupHeaderButton>
                <Icon as={User} className="size-5" />
              </GroupHeaderButton>
            </Link>
          ),
        }}
      />
      <Stack.Screen
        name="help"
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: sheetBackground },
          headerTitle: () => <GroupHeaderTitle>Help</GroupHeaderTitle>,
          headerTitleAlign: "center",
          headerBackVisible: false,
          headerLeft: () => (
            <GroupHeaderButton onPress={router.back}>
              <Icon as={ArrowLeft} className="size-5" />
            </GroupHeaderButton>
          ),
          headerRight: () => <GroupHeaderSpacer />,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: sheetBackground },
          headerTitle: () => <GroupHeaderTitle>Settings</GroupHeaderTitle>,
          headerTitleAlign: "center",
          headerBackVisible: false,
          headerLeft: () => (
            <GroupHeaderButton onPress={router.back}>
              <Icon as={ArrowLeft} className="size-5" />
            </GroupHeaderButton>
          ),
          headerRight: () => <GroupHeaderSpacer />,
        }}
      />
      <Stack.Screen
        name="groups/create"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: "fitToContents",
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: sheetBackground },
        }}
      />
      <Stack.Screen
        name="groups/join"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: "fitToContents",
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: sheetBackground },
        }}
      />
      <Stack.Screen name="groups/[groupId]" />
    </>
  );
}
