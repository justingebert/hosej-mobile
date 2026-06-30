import * as SecureStore from "expo-secure-store";

// Whether the user has seen the onboarding walkthrough. Stored on-device (not on
// the user) so it needs no API round-trip and works offline — see session.ts for
// the other SecureStore keys. Per-device by design: a fresh device re-shows it.
const SEEN_KEY = "hosej.onboardingSeen";

export async function getOnboardingSeen(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(SEEN_KEY)) === "1";
  } catch {
    // SecureStore unavailable (e.g. web) — treat as unseen.
    return false;
  }
}

export async function setOnboardingSeen(): Promise<void> {
  try {
    await SecureStore.setItemAsync(SEEN_KEY, "1");
  } catch {
    // Non-fatal: onboarding just re-shows on the next launch.
  }
}

/** Dev-only: clear the flag so the auto-present first-run path can be re-tested. */
export async function clearOnboardingSeen(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SEEN_KEY);
  } catch {
    // Ignore.
  }
}
