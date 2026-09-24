"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";

import { FeatureErrorBoundary } from "@/components/error-boundary";
import { api } from "@wainwrights/backend/convex/_generated/api";
import type { Id } from "@wainwrights/backend/convex/_generated/dataModel";
import {
  addPhotoMetadata,
  compressImageFile,
  type WainwrightPhotoMetadata,
} from "@/photoCompression";
import { WHOLE_HISTORY_ALBUM, buildWainwrightAlbums } from "@/albums";
import { AccountView } from "./AccountView";
import { BottomSheet, type Detent } from "./BottomSheet";
import { BrowseHeader, BrowseView } from "./Browse";
import { BulkImportTools } from "./BulkImport";
import { FellCard } from "./FellCard";
import { FellMap, type CameraRequest, type Padding } from "./FellMap";
import {
  browseFells,
  FELLS_BY_ID,
  WAINWRIGHTS,
  type Book,
  type StatusFilter,
  type Wainwright,
} from "./fells";
import {
  AlbumPage,
  CompletionDialog,
  useMediaQuery,
  type CompletionEntry,
  type CompletionMetadata,
} from "./journal";
import {
  forcedLightPreset,
  lightPreset as sunPreset,
  type LightPreset,
} from "./lightClock";
import type { MapLayer } from "./mapLayers";
import {
  FeedbackDialog,
  PeopleDiscoverySheet,
  ProfileOnboardingGate,
  ProfileSettingsCard,
  type BaggerSummary,
  type CurrentProfile,
  type ProfileFormValues,
} from "./people";
import { ProUpsell, type ProFeature } from "./Pro";
import { computeStats } from "./stats";
import { Screen, StatsView } from "./StatsView";
import "./tracker.css";

const LEGACY_PROGRESS_KEY = "wainwright-tracker:v1:completed";
const MAP_LAYER_KEY = "wainwright-tracker:v2:map-layer";
const VALID_IDS = new Set(WAINWRIGHTS.map((fell) => fell.id));
const PANEL_WIDTH = 400;
const PANEL_GAP = 16;
const PEEK = 118;
const CARD = 360;

type ScreenId = "journal" | "stats" | "account";

function loadLegacyProgress() {
  try {
    const raw = localStorage.getItem(LEGACY_PROGRESS_KEY);
    return (raw ? (JSON.parse(raw) as string[]) : []).filter((id) =>
      VALID_IDS.has(id),
    );
  } catch {
    return [];
  }
}

