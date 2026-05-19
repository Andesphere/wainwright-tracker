import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function getClerkPublishableKey() {
  if (!clerkPublishableKey) {
    throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  return clerkPublishableKey;
}

const resolvedClerkPublishableKey = getClerkPublishableKey();

if (!resolvedClerkPublishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
}

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={resolvedClerkPublishableKey}
      tokenCache={tokenCache}
    >
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="dark" />
    </ClerkProvider>
  );
}
