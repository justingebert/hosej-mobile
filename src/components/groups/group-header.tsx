import type { ReactNode } from "react";
import { View } from "react-native";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export function GroupHeaderTitle({ children }: { children: ReactNode }) {
  return (
    <Text numberOfLines={1} className="text-2xl font-extrabold text-foreground">
      {children}
    </Text>
  );
}

export function GroupHeaderButton(props: ButtonProps) {
  return <Button size="icon" variant="ghost" {...props} />;
}

export function GroupHeaderSpacer() {
  return <View className="h-10 w-10" />;
}
