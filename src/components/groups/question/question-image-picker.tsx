import { useRef } from "react";
import { View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, Trash2, type LucideIcon } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { HapticPressable } from "@/components/ui/haptic-pressable";
import { Icon } from "@/components/ui/icon";
import { Sheet, type SheetHandle } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { PickedImage } from "@/lib/api/upload";
import { AspectImage } from "./aspect-image";

// No cropping — an attached image is illustration for the prompt, whatever its
// shape. Quality matches the rally upload.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 0.7,
};

/**
 * Optional image attached to a new question (the web app's "Add image"). Stages
 * the pick only — the upload happens on submit, inside the create mutation.
 */
export function QuestionImagePicker({
  image,
  onChange,
}: {
  image: PickedImage | null;
  onChange: (image: PickedImage | null) => void;
}) {
  const sheetRef = useRef<SheetHandle>(null);

  const handleResult = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const asset = result.assets[0];
    onChange({ uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName });
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
    onChange(null);
  };

  return (
    <>
      {image ? (
        <HapticPressable
          className="active:opacity-80"
          accessibilityLabel="Change attached image"
          onPress={() => sheetRef.current?.present()}
        >
          {/* Capped so a tall photo doesn't push the form off screen; the image
              letterboxes inside instead (AspectImage uses contentFit="contain"). */}
          <AspectImage uri={image.uri} className="max-h-64 rounded-xl" />
        </HapticPressable>
      ) : (
        <Button variant="outline" onPress={() => sheetRef.current?.present()}>
          <Icon as={ImagePlus} className="size-4" />
          <Text>Add image</Text>
        </Button>
      )}

      <Sheet ref={sheetRef} className="gap-3">
        <View className="overflow-hidden rounded-2xl bg-card">
          <SheetAction icon={Camera} label="Take Photo" onPress={takePhoto} />
          <View className="h-px bg-border" />
          <SheetAction icon={ImagePlus} label="Choose Photo" onPress={choosePhoto} />
          {image ? (
            <>
              <View className="h-px bg-border" />
              <SheetAction icon={Trash2} label="Remove Image" destructive onPress={removePhoto} />
            </>
          ) : null}
        </View>
        <HapticPressable
          className="items-center rounded-2xl bg-card p-4 active:opacity-70"
          onPress={() => sheetRef.current?.dismiss()}
        >
          <Text className="font-semibold text-foreground">Cancel</Text>
        </HapticPressable>
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
    <HapticPressable className="flex-row items-center gap-3 p-4 active:bg-muted" onPress={onPress}>
      <Icon as={icon} className={cn("size-5", destructive ? "text-destructive" : "text-foreground")} />
      <Text className={cn("text-base", destructive ? "text-destructive" : "text-foreground")}>
        {label}
      </Text>
    </HapticPressable>
  );
}
