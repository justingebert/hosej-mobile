import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";
import { cn } from "@/lib/utils";

const imageStyle = {
  height: "100%",
  width: "100%",
} as const;

// Full-width image that shows the whole picture: the container fills its parent's
// width and takes its height from the image's natural aspect ratio (read on load),
// so nothing gets cropped and each card sizes itself to its image.
export function AspectImage({
  uri,
  cacheKey,
  className,
  fallbackAspectRatio = 1,
}: {
  uri: string;
  cacheKey?: string;
  className?: string;
  /** Used until the real dimensions load, to reserve space. */
  fallbackAspectRatio?: number;
}) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  return (
    <View
      className={cn("w-full overflow-hidden bg-muted", className)}
      style={{ aspectRatio: aspectRatio ?? fallbackAspectRatio }}
    >
      <Image
        source={{ uri, cacheKey: cacheKey ?? uri }}
        style={imageStyle}
        contentFit="contain"
        onLoad={({ source }) => {
          if (source?.width && source?.height) {
            setAspectRatio(source.width / source.height);
          }
        }}
      />
    </View>
  );
}
