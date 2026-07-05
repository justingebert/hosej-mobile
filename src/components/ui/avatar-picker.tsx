import { useRef } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, Pencil, Trash2, type LucideIcon } from "lucide-react-native";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Sheet, type SheetHandle } from "@/components/ui/sheet";
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
  const sheetRef = useRef<SheetHandle>(null);

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

      <Sheet ref={sheetRef} className="gap-3">
        <View className="overflow-hidden rounded-2xl bg-card">
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
          className="items-center rounded-2xl bg-card p-4 active:opacity-70"
          onPress={() => sheetRef.current?.dismiss()}
        >
          <Text className="font-semibold text-foreground">Cancel</Text>
        </Pressable>
      </Sheet>
    </>
  );
}

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
