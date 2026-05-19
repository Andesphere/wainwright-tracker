import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

function getClerkPublishableKey() {
  if (!clerkPublishableKey) {
    throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  return clerkPublishableKey;
}

function getConvexUrl() {
  if (!convexUrl) {
    throw new Error("Missing EXPO_PUBLIC_CONVEX_URL");
  }

  return convexUrl;
}

const resolvedClerkPublishableKey = getClerkPublishableKey();
const convex = new ConvexReactClient(getConvexUrl());

if (!resolvedClerkPublishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
}

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={resolvedClerkPublishableKey}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="dark" />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
