import "../global.css";

import * as SplashScreen from "expo-splash-screen";
import { AppProviders } from "@/components/navigation/app-providers";
import { RootNavigator } from "@/components/navigation/root-navigator";

export const unstable_settings = {
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
