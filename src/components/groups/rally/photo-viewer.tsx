import { useEffect, useRef, useState, type ReactNode } from "react";
import { FlatList, Modal, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { HapticPressable } from "@/components/ui/haptic-pressable";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export type ViewerPhoto = { id: string; uri: string };

/**
 * Full-screen photo browser: swipe between photos, tap ✕ to close. Paging is the
 * right idiom *here* — one photo at a time, full bleed — where it isn't in the
 * feed you opened it from. Deliberately no pinch-to-zoom.
 *
 * `openIndex` doubles as the open flag: null is closed, a number opens on that
 * photo. `footer` renders a per-photo action (the vote button during voting).
 */
export function PhotoViewer({
  photos,
  openIndex,
  onClose,
  footer,
}: {
  photos: ViewerPhoto[];
  openIndex: number | null;
  onClose: () => void;
  footer?: (photo: ViewerPhoto) => ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ViewerPhoto>>(null);
  const [index, setIndex] = useState(0);

  // Re-opening on a different photo has to move the list, since it stays mounted
  // between opens and would otherwise keep the previous scroll position.
  useEffect(() => {
    if (openIndex === null) return;
    setIndex(openIndex);
    listRef.current?.scrollToIndex({ index: openIndex, animated: false });
  }, [openIndex]);

  const current = photos[index];

  return (
    <Modal
      visible={openIndex !== null}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        <FlatList
          ref={listRef}
          data={photos}
          keyExtractor={(photo) => photo.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={openIndex ?? 0}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(event) =>
            setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) => (
            <View style={{ width, height }} className="items-center justify-center">
              <Image
                source={{ uri: item.uri, cacheKey: item.id }}
                style={{ width, height }}
                contentFit="contain"
                transition={150}
              />
            </View>
          )}
        />

        <View
          className="absolute left-0 right-0 flex-row items-center justify-between px-4"
          style={{ top: insets.top + 8 }}
        >
          <HapticPressable
            haptic="light"
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel="Close photo"
            className="size-10 items-center justify-center rounded-full bg-black/50"
          >
            <Icon as={X} className="size-5 text-white" />
          </HapticPressable>

          {photos.length > 1 ? (
            <View className="rounded-full bg-black/50 px-3 py-1.5">
              <Text className="text-sm font-semibold text-white">
                {index + 1} / {photos.length}
              </Text>
            </View>
          ) : (
            <View className="size-10" />
          )}
        </View>

        {footer && current ? (
          <View
            className="absolute left-0 right-0 px-4"
            style={{ bottom: insets.bottom + 16 }}
          >
            {footer(current)}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
