import { useEffect, useState } from "react";
import { View } from "react-native";
import { useGlobalSearchParams } from "expo-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import { CreateQuestionScreen } from "@/components/groups/question/create-question-screen";
import { CreateRallyScreen } from "@/components/groups/rally/create-rally-screen";

type CreateTab = "question" | "rally";

/**
 * Both things a member can add to the group's pool. Questions lead because
 * they're the daily habit; rallies are the occasional one.
 *
 * `?tab=rally` selects the rally tab, which is how the rally screen's empty
 * guide links here. It's applied in an effect, not just as the initial state,
 * because the tab screen stays mounted between visits.
 */
export function CreateScreen() {
  const { tab } = useGlobalSearchParams<{ tab?: string }>();
  const [active, setActive] = useState<CreateTab>(tab === "rally" ? "rally" : "question");

  useEffect(() => {
    if (tab === "rally") setActive("rally");
  }, [tab]);

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 py-2">
        <Tabs value={active} onValueChange={(value) => setActive(value as CreateTab)}>
          <TabsList>
            <TabsTrigger value="question" className="flex-1">
              <Text>Question</Text>
            </TabsTrigger>
            <TabsTrigger value="rally" className="flex-1">
              <Text>Rally</Text>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </View>

      {active === "question" ? <CreateQuestionScreen /> : <CreateRallyScreen />}
    </View>
  );
}
