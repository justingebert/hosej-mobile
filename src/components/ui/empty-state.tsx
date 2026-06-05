import { Text, View } from "react-native";

type EmptyStateProps = {
  title: string;
  description?: string;
};

/** The single "no content yet" view. Distinct from an error — nothing failed. */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-2 p-6">
      <Text className="text-center text-2xl font-extrabold text-foreground">{title}</Text>
      {description ? (
        <Text className="text-center text-sm text-muted-foreground">{description}</Text>
      ) : null}
    </View>
  );
}
