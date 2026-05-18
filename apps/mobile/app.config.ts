import type { ExpoConfig } from "expo/config";

const appScheme = process.env.EXPO_PUBLIC_APP_SCHEME ?? "wainwrightsbaggers";

const config: ExpoConfig = {
  name: "Wainwrights Baggers",
  slug: "wainwrightsbaggers-mobile",
  scheme: appScheme,
  version: "0.1.0",
  platforms: ["ios"],
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: "com.wainwrightsbaggers.mobile",
    supportsTablet: true,
  },
  plugins: ["expo-router", "expo-secure-store"],
};

export default config;
