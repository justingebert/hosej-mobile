import { Text, View } from "react-native";

export function ChatPlaceholder() {
  return (
    <View
      className="gap-2 rounded-2xl border border-border bg-card p-5"
      style={{ borderCurve: "continuous" }}
    >
      <Text className="text-lg font-extrabold text-card-foreground">Chat</Text>
      <Text className="text-sm text-muted-foreground">
        Question chat placeholder.
      </Text>
    </View>
  );
}

export function FeaturePlaceholder({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View className="gap-1 rounded-xl border border-border bg-background p-4">
      <Text className="text-base font-extrabold text-foreground">{title}</Text>
      <Text className="text-sm text-muted-foreground">{body}</Text>
    </View>
  );
}
