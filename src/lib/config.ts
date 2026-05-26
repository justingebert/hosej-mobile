import Constants from "expo-constants";

const DEV_API_PORT = 3000;

function devApiUrlFromExpoHost(): string {
  const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
  return `http://${host}:${DEV_API_PORT}`;
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? devApiUrlFromExpoHost();
