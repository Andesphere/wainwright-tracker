import { Text, View } from "react-native";

export default function MobileTemplateScreen() {
  return (
    <View className="flex-1 bg-[#f3f1e4] px-6 pt-20">
      <Text className="text-sm font-semibold uppercase tracking-[3px] text-[#3e6e54]">
        Wainwrights Baggers
      </Text>
      <Text className="mt-4 text-4xl font-semibold text-[#112318]">
        Mobile journal template
      </Text>
      <Text className="mt-4 text-base leading-7 text-[#53695e]">
        This is the initial native shell for the future Clerk-backed mobile app.
        The product workflows are intentionally not wired yet.
      </Text>
    </View>
  );
}
