import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { HelpScreen } from "@/components/help/help-screen";

export default function HelpRoute() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <HelpScreen />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
