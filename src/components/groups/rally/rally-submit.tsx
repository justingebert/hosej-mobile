
import { useRef, useState } from "react";
import { View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, CheckCircle2, ImagePlus, type LucideIcon } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { HapticPressable } from "@/components/ui/haptic-pressable";
import { Icon } from "@/components/ui/icon";
import { Sheet, type SheetHandle } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { AspectImage } from "@/components/groups/question/aspect-image";
import { useSubmitPhoto } from "@/lib/api/rally";
import type { PickedImage } from "@/lib/api/upload";
import { useAuth } from "@/lib/auth/auth-context";
import { useGroupId } from "@/lib/group-id";
import type { RallyDTO } from "@/lib/api/types/rally";
import { deriveSubmissionWindow } from "./rally-utils";

// No cropping and a light touch on quality: composition is the thing being
// judged, so the entry should be the photo the user actually took.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 0.7,
};

/**
 * Submission phase. Deliberately shows only the *count* of entries, never the
 * entries themselves — seeing everyone else's photo before you shoot yours would
 * turn the challenge into a copying exercise.
 */
export function RallySubmit({
  rally,
  hasSubmitted,
}: {
  rally: RallyDTO;
  hasSubmitted: boolean;
}) {
  const groupId = useGroupId();
  const { user } = useAuth();
  const sheetRef = useRef<SheetHandle>(null);
  const [picked, setPicked] = useState<PickedImage | null>(null);
  const submit = useSubmitPhoto(groupId, rally._id, user?.id);

  const count = rally.submissions.length;
  // Recomputed on render only — a refetch or a phase change is soon enough for
  // a whole-days readout, and there's no clock to keep in sync.
  const submissionWindow = deriveSubmissionWindow(rally);

  const handleResult = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const asset = result.assets[0];
    setPicked({ uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName });
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

  return (
    <View className="grow gap-6">
      <View className="gap-2">
        <Text variant="muted" className="text-center text-sm">
          {count} submissions
        </Text>
        {submissionWindow ? <SubmissionWindowBar {...submissionWindow} /> : null}
      </View>

      {hasSubmitted ? (
        <View className="items-center gap-3 py-8">
          <View className="size-16 items-center justify-center rounded-full bg-primary/10">
            <Icon as={CheckCircle2} className="size-8 text-primary" />
          </View>
          <Text className="text-lg font-semibold text-foreground">Photo submitted</Text>
          <Text variant="muted" className="text-center text-sm">
            Voting opens once submissions close.
          </Text>
        </View>
      ) : picked ? (
        <View className="grow gap-4">
          <AspectImage uri={picked.uri} className="rounded-2xl" />
          {/* `mt-auto` eats the spare height, so the actions land at the bottom
              on a short preview and sit right under a tall one. */}
          <View className="mt-auto gap-2">
            <Button
              size="lg"
              disabled={submit.isPending}
              onPress={() => submit.mutate(picked, { onSuccess: () => setPicked(null) })}
            >
              <Text>{submit.isPending ? "Submitting…" : "Submit this photo"}</Text>
            </Button>
            <Button
              variant="ghost"
              disabled={submit.isPending}
              onPress={() => sheetRef.current?.present()}
            >
              <Text>Pick a different photo</Text>
            </Button>
          </View>
        </View>
      ) : (
        <View className="grow gap-6 py-8">
          <View className="grow items-center justify-center">
            <View className="size-24 items-center justify-center rounded-full border border-border bg-muted/50">
              <Icon as={Camera} className="size-10 text-muted-foreground" />
            </View>
          </View>
          <Button size="lg" className="w-full" onPress={() => sheetRef.current?.present()}>
            <Icon as={Camera} className="size-5" />
            <Text>Add your photo</Text>
          </Button>
        </View>
      )}

      <Sheet ref={sheetRef} className="gap-3">
        <View className="overflow-hidden rounded-2xl bg-card">
          <SheetAction icon={Camera} label="Take Photo" onPress={takePhoto} />
          <View className="h-px bg-border" />
          <SheetAction icon={ImagePlus} label="Choose Photo" onPress={choosePhoto} />
        </View>
        <HapticPressable
          className="items-center rounded-2xl bg-card p-4 active:opacity-70"
          onPress={() => sheetRef.current?.dismiss()}
        >
          <Text className="font-semibold text-foreground">Cancel</Text>
        </HapticPressable>
      </Sheet>
    </View>
  );
}

function SubmissionWindowBar({ progress, label }: { progress: number; label: string }) {
  return (
    <View className="gap-2">
      <View className="h-1.5 overflow-hidden rounded-full bg-muted">
        <View className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>
      <Text variant="muted" className="text-center text-xs">
        {label}
      </Text>
    </View>
  );
}

function SheetAction({
  icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <HapticPressable className="flex-row items-center gap-3 p-4 active:bg-muted" onPress={onPress}>
      <Icon as={icon} className="size-5 text-foreground" />
      <Text className="text-base text-foreground">{label}</Text>
    </HapticPressable>
  );
}
