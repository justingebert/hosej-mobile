import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

import { useGroup } from "@/lib/api/groups";

export default function GroupLayout() {
  const router = useRouter();
  const {groupId} = useLocalSearchParams<{ groupId: string }>();
  const {data: group} = useGroup(groupId);

  return (
    <Stack screenOptions={{headerShown: false}}>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerTitleAlign: "center",
          title: group?.name ?? "Group",
          headerLeft: () => (
            <Pressable
              onPress={router.back}
            >
              <Text>back</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={router.back}
            >
              <Text>info</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="question"
        options={{
          animation: "fade_from_bottom",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
