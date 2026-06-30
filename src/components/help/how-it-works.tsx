import { View } from "react-native";
import { History, MessageSquareText, Plus, Trophy, type LucideIcon } from "lucide-react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: MessageSquareText,
    title: "Daily Questions",
    description:
      "Every day your group gets new questions to answer. Vote on options or write a response, then see how everyone answered.",
  },
  {
    icon: Trophy,
    title: "Leaderboard & Stats",
    description:
      "Track who's the most active, see group statistics. Points are earned by participating and creating!",
  },
  {
    icon: Plus,
    title: "Create Content",
    description:
      "You can create custom questions for the group. Choose from different types: members, custom options, text, or rating.",
  },
  {
    icon: History,
    title: "History",
    description:
      "Browse past questions and see how the group answered. Filter and search through your group's question history.",
  },
];

export function HowItWorks() {
  return (
    <View className="gap-4">
      <Text variant="large">How It Works</Text>
      {features.map((feature) => (
        <Card key={feature.title}>
          <CardHeader>
            <View className="flex-row items-center gap-3">
              <Icon as={feature.icon} className="size-5 text-muted-foreground" />
              <CardTitle>{feature.title}</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Text className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </Text>
          </CardContent>
        </Card>
      ))}
    </View>
  );
}
