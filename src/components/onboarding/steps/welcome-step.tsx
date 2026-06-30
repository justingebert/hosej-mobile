import { View } from "react-native";
import {
  BarChart3,
  MessageCircle,
  MessageSquareText,
  Plus,
  type LucideIcon,
} from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { StepHeader } from "../step-header";

const features: { icon: LucideIcon; label: string; color: string }[] = [
  { icon: MessageSquareText, label: "Daily Questions", color: "text-blue-500" },
  { icon: Plus, label: "Create", color: "text-amber-500" },
  { icon: MessageCircle, label: "Chat", color: "text-violet-500" },
  { icon: BarChart3, label: "History & Stats", color: "text-emerald-500" },
];

export function WelcomeStep() {
  return (
    <View className="gap-6 py-2">
      <StepHeader
        title="Welcome to HoseJ"
        subtitle="A Social App how its supposed to be. Interact and stay connected with your friend by creating your own space. No Algorithmsm, Doomscroll or Ads."
      />

      <View className="flex-row flex-wrap gap-3">
        {features.map(({ icon, label, color }) => (
          <View
            key={label}
            className="grow basis-[45%] items-center gap-2 rounded-2xl bg-secondary/50 p-4"
          >
            <Icon as={icon} className={`size-7 ${color}`} />
            <Text className="text-xs font-medium">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
