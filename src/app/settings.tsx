import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { UserSettingsScreen } from "@/components/settings/user-settings-screen";

// Settings is a native modal (presentation: "modal" in root-navigator). The root
// BottomSheetModalProvider lives below the modal window, so a sheet presented from
// here portals *behind* the modal. Scope a provider to the modal so the avatar
// picker's sheet renders within it.
export default function SettingsRoute() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <UserSettingsScreen />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
