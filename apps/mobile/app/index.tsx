import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/expo";
import { AuthView, UserButton } from "@clerk/expo/native";
import { useMutation, useQuery } from "convex/react";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ColorValue,
} from "react-native";
import {
  AREAS,
  TOTAL_WAINWRIGHTS,
  WAINWRIGHTS,
  type Wainwright,
} from "@wainwrights/catalog/wainwrights";
import { api } from "@wainwrights/backend/convex/_generated/api";

const STORAGE_KEY = "wainwrightsbaggers:completed:v1";
const ALL_AREAS = "All areas";
const STATUS_FILTERS = ["all", "todo", "done"] as const;
const AREA_COLORS: Record<string, ColorValue> = {
  Central: "#d69230",
  Eastern: "#587d4d",
  "Far Eastern": "#387b8c",
  Northern: "#5965a8",
  "North Western": "#8b5f46",
  Southern: "#a34848",
  Western: "#6e6f42",
};

type StatusFilter = (typeof STATUS_FILTERS)[number];

function loadCompletedIds() {
  return SecureStore.getItemAsync(STORAGE_KEY)
    .then((stored) => new Set<string>(stored ? JSON.parse(stored) : []))
    .catch(() => new Set<string>());
}

function saveCompletedIds(completedIds: Set<string>) {
  return SecureStore.setItemAsync(
    STORAGE_KEY,
    JSON.stringify(Array.from(completedIds).sort()),
  );
}

function validCompletedIds(ids: string[]) {
  const validIds = new Set(WAINWRIGHTS.map((peak) => peak.id));
  return ids.filter((id) => validIds.has(id));
}

function sortedCompletedIds(completedIds: Set<string>) {
  return Array.from(completedIds).sort();
}

function matchesSearch(peak: Wainwright, query: string) {
  const target =
    `${peak.name} ${peak.area} ${peak.gridReference}`.toLowerCase();
  return target.includes(query.trim().toLowerCase());
}

function formatStatusLabel(status: StatusFilter) {
  return status === "todo" ? "To do" : status === "done" ? "Done" : "All";
}

