import { type Href, Link } from "expo-router";
import { CirclePlay, Frown, PlusCircle } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useActivateNextQuestion } from "@/lib/api/questions";

export function QuestionEmptyGuide({ groupId }: { groupId: string }) {
  // Activation is open to every member, not just the admin — the endpoint only
  // checks group membership.
  const activate = useActivateNextQuestion(groupId);

  return (
    <View className="flex-1 items-center justify-center gap-10 px-6">
      <View className="items-center gap-4">
        <View className="size-24 items-center justify-center rounded-full border border-border bg-muted/50">
          <Icon as={Frown} className="size-10 text-muted-foreground" />
        </View>
        <View className="items-center gap-2">
          <Text className="text-2xl font-semibold text-foreground">No questions left.</Text>
          <Text className="max-w-[280px] text-center text-sm text-muted-foreground">
            Activate the next available question, or create a new one.
          </Text>
        </View>
      </View>

      <View className="w-full max-w-xs gap-3">
        <Link href={`/groups/${groupId}/create` as Href} asChild>
          <Button size="lg">
            <Icon as={PlusCircle} className="size-5" />
            <Text>Create a new Question</Text>
          </Button>
        </Link>

        <Button
          variant="secondary"
          size="lg"
          disabled={activate.isPending}
          onPress={() => activate.mutate()}
        >
          <Icon as={CirclePlay} className="size-5" />
          <Text>{activate.isPending ? "Activating…" : "Activate next Question"}</Text>
        </Button>
      </View>
    </View>
  );
}
