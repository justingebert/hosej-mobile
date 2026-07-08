import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { UserSettingsScreen } from "@/components/settings/user-settings-screen";

// Settings is a native modal (presentation: "modal" in root-navigator). The root
// bottom-sheet and safe-area providers live below the modal window, so scope them
// here for portal placement and modal-window insets.
export default function SettingsRoute() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <UserSettingsScreen />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