function loadMapLayer(): MapLayer {
  const stored = localStorage.getItem(MAP_LAYER_KEY);
  return stored === "satellite" || stored === "contours" ? stored : "standard";
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ConvexError
    ? ((error.data as { message?: string })?.message ?? fallback)
    : fallback;

function useViewportHeight() {
  const [height, setHeight] = useState(() => window.innerHeight);
  useEffect(() => {
    const update = () =>
      setHeight(window.visualViewport?.height ?? window.innerHeight);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);
  return height;
}

/** Map lighting from the sun over the Lakes, refreshed every five minutes and on return to the tab. */
function useLightPreset() {
  const forced = useMemo(() => forcedLightPreset(window.location.search), []);
  const [preset, setPreset] = useState<LightPreset>(
    () => forced ?? sunPreset(),
  );
  useEffect(() => {
    if (forced) return;
    const update = () => setPreset(sunPreset());
    const timer = window.setInterval(update, 5 * 60_000);
    const onVisible = () => document.visibilityState === "visible" && update();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [forced]);
  return preset;
}

/**
 * The web tracker, built like the iPhone app: a full-bleed 3D map with a floating glass panel
 * (desktop) or an Apple Maps style bottom sheet (phone) holding search, progress, the seven books,
 * the list and the fell card. Pro features read `billing.mine`; free walkers see them locked.
 */
export function TrackerApp() {
  const { user } = useUser();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const viewportHeight = useViewportHeight();
  const lightPreset = useLightPreset();

  const progress = useQuery(api.progress.get);
  const progressEntries = useQuery(api.progress.getEntries);
  const proSummary = useQuery(api.billing.mine);
  const currentProfile = useQuery(api.social.getCurrentProfile) as
    | CurrentProfile
    | null
    | undefined;
  const setBagged = useMutation(api.progress.setBagged);
  const addBagged = useMutation(api.progress.addBagged);
  const resetBagged = useMutation(api.progress.reset);
  const generatePhotoUploadUrl = useMutation(
    api.progress.generatePhotoUploadUrl,
  );
  const deleteMyData = useMutation(api.account.deleteMyData);
  const followBagger = useMutation(api.social.follow);
  const unfollowBagger = useMutation(api.social.unfollow);
  const upsertCurrentProfile = useMutation(api.social.upsertCurrentProfile);
  const completeOnboarding = useMutation(api.social.completeOnboarding);
  const updateProfileSettings = useMutation(api.social.updateProfileSettings);

  const [optimistic, setOptimistic] = useState<Map<string, boolean>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [book, setBook] = useState<Book | null>(null);
  const [layer, setLayer] = useState<MapLayer>(loadMapLayer);
  const [cameraRequest, setCameraRequest] = useState<CameraRequest | null>(
    null,
  );
  const [detent, setDetent] = useState("peek");
  const [upsell, setUpsell] = useState<ProFeature | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [screen, setScreen] = useState<ScreenId | null>(null);
  const [editing, setEditing] = useState<Wainwright | null>(null);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [selectedBaggerId, setSelectedBaggerId] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedAlbumKey, setSelectedAlbumKey] = useState(WHOLE_HISTORY_ALBUM);
  const cameraId = useRef(0);
  const trackedAccount = useRef<string | null>(null);
  const migrated = useRef(false);

  const isPro = proSummary?.pro ?? false;
  const bagged = useMemo(() => {
    const ids = new Set((progress ?? []).filter((id) => VALID_IDS.has(id)));
    for (const [id, value] of optimistic) {
      if (value) ids.add(id);
      else ids.delete(id);
    }
    return ids;
  }, [optimistic, progress]);
  const entries = useMemo(
    () =>
      ((progressEntries ?? []) as CompletionEntry[]).filter(
        (entry) => VALID_IDS.has(entry.id) && bagged.has(entry.id),
      ),
    [bagged, progressEntries],
  );
  const entriesById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries],
  );
  const results = useMemo(
    () => browseFells({ bagged, book, query, status }),
    [bagged, book, query, status],
  );
  const albums = useMemo(
    () => buildWainwrightAlbums(WAINWRIGHTS, entries),
    [entries],
  );
  const stats = useMemo(
    () => computeStats([...bagged].map((id) => entriesById.get(id) ?? { id })),
    [bagged, entriesById],
  );
  const photoCount = entries.reduce(
    (total, entry) => total + (entry.photos?.length ?? 0),
    0,
  );
  const selected = selectedId ? (FELLS_BY_ID.get(selectedId) ?? null) : null;

  const baggerResults =
    (useQuery(
      api.social.searchBaggers,
      peopleOpen ? { query: peopleQuery } : "skip",
    ) as BaggerSummary[] | undefined) ?? [];
  const selectedBaggerProfile = useQuery(
    api.social.getProfile,
    selectedBaggerId ? { userId: selectedBaggerId } : "skip",
  ) as BaggerSummary | null | undefined;

  // Layout: the phone sheet's detents, and where the panel or sheet covers the map.
  const large = Math.max(PEEK + 120, viewportHeight - 64);
  const medium = Math.round(
    Math.min(large, Math.max(PEEK + 200, viewportHeight * 0.5)),
  );
  const detents: Detent[] = selected
    ? [
        { id: "peek", height: PEEK },
        { id: "card", height: Math.min(CARD, large) },
        { id: "large", height: large },
      ]
    : [
        { id: "peek", height: PEEK },
        { id: "medium", height: medium },
        { id: "large", height: large },
      ];
  const activeDetent = detents.some((item) => item.id === detent)
    ? detent
    : "peek";
  const padding = (bottom: number): Padding =>
    isDesktop
      ? { top: 0, right: 0, bottom: 0, left: PANEL_WIDTH + PANEL_GAP * 2 }
      : { top: 0, right: 0, left: 0, bottom: bottom + 8 };

  // The tracker's colours live on <html> while it is mounted, so portalled dialogs share them.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("wb-tracker-root");
    return () => root.classList.remove("wb-tracker-root", "dark");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", prefersDark);
  }, [prefersDark]);

  useEffect(() => {
    localStorage.setItem(MAP_LAYER_KEY, layer);
  }, [layer]);

  useEffect(() => {
    void upsertCurrentProfile();
  }, [upsertCurrentProfile]);

  // Tell Andes Relay about the account once per session.
  useEffect(() => {
    if (!user || trackedAccount.current === user.id) return;
    trackedAccount.current = user.id;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;
    void fetch("/api/relay/account-created", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        email,
        name: user.fullName ?? user.username ?? undefined,
      }),
    }).catch((error) =>
      console.warn("Failed to track Andes Relay account creation", error),
    );
  }, [user]);

  // Fells saved in this browser before accounts existed move to the account once.
  useEffect(() => {
    if (!progress || migrated.current || progress.length > 0) return;
    migrated.current = true;
    const local = loadLegacyProgress();
    if (local.length === 0) return;
    void addBagged({ ids: local }).then(() =>
      toast.success(`Imported ${local.length} saved fells`),
    );
  }, [addBagged, progress]);

  // Escape closes the fell card when nothing else is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !selectedId) return;
      if (document.querySelector("[role=dialog]")) return;
      setSelectedId(null);
      setDetent("peek");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const requestCamera = (target: CameraRequest["target"], bottom: number) => {
    cameraId.current += 1;
    setCameraRequest({
      id: cameraId.current,
      padding: padding(bottom),
      target,
    });
  };

  const select = (id: string) => {
    setSelectedId(id);
    setDetent("card");
    requestCamera({ fell: id }, Math.min(CARD, large));
  };

  const clearSelection = () => {
    if (!selectedId) return;
    setSelectedId(null);
    setDetent("peek");
  };

  const toggleBook = (next: Book) => {
    if (book?.number === next.number) {
      setBook(null);
      return;
    }
    setBook(next);
    requestCamera({ book: next }, isDesktop ? 0 : medium);
  };

  const showUpsell = (feature: ProFeature) => {
    setUpsell(feature);
    setUpsellOpen(true);
  };

  const openPro = (target: "journal" | "stats") => {
    if (isPro) setScreen(target);
    else showUpsell(target === "journal" ? "albums" : "stats");
  };

  const setOptimisticBag = (id: string, value: boolean | null) =>
    setOptimistic((previous) => {
      const next = new Map(previous);
      if (value === null) next.delete(id);
      else next.set(id, value);
      return next;
    });

  const bag = async (fell: Wainwright, completedAt: string) => {
    setOptimisticBag(fell.id, true);
    try {
      await setBagged({ id: fell.id, bagged: true, completedAt });
      toast.success(`${fell.name} bagged`);
    } catch (error) {
      toast.error(
        errorMessage(
          error,
          `Could not save ${fell.name}. Check your connection and try again.`,
        ),
      );
    } finally {
      setOptimisticBag(fell.id, null);
    }
  };

  const unbag = async (fell: Wainwright) => {
    setOptimisticBag(fell.id, false);
    try {
      await setBagged({ id: fell.id, bagged: false });
      toast(`${fell.name} marked as not bagged`);
    } catch (error) {
      toast.error(
        errorMessage(error, "Could not save progress. Please try again."),
      );
    } finally {
      setOptimisticBag(fell.id, null);
    }
  };

  const uploadPhotos = async (files: File[]) => {
    const uploaded: WainwrightPhotoMetadata[] = [];
    for (const file of files) {
      const compressed = await compressImageFile(file);
      const uploadUrl = await generatePhotoUploadUrl({});
      const upload = await fetch(uploadUrl, {
        body: compressed,
        headers: { "Content-Type": compressed.type },
        method: "POST",
      });
      if (!upload.ok) throw new Error("Upload failed");
      const { storageId } = (await upload.json()) as { storageId: string };
      uploaded.push({
        mimeType: compressed.type,
        originalName: file.name,
        sizeBytes: compressed.size,
        storageId,
        uploadedAt: new Date().toISOString(),
      });
    }
    return uploaded;
  };

  /** Saves the date, note and photos of a bagged fell (Pro). */
  const saveJournal = async (
    fell: Wainwright,
    metadata: CompletionMetadata,
    files: File[],
  ) => {
    try {
      const uploaded = await uploadPhotos(files);
      const photos = uploaded.reduce(
        (next, photo) => addPhotoMetadata(next, photo),
        metadata.photos ?? entriesById.get(fell.id)?.photos ?? [],
      );
      await setBagged({
        id: fell.id,
        bagged: true,
        completedAt: metadata.completedAt,
        note: metadata.note,
        photos: photos.map(
          ({ mimeType, originalName, sizeBytes, storageId, uploadedAt }) => ({
            mimeType,
            originalName,
            sizeBytes,
            storageId: storageId as Id<"_storage">,
            uploadedAt,
          }),
        ),
      });
      toast.success("Journal saved");
    } catch (error) {
      toast.error(
        errorMessage(
          error,
          error instanceof Error
            ? error.message
            : "Could not save. Please try again.",
        ),
      );
      throw error;
    }
  };

  const bulkAdd = async (ids: string[]) => {
    try {
      await addBagged({ ids });
      toast.success(`Added ${ids.length} bagged fells`);
    } catch {
      toast.error("Could not save imported fells. Please try again.");
      throw new Error("Bulk import failed");
    }
  };

  const resetProgress = () => {
    if (bagged.size === 0) return;
    void resetBagged({})
      .then(() => toast("Journal reset"))
      .catch(() => toast.error("Could not reset progress. Please try again."));
  };

  const handleToggleFollow = async (bagger: BaggerSummary) => {
    await (bagger.isFollowing ? unfollowBagger : followBagger)({
      userId: bagger.userId,
    });
    toast.success(
      bagger.isFollowing
        ? `Unfollowed ${bagger.displayName}`
        : `Following ${bagger.displayName}`,
    );
  };

  const panelContent = selected ? (
    <FellCard
      key={selected.id}
      baggedCount={bagged.size}
      entry={entriesById.get(selected.id)}
      fell={selected}
      isBagged={bagged.has(selected.id)}
      isPro={isPro}
      onBag={(date) => bag(selected, date)}
      onClose={clearSelection}
      onEditJournal={() => setEditing(selected)}
      onUnbag={() => void unbag(selected)}
      onUpsell={showUpsell}
    />
  ) : (
    <BrowseView
      bagged={bagged}
      book={book}
      isPro={isPro}
      onBook={toggleBook}
      onJournal={() => openPro("journal")}
      onSelect={(fell) => {
        setQuery("");
        select(fell.id);
      }}
      onStats={() => openPro("stats")}
      photoCount={photoCount}
      query={query}
      results={results}
      selectedId={selectedId}
      setStatus={setStatus}
      status={status}
    />
  );

  const header = selected ? null : (
    <BrowseHeader
      avatarUrl={user?.imageUrl}
      onAccount={() => setScreen("account")}
      onFocus={() => !isDesktop && setDetent("large")}
      query={query}
      setQuery={setQuery}
    />
  );

  const mapInsets = isDesktop
    ? {
        "--wb-map-inset-left": `${PANEL_WIDTH + PANEL_GAP * 2}px`,
        "--wb-map-inset-bottom": "0px",
      }
    : {
        "--wb-map-inset-left": "0px",
        "--wb-map-inset-bottom": `${PEEK + 8}px`,
      };

  return (
    <main className="wb-tracker" style={mapInsets as React.CSSProperties}>
      <h1 className="sr-only">Wainwrights Baggers</h1>
      <FellMap
        bagged={bagged}
        book={book}
        cameraRequest={cameraRequest}
        homePadding={padding(PEEK)}
        isPro={isPro}
        layer={layer}
        lightPreset={lightPreset}
        onBackgroundTap={clearSelection}
        onLayer={setLayer}
        onLockedLayer={() => showUpsell("layers")}
        onNotice={(message) => toast(message)}
        onSelect={select}
        selectedId={selectedId}
      />

      {isDesktop ? (
        <aside
          className="wb-glass absolute z-20 flex flex-col overflow-hidden rounded-[28px]"
          style={{
            top: PANEL_GAP,
            bottom: PANEL_GAP,
            left: PANEL_GAP,
            width: PANEL_WIDTH,
          }}
          aria-label={selected ? `${selected.name} details` : "Fells"}
        >
          {header ? <div className="pt-2">{header}</div> : null}
          <div className="wb-panel-scroll min-h-0 flex-1 overflow-y-auto">
            {panelContent}
          </div>
        </aside>
      ) : (
        <BottomSheet
          detent={activeDetent}
          detents={detents}
          header={header}
          label={selected ? `${selected.name} details` : "Fells"}
          onDetent={setDetent}
        >
          {panelContent}
        </BottomSheet>
      )}

      <ProUpsell
        feature={upsell}
        open={upsellOpen}
        onOpenChange={setUpsellOpen}
      />

      <Screen
        open={screen === "journal" && isPro}
        onOpenChange={(open) => !open && setScreen(null)}
        title="Journal"
        description="Your bagged fells as albums by day, with photos, and a printable PDF."
      >
        <AlbumPage
          albums={albums}
          onEdit={(peak) => setEditing(peak)}
          selectedAlbumKey={
            selectedAlbumKey === WHOLE_HISTORY_ALBUM ||
            albums.some((album) => album.dateKey === selectedAlbumKey)
              ? selectedAlbumKey
              : WHOLE_HISTORY_ALBUM
          }
          onSelectedAlbumKey={setSelectedAlbumKey}
        />
      </Screen>

      <Screen
        open={screen === "stats" && isPro}
        onOpenChange={(open) => !open && setScreen(null)}
        title="Stats"
        description="Years, books and records from your bagged fells."
      >
        <StatsView stats={stats} />
      </Screen>

      <Screen
        open={screen === "account"}
        onOpenChange={(open) => !open && setScreen(null)}
        title="Account"
        description="Your profile, Pro, community settings, tools and account."
      >
        <AccountView
          baggedCount={bagged.size}
          community={
            currentProfile ? (
              <ProfileSettingsCard
                profile={currentProfile}
                onSave={async (values: ProfileFormValues) => {
                  await updateProfileSettings(values);
                  toast.success("Profile privacy saved");
                }}
              />
            ) : null
          }
          onDeleteData={async () => {
            await deleteMyData({});
          }}
          onFeedback={() => setFeedbackOpen(true)}
          onJournal={() => setScreen("journal")}
          onPeople={() => setPeopleOpen(true)}
          onStats={() => setScreen("stats")}
          onUpsell={() => showUpsell("journal")}
          pro={proSummary ?? { pro: false }}
          tools={
            <BulkImportTools
              completed={bagged}
              onBulkAdd={bulkAdd}
              onReset={resetProgress}
            />
          }
        />
      </Screen>

      <CompletionDialog
        key={editing?.id ?? "closed"}
        initialMetadata={editing ? entriesById.get(editing.id) : undefined}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={(metadata, files) =>
          editing
            ? saveJournal(editing, metadata, files).then(() => setEditing(null))
            : Promise.resolve()
        }
        open={Boolean(editing)}
        peak={editing}
        photos={editing ? (entriesById.get(editing.id)?.photos ?? []) : []}
      />

      <FeatureErrorBoundary>
        <PeopleDiscoverySheet
          open={peopleOpen}
          onOpenChange={(open) => {
            setPeopleOpen(open);
            if (!open) setSelectedBaggerId(null);
          }}
          query={peopleQuery}
          onQuery={setPeopleQuery}
          results={baggerResults}
          selectedProfile={selectedBaggerProfile}
          selectedUserId={selectedBaggerId}
          onSelectProfile={setSelectedBaggerId}
          onToggleFollow={(bagger) => void handleToggleFollow(bagger)}
        />
      </FeatureErrorBoundary>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <ProfileOnboardingGate
        profile={currentProfile}
        onComplete={async (values: ProfileFormValues) => {
          await completeOnboarding(values);
          toast.success("Profile setup complete");
        }}
      />
    </main>
  );
}
