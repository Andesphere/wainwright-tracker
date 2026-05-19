import type { ExpoConfig } from "expo/config";

const appScheme = process.env.EXPO_PUBLIC_APP_SCHEME ?? "wainwrightsbaggers";

const config: ExpoConfig = {
  name: "Wainwrights Baggers",
  slug: "wainwrightsbaggers-mobile",
  owner: "aljorgevi",
  scheme: appScheme,
  version: "0.1.0",
  platforms: ["ios"],
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: "com.wainwrightsbaggers.mobile",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    supportsTablet: true,
  },
  extra: {
    eas: {
      projectId: "c6c22670-bf5b-4143-acf6-2fc6303ea30e",
    },
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    "@clerk/expo",
  ],
};

export default config;