export default function WainwrightsMobileScreen() {
  const { isLoaded, isSignedIn } = useAuth({
    treatPendingAsSignedOut: false,
  });
  const { signOut } = useClerk();
  const { user } = useUser();
  const [completedIds, setCompletedIds] = useState(() => new Set<string>());
  const [localProgressLoaded, setLocalProgressLoaded] = useState(false);
  const [areaFilter, setAreaFilter] = useState(ALL_AREAS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const progress = useQuery(api.progress.get, isSignedIn ? {} : "skip");
  const replaceProgress = useMutation(api.progress.replace);
  const setBagged = useMutation(api.progress.setBagged);
  const mergedLocalProgressRef = useRef(false);

  useEffect(() => {
    void loadCompletedIds().then((storedCompletedIds) => {
      setCompletedIds(storedCompletedIds);
      setLocalProgressLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (
      !isSignedIn ||
      !localProgressLoaded ||
      !progress ||
      mergedLocalProgressRef.current
    ) {
      return;
    }

    mergedLocalProgressRef.current = true;

    const serverCompletedIds = new Set(validCompletedIds(progress));
    const mergedCompletedIds = new Set([
      ...serverCompletedIds,
      ...validCompletedIds(sortedCompletedIds(completedIds)),
    ]);

    setCompletedIds(mergedCompletedIds);
    void saveCompletedIds(mergedCompletedIds);

    if (mergedCompletedIds.size === serverCompletedIds.size) return;

    void replaceProgress({
      completed: sortedCompletedIds(mergedCompletedIds),
    });
  }, [
    completedIds,
    isSignedIn,
    localProgressLoaded,
    progress,
    replaceProgress,
  ]);

  const completedCount = completedIds.size;
  const completionPercent = Math.round(
    (completedCount / TOTAL_WAINWRIGHTS) * 100,
  );
  const visiblePeaks = useMemo(
    () =>
      WAINWRIGHTS.filter((peak) => {
        const isDone = completedIds.has(peak.id);
        const areaMatches =
          areaFilter === ALL_AREAS || peak.area === areaFilter;
        const statusMatches =
          statusFilter === "all" ||
          (statusFilter === "done" ? isDone : !isDone);

        return areaMatches && statusMatches && matchesSearch(peak, query);
      }).sort((first, second) => first.bookNumber - second.bookNumber),
    [areaFilter, completedIds, query, statusFilter],
  );

  const togglePeak = (peakId: string) => {
    const nextCompletedIds = new Set(completedIds);
    const wasCompleted = nextCompletedIds.has(peakId);

    if (wasCompleted) {
      nextCompletedIds.delete(peakId);
    } else {
      nextCompletedIds.add(peakId);
    }

    setCompletedIds(nextCompletedIds);
    void saveCompletedIds(nextCompletedIds);
    void setBagged({ bagged: !wasCompleted, id: peakId }).catch(() => {
      setCompletedIds(completedIds);
      void saveCompletedIds(completedIds);
    });
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f5f1e7] px-6">
        <ActivityIndicator size="large" color="#3f6d53" />
        <Text className="mt-4 text-base font-semibold text-[#3f483d]">
          Loading Wainwrights Baggers
        </Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return <AuthView mode="signInOrUp" />;
  }

  return (
    <View className="flex-1 bg-[#f5f1e7]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-10 pt-16"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-3">
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-[3px] text-[#567055]">
                Wainwrights Baggers
              </Text>
              <Text className="mt-2 text-sm font-medium text-[#5b675a]">
                Signed in as{" "}
                {user?.primaryEmailAddress?.emailAddress ?? "your account"}
              </Text>
            </View>
            <View className="h-11 w-11 overflow-hidden rounded-full bg-[#233527]">
              <UserButton />
            </View>
          </View>
          <Text className="text-4xl font-semibold text-[#18231b]">
            Track the 214 fells
          </Text>
          <Text className="text-base leading-6 text-[#5b675a]">
            Mark summits off as you walk them. Your signed-in session is stored
            securely, and progress syncs with your web account.
          </Text>
        </View>

        <View className="gap-4 rounded-lg border border-[#d9d0be] bg-[#fffaf0] p-4">
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-5xl font-semibold text-[#18231b]">
                {completedCount}
              </Text>
              <Text className="text-sm font-medium text-[#677064]">
                of {TOTAL_WAINWRIGHTS} completed
              </Text>
            </View>
            <Text className="text-3xl font-semibold text-[#3f6d53]">
              {completionPercent}%
            </Text>
          </View>
          <View className="h-3 overflow-hidden rounded-full bg-[#e4ddcf]">
            <View
              className="h-full rounded-full bg-[#3f6d53]"
              style={{ width: `${completionPercent}%` }}
            />
          </View>
        </View>

        <View className="gap-3">
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            className="rounded-lg border border-[#d1c7b5] bg-white px-4 py-4 text-base text-[#18231b]"
            onChangeText={setQuery}
            placeholder="Search fell, area, or grid reference"
            placeholderTextColor="#837a6b"
            value={query}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {[ALL_AREAS, ...AREAS].map((area) => {
              const isActive = areaFilter === area;

              return (
                <Pressable
                  accessibilityRole="button"
                  className={`rounded-full border px-4 py-2 ${
                    isActive
                      ? "border-[#233527] bg-[#233527]"
                      : "border-[#d1c7b5] bg-white"
                  }`}
                  key={area}
                  onPress={() => setAreaFilter(area)}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isActive ? "text-white" : "text-[#3f483d]"
                    }`}
                  >
                    {area}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="flex-row gap-2">
            {STATUS_FILTERS.map((status) => {
              const isActive = statusFilter === status;

              return (
                <Pressable
                  accessibilityRole="button"
                  className={`flex-1 rounded-lg border py-3 ${
                    isActive
                      ? "border-[#3f6d53] bg-[#3f6d53]"
                      : "border-[#d1c7b5] bg-white"
                  }`}
                  key={status}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text
                    className={`text-center text-sm font-semibold ${
                      isActive ? "text-white" : "text-[#3f483d]"
                    }`}
                  >
                    {formatStatusLabel(status)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-sm font-semibold text-[#5b675a]">
            Showing {visiblePeaks.length} fells
          </Text>
          {visiblePeaks.map((peak) => {
            const isDone = completedIds.has(peak.id);

            return (
              <Pressable
                accessibilityLabel={`${peak.name}, ${isDone ? "completed" : "not completed"}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isDone }}
                className={`rounded-lg border p-4 ${
                  isDone
                    ? "border-[#9bb08c] bg-[#eef5e8]"
                    : "border-[#d9d0be] bg-white"
                }`}
                key={peak.id}
                onPress={() => togglePeak(peak.id)}
              >
                <View className="flex-row items-start gap-3">
                  <View
                    className={`mt-1 h-6 w-6 items-center justify-center rounded-full border ${
                      isDone
                        ? "border-[#3f6d53] bg-[#3f6d53]"
                        : "border-[#b8ae9c] bg-white"
                    }`}
                  >
                    <Text className="text-[10px] font-bold text-white">
                      {isDone ? "OK" : ""}
                    </Text>
                  </View>
                  <View className="flex-1 gap-2">
                    <View className="flex-row items-start justify-between gap-3">
                      <Text className="flex-1 text-lg font-semibold text-[#18231b]">
                        {peak.bookNumber}. {peak.name}
                      </Text>
                      <Text className="text-sm font-semibold text-[#576155]">
                        {peak.heightMetres}m
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap items-center gap-2">
                      <View
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: AREA_COLORS[peak.area] }}
                      />
                      <Text className="text-sm text-[#637061]">
                        {peak.area}
                      </Text>
                      <Text className="text-sm text-[#978d7e]">/</Text>
                      <Text className="text-sm text-[#637061]">
                        {peak.gridReference}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          className="rounded-lg border border-[#d1c7b5] bg-white py-4"
          onPress={() => void signOut()}
        >
          <Text className="text-center text-sm font-semibold text-[#3f483d]">
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
