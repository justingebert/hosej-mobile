import "../global.css";

import * as SplashScreen from "expo-splash-screen";
import { AppProviders } from "@/components/navigation/app-providers";
import { RootNavigator } from "@/components/navigation/root-navigator";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://306a6866a3403f8c50f1e47a537cbc1a@o4511224419057664.ingest.de.sentry.io/4511687548534864',

  enabled: !__DEV__,
  environment: __DEV__ ? 'development' : 'production',

  enableLogs: true,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export const unstable_settings = {
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

export default Sentry.wrap(RootLayout);
