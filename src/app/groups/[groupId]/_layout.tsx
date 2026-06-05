import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { useGroup } from "@/lib/api/groups";
import { Info, Users } from "lucide-react-native";
import { Button } from "@/components/ui/button";

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
            <Button
              onPress={router.back}
              size="icon"
              variant="secondary"
            >
              <Users className="h-5 w-5" />
            </Button>
          ),
          headerRight: () => (
            <Button
              onPress={router.back}
              size="icon"
              variant="secondary"
            >
              <Info className="h-5 w-5" />
            </Button>
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
