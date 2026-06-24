import { useCallback, useRef } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, Pencil, Trash2, type LucideIcon } from "lucide-react-native";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { PickedAvatar } from "@/lib/api/user";

// Square crop, modest quality — same shape the avatar upload has always used.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true, // iOS presents a square crop; aspect is Android-only.
  aspect: [1, 1],
  quality: 0.6,
};

type AvatarPickerProps = {
  /** Image to show: a remote avatarUrl (settings) or a local staged uri (setup). */
  imageUri?: string | null;
  /** Fallback letter shown when there's no image. */
  initial: string;
  /** Disables the trigger and shows a spinner overlay (an in-flight upload). */
  busy?: boolean;
  /** Overrides the avatar size, e.g. "size-28". */
  className?: string;
  alt?: string;
  onPick: (asset: PickedAvatar) => void;
  onRemove: () => void;
};

/**
 * Presentational avatar with an edit badge. Tapping it opens a gorhom bottom
 * sheet (Take Photo / Choose Photo / Remove). It owns the OS pickers and
 * permission prompts but does no network — the parent decides what to do with
 * the asset (upload now, or stage it). Permissions are requested on tap, never
 * at launch.
 */
export function AvatarPicker({
  imageUri,
  initial,
  busy,
  className = "size-20",
  alt = "Profile photo",
  onPick,
  onRemove,
}: AvatarPickerProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  const handleResult = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const asset = result.assets[0];
    onPick({ uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName });
  };

  const takePhoto = async () => {
    sheetRef.current?.dismiss();
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    handleResult(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
  };

  const choosePhoto = async () => {
    sheetRef.current?.dismiss();
    handleResult(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
  };

  const removePhoto = () => {
    sheetRef.current?.dismiss();
    onRemove();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    []
  );

  return (
    <>
      <Pressable
        className="relative self-center"
        disabled={busy}
        onPress={() => sheetRef.current?.present()}
      >
        <Avatar alt={alt} className={className}>
          {imageUri ? <AvatarImage source={{ uri: imageUri }} /> : null}
          <AvatarFallback>
            <Text className="text-2xl font-bold text-foreground">{initial}</Text>
          </AvatarFallback>
        </Avatar>
        {busy ? (
          <View className="absolute inset-0 items-center justify-center rounded-full bg-black/40">
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <View className="absolute bottom-0 right-0 rounded-full border-2 border-background bg-primary p-1.5">
            <Icon as={Pencil} className="size-3.5 text-primary-foreground" />
          </View>
        )}
      </Pressable>

      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        handleComponent={null}
        backgroundStyle={SHEET_TRANSPARENT}
        backdropComponent={renderBackdrop}
      >
        {/* gorhom views take `style`; the inner core-RN views carry className.
            The card bg must fill the bottom safe-area inset too, otherwise the
            backdrop shows through below it as a black/grey strip. */}
        <BottomSheetView>
          <View
            className="gap-3 rounded-t-3xl bg-card px-4 pt-3"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <View className="mb-1 h-1 w-10 self-center rounded-full bg-muted-foreground/30" />
            <View className="overflow-hidden rounded-2xl bg-background">
              <SheetAction icon={Camera} label="Take Photo" onPress={takePhoto} />
              <View className="h-px bg-border" />
              <SheetAction icon={ImagePlus} label="Choose Photo" onPress={choosePhoto} />
              {imageUri ? (
                <>
                  <View className="h-px bg-border" />
                  <SheetAction icon={Trash2} label="Remove Photo" destructive onPress={removePhoto} />
                </>
              ) : null}
            </View>
            <Pressable
              className="items-center rounded-2xl bg-background p-4 active:opacity-70"
              onPress={() => sheetRef.current?.dismiss()}
            >
              <Text className="font-semibold text-foreground">Cancel</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

const SHEET_TRANSPARENT = { backgroundColor: "transparent" } as const;

function SheetAction({
  icon,
  label,
  destructive,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable className="flex-row items-center gap-3 p-4 active:bg-muted" onPress={onPress}>
      <Icon as={icon} className={cn("size-5", destructive ? "text-destructive" : "text-foreground")} />
      <Text className={cn("text-base", destructive ? "text-destructive" : "text-foreground")}>
        {label}
      </Text>
    </Pressable>
  );
}
