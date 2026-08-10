import { View } from "react-native";
import { Camera, MessageSquareText, Plus, Settings2, type LucideIcon } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { StepHeader } from "../step-header";

// The two tabs on the create screen. Jukeboxes aren't here — they open on their
// own, nobody creates one.
const creations: {
  icon: LucideIcon;
  label: string;
  hint: string;
  bg: string;
  fg: string;
}[] = [
  {
    icon: MessageSquareText,
    label: "Questions",
    hint: "Ask anything, any format",
    bg: "bg-chart-5/10",
    fg: "text-chart-5",
  },
  {
    icon: Camera,
    label: "Rallies",
    hint: "Set a photo challenge",
    bg: "bg-chart-9/10",
    fg: "text-chart-9",
  },
];

export function CreateStep() {
  return (
    <View className="gap-5 py-2">
      <StepHeader
        title="Make It Yours"
        subtitle="Your group thrives on what you put into it."
      />

      <View className="gap-2">
        {creations.map(({ icon, label, hint, bg, fg }) => (
          <View
            key={label}
            className="flex-row items-center gap-3 rounded-2xl bg-secondary/40 p-3"
          >
            <View className={`size-10 items-center justify-center rounded-full ${bg}`}>
              <Icon as={icon} className={`size-5 ${fg}`} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold">{label}</Text>
              <Text className="text-xs text-muted-foreground">{hint}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="flex-row items-center justify-center gap-1.5">
        <Text className="text-xs text-muted-foreground">Tap</Text>
        <View className="size-5 items-center justify-center rounded-full bg-primary">
          <Icon as={Plus} className="size-3 text-primary-foreground" />
        </View>
        <Text className="text-xs text-muted-foreground">in any group to start creating.</Text>
      </View>

      <View className="flex-row items-start gap-2 rounded-xl bg-secondary/30 px-3 py-2">
        <Icon as={Settings2} className="mt-0.5 size-3.5 text-muted-foreground" />
        <Text className="flex-1 text-[11px] text-muted-foreground">
          Admins set the pace: how many questions run, and how often.
        </Text>
      </View>
    </View>
  );
}
