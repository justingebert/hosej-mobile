import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  Bell,
  Check,
  MessageCircle,
  Settings2,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { enablePush, getPermissionState } from "@/lib/push/push";
import { StepHeader } from "../step-header";

export function NotificationsStep() {
  const [granted, setGranted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getPermissionState().then((s) => setGranted(s.granted));
  }, []);

  const allow = async () => {
    setBusy(true);
    try {
      const result = await enablePush();
      setGranted(result === "granted");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-5 py-2">
      <StepHeader
        title="Turn on notifications"
        subtitle="So you don’t miss a new question or a reply in the chat."
      />

      <View className="gap-2 rounded-2xl bg-secondary/30 p-4">
        <NotificationPreview
          icon={Sparkles}
          title="New question"
          text="Best pizza topping? Cast your vote."
        />
        <NotificationPreview
          icon={MessageCircle}
          title="Alex in chat"
          text="pineapple gang rise up 🍍"
        />
      </View>

      <View className="flex-row items-start gap-2 rounded-xl bg-secondary/30 px-3 py-2">
        <Icon as={Settings2} className="mt-0.5 size-3.5 text-muted-foreground" />
        <Text className="flex-1 text-[11px] text-muted-foreground">
          No spam, just your group. Choose exactly what pings you in Settings.
        </Text>
      </View>

      {granted ? (
        <View className="flex-row items-center justify-center gap-2 py-1">
          <Icon as={Check} className="size-4 text-primary" />
          <Text className="text-sm font-medium">You’re all set</Text>
        </View>
      ) : (
        <Button onPress={allow} disabled={busy}>
          <Icon as={Bell} className="size-4" />
          <Text>Allow notifications</Text>
        </Button>
      )}
    </View>
  );
}

function NotificationPreview({
  icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-background p-3">
      <View className="size-9 items-center justify-center rounded-lg bg-primary/10">
        <Icon as={icon} className="size-4 text-primary" />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-semibold">{title}</Text>
        <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
          {text}
        </Text>
      </View>
    </View>
  );
}
