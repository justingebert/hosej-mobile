import { View } from "react-native";
import { MessageCircle } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { StepHeader } from "../step-header";

const messages = [
  { mine: false, name: "Alex", text: "lol no way pineapple won" },
  { mine: true, name: "You", text: "pineapple gang rise up" },
  { mine: false, name: "Sam", text: "this is why we can't have nice things" },
];

export function ChatStep() {
  return (
    <View className="gap-4 py-2">
      <StepHeader
        title="Chat"
        subtitle="Questions, rallies and jukeboxes each get their own thread."
      />

      <View className="gap-3 rounded-2xl bg-secondary/30 p-4">
        <View className="flex-row items-center gap-2">
          <Icon as={MessageCircle} className="size-4 text-muted-foreground" />
          <Text className="text-xs font-medium text-muted-foreground">Chat</Text>
        </View>

        <View className="gap-2">
          {messages.map((msg, i) => (
            <View key={i} className={cn("max-w-[78%]", msg.mine ? "self-end" : "self-start")}>
              <View
                className={cn(
                  "rounded-2xl px-3 py-2",
                  msg.mine ? "bg-primary" : "bg-secondary"
                )}
              >
                {!msg.mine ? (
                  <Text className="mb-0.5 text-[10px] font-medium text-muted-foreground">
                    {msg.name}
                  </Text>
                ) : null}
                <Text className={cn("text-sm", msg.mine && "text-primary-foreground")}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text className="text-center text-xs text-muted-foreground">
        It unlocks once you&rsquo;ve taken part, vote or drop your song first, then discuss.
      </Text>
    </View>
  );
}
