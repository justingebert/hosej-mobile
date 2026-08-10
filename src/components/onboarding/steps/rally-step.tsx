import { View } from "react-native";
import { Camera, ThumbsUp, Trophy, type LucideIcon } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { StepHeader } from "../step-header";

// Phases, not deadlines: rallies advance on a daily cron, so nothing here may
// imply a clock. See docs/migration-decisions.md.
const PHASES: {
  icon: LucideIcon;
  title: string;
  description: string;
  bg: string;
  fg: string;
}[] = [
  {
    icon: Camera,
    title: "Submit",
    description: "A photo task drops. Shoot it and send your best.",
    bg: "bg-chart-4/10",
    fg: "text-chart-4",
  },
  {
    icon: ThumbsUp,
    title: "Vote",
    description: "Everyone's photos, no names attached. \nPick your favourite.",
    bg: "bg-chart-5/10",
    fg: "text-chart-5",
  },
  {
    icon: Trophy,
    title: "Results",
    description: "Names go up and the winner takes the top spot.",
    bg: "bg-chart-3/10",
    fg: "text-chart-3",
  },
];

export function RallyStep() {
  return (
    <View className="gap-4 py-2">
      <StepHeader
        title="Photo Rallies"
        subtitle="Compete and create photo challenges for the group. Each rally has three phases."
      />

      <View>
        {PHASES.map(({ icon, title, description, bg, fg }, i) => (
          <View key={title} className="flex-row gap-3">
            <View className="items-center">
              <View className={`size-10 items-center justify-center rounded-full ${bg}`}>
                <Icon as={icon} className={`size-5 ${fg}`} />
              </View>
              {i < PHASES.length - 1 ? (
                <View className="my-1 w-0.5 flex-1 bg-muted-foreground/20" />
              ) : null}
            </View>
            <View className="flex-1 pb-3 pt-1.5">
              <Text className="text-sm font-semibold">{title}</Text>
              <Text className="text-xs text-muted-foreground">{description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="items-center gap-2 rounded-2xl bg-secondary/30 p-4">
        <Text className="text-2xl">🥇 🥈 🥉</Text>
        <Text className="text-center text-xs text-muted-foreground">
          Taking part is what scores, submitting and voting both earn points.
        </Text>
      </View>
    </View>
  );
}
