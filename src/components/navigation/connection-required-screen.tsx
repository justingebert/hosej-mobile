import { LogOut, RefreshCw, WifiOff } from "lucide-react-native";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

export function ConnectionRequiredScreen({
  isRetrying,
  onRetry,
  onSignOut,
}: {
  isRetrying: boolean;
  onRetry: () => void;
  onSignOut: () => void;
}) {
  return (
    <Screen contentContainerClassName="grow justify-center gap-8 px-6">
      <View className="items-center gap-4">
        <View className="size-16 items-center justify-center rounded-full bg-secondary">
          <Icon as={WifiOff} className="size-8 text-muted-foreground" />
        </View>
        <View className="items-center gap-2">
          <Text variant="h2" className="text-center">
            HoseJ needs an internet connection.
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <Button onPress={onRetry} disabled={isRetrying}>
          <Icon as={RefreshCw} className="size-4" />
          <Text>{isRetrying ? "Checking..." : "Try again"}</Text>
        </Button>
        {/* The only way off this screen when retrying can't succeed (e.g. the
            stored session is bound to an account that's gone). */}
        <Button variant="ghost" onPress={onSignOut} disabled={isRetrying}>
          <Icon as={LogOut} className="size-4" />
          <Text>Log out</Text>
        </Button>
      </View>
    </Screen>
  );
}
