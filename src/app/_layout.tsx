import "../global.css";

import * as SplashScreen from "expo-splash-screen";
import { AppProviders } from "@/components/navigation/app-providers";
import { RootNavigator } from "@/components/navigation/root-navigator";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://306a6866a3403f8c50f1e47a537cbc1a@o4511224419057664.ingest.de.sentry.io/4511687548534864',

  // Don't report from local dev; tag everything else so TestFlight/prod issues
  // are filterable and separate from dev noise.
  enabled: !__DEV__,
  environment: __DEV__ ? 'development' : 'production',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

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
