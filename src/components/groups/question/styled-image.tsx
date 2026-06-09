import { Image, type ImageContentFit } from "expo-image";
import { View } from "react-native";
import { cn } from "@/lib/utils";

const imageStyle = {
  height: "100%",
  width: "100%",
} as const;

export function StyledImage({
  uri,
  cacheKey,
  className,
  contentFit = "cover",
}: {
  uri: string;
  cacheKey?: string;
  className: string;
  contentFit?: ImageContentFit;
}) {
  return (
    <View className={cn("overflow-hidden bg-muted", className)}>
      <Image
        source={{ uri, cacheKey: cacheKey ?? uri }}
        style={imageStyle}
        contentFit={contentFit}
      />
    </View>
  );
}
