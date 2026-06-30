import { View } from "react-native";
import { Calendar, MessageSquare, Users, type LucideIcon } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { StepHeader } from "../step-header";

const stats: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: Calendar, value: "42", label: "days active" },
  { icon: MessageSquare, value: "1.2k", label: "messages" },
  { icon: Users, value: "6", label: "members" },
];

const leaderboard = [
  { name: "Alex", points: 420, streak: 90 },
  { name: "Sam", points: 380, streak: 59 },
  { name: "You", points: 350, streak: 200 },
];

export function HistoryStatsStep() {
  return (
    <View className="gap-4 py-2">
      <StepHeader
        title="History & Stats"
        subtitle="Browse past questions and track your group’s activity over time."
      />

      <View className="flex-row gap-2">
        {stats.map(({ icon, value, label }) => (
          <View key={label} className="flex-1 items-center gap-1 rounded-2xl bg-secondary/40 p-3">
            <Icon as={icon} className="size-4 text-muted-foreground" />
            <Text className="text-lg font-bold">{value}</Text>
            <Text className="text-[10px] text-muted-foreground">{label}</Text>
          </View>
        ))}
      </View>

      <View className="gap-2 rounded-2xl bg-secondary/30 p-4">
        <Text className="text-xs font-medium text-muted-foreground">Leaderboard</Text>
        {leaderboard.map((entry) => (
          <View key={entry.name} className="flex-row items-center gap-2">
            <Text className="flex-1 text-sm">{entry.name}</Text>
            <Text className="text-xs text-muted-foreground">{entry.points} pts</Text>
            <Text className="text-xs text-muted-foreground">{entry.streak} 👖</Text>
          </View>
        ))}
      </View>

      <Text className="text-center text-xs text-muted-foreground">
        Earn points by voting, creating, and participating daily. Keep your streak going!
      </Text>
    </View>
  );
}
