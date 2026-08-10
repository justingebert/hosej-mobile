import { View } from "react-native";
import {
  BarChart3,
  Camera,
  MessageCircle,
  MessageSquareText,
  Plus,
  Radio,
  type LucideIcon,
} from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { StepHeader } from "../step-header";

const features: { icon: LucideIcon; label: string; color: string }[] = [
  { icon: MessageSquareText, label: "Daily Questions", color: "text-chart-5" },
  { icon: Camera, label: "Photo Rallies", color: "text-chart-9" },
  { icon: Radio, label: "Jukebox", color: "text-chart-2" },
  { icon: Plus, label: "Create", color: "text-chart-3" },
  { icon: MessageCircle, label: "Chat", color: "text-chart-7" },
  { icon: BarChart3, label: "History & Stats", color: "text-chart-4" },
];

export function WelcomeStep() {
  return (
    <View className="gap-5 py-2">
      <StepHeader
        title="Welcome to HoseJ"
        subtitle="A social app how it's supposed to be. Interact and stay connected with your friends by creating your own space. No algorithms, no doomscroll, no ads."
      />

      <View className="flex-row flex-wrap gap-2">
        {features.map(({ icon, label, color }) => (
          <View
            key={label}
            className="grow basis-[45%] items-center gap-2 rounded-2xl bg-secondary/50 p-3"
          >
            <Icon as={icon} className={`size-7 ${color}`} />
            <Text className="text-xs font-medium">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
