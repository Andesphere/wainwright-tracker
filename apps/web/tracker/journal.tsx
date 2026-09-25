import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  PencilEdit02Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MAX_PHOTOS_PER_WAINWRIGHT,
  removePhotoMetadata,
  validatePhotoSelectionLimit,
  type WainwrightPhotoMetadata,
} from "@/photoCompression";
import {
  WHOLE_HISTORY_ALBUM,
  buildWainwrightAlbums,
  flattenAlbumsChronologically,
  formatAlbumDateLabel,
  getProgressivelyDisclosedAlbums,
  type WainwrightAlbumItem,
} from "@/albums";
import {
  buildAlbumExportDocument,
  openAlbumPrintWindow,
  type AlbumExportLayout,
} from "@/albumExport";
import type { Wainwright } from "@wainwrights/catalog/wainwrights";
import { heightLabel } from "./fells";
import { StatPill } from "./people";

export type CompletionEntry = {
  completedAt?: string;
  id: string;
  note?: string;
  photos?: WainwrightPhotoMetadata[];
};
export type CompletionMetadata = Omit<CompletionEntry, "id">;
type PendingPhoto = {
  file: File;
  id: string;
  previewUrl: string;
};

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const handleChange = () => setMatches(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

export function AlbumPage({
  albums,
  onEdit,
  onSelectedAlbumKey,
  selectedAlbumKey,
}: {
  albums: ReturnType<typeof buildWainwrightAlbums>;
  onEdit: (peak: Wainwright) => void;
  onSelectedAlbumKey: (key: string) => void;
  selectedAlbumKey: string;
}) {
  const [albumListExpanded, setAlbumListExpanded] = useState(false);
  const [exportLayout, setExportLayout] =
    useState<AlbumExportLayout>("portraitPair");
  const [coverTopoMap, setCoverTopoMap] = useState(true);
  const [dayMiniMaps, setDayMiniMaps] = useState(true);
  const wholeHistoryItems = flattenAlbumsChronologically(albums);
  const isWholeHistory = selectedAlbumKey === WHOLE_HISTORY_ALBUM;
  const selectedAlbum = albums.find(
    (album) => album.dateKey === selectedAlbumKey,
  );
  const visibleItems =
    selectedAlbumKey === WHOLE_HISTORY_ALBUM
      ? wholeHistoryItems
      : (selectedAlbum?.items ?? []);
  const disclosedAlbums = getProgressivelyDisclosedAlbums(
    albums,
    selectedAlbumKey,
    albumListExpanded,
  );
  const hiddenAlbumCount = Math.max(albums.length - disclosedAlbums.length, 0);
  const title =
    selectedAlbumKey === WHOLE_HISTORY_ALBUM
      ? "Whole history"
      : formatAlbumDateLabel(selectedAlbumKey);
  const photoCount = visibleItems.reduce(
    (total, item) => total + (item.entry.photos?.length ?? 0),
    0,
  );
  const exportSubtitle =
    selectedAlbumKey === WHOLE_HISTORY_ALBUM
      ? `${visibleItems.length} Wainwrights across ${albums.length} dated album${albums.length === 1 ? "" : "s"}.`
      : `${visibleItems.length} Wainwright${visibleItems.length === 1 ? "" : "s"} bagged on ${title}.`;

  const exportDayGroups = isWholeHistory
    ? [...albums]
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .map((album) => ({
          dateKey: album.dateKey,
          items: album.items,
        }))
    : selectedAlbum
      ? [{ dateKey: selectedAlbum.dateKey, items: selectedAlbum.items }]
      : [];

  const downloadAlbumPdf = () => {
    if (visibleItems.length === 0) {
      toast("Add dated Wainwrights before exporting an album PDF");
      return;
    }

    try {
      openAlbumPrintWindow(
        buildAlbumExportDocument({
          heightUnit: "m",
          items: visibleItems,
          subtitle: exportSubtitle,
          title,
          exportOptions: {
            layout: exportLayout,
            coverTopoMap,
            dayMiniMaps: isWholeHistory && dayMiniMaps,
            dayGroups: exportDayGroups,
          },
        }),
      );
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not open album PDF",
      );
    }
  };

  return (
    <div className="grid gap-4 p-4 sm:p-5">
      <div className="rounded-3xl border border-border/70 bg-card/85 p-4 shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Wainwright albums
        </p>
        <h2 className="mt-2 font-display text-4xl italic leading-none text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Pick a bagging day or view your whole history. Albums group completed
          fells by the date they were bagged, with photos, elevation, and a mini
          map for the day.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <StatPill label="fells" value={visibleItems.length} />
          <StatPill label="photos" value={photoCount} />
          <StatPill label="albums" value={albums.length} />
        </div>
        <div className="mt-4 grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            PDF options
          </p>
          <div className="grid gap-2">
            <label
              className="text-xs text-muted-foreground"
              htmlFor="pdf-layout"
            >
              Layout
            </label>
            <Select
              value={exportLayout}
              onValueChange={(value) =>
                setExportLayout(value as AlbumExportLayout)
              }
            >
              <SelectTrigger id="pdf-layout" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portraitPair">
                  Portrait album (2 fells / 4 photos per page)
                </SelectItem>
                <SelectItem value="classic">
                  Classic (1 fell per block)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-start gap-2 text-sm leading-snug text-foreground">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={coverTopoMap}
              onChange={(event) => setCoverTopoMap(event.target.checked)}
            />
            <span>
              Cover topo map on page 1
              <span className="block text-xs text-muted-foreground">
                OpenTopoMap overview of all exported Wainwrights
              </span>
            </span>
          </label>
          {isWholeHistory ? (
            <label className="flex items-start gap-2 text-sm leading-snug text-foreground">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={dayMiniMaps}
                onChange={(event) => setDayMiniMaps(event.target.checked)}
              />
              <span>
                Mini topo map per day
                <span className="block text-xs text-muted-foreground">
                  Keeps each two-fell day together when possible
                </span>
              </span>
            </label>
          ) : null}
        </div>
        <Button
          type="button"
          className="mt-4 w-full rounded-full"
          onClick={downloadAlbumPdf}
          disabled={visibleItems.length === 0}
        >
          Download print PDF
        </Button>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          Opens an A4 print layout (portrait album by default) with optional
          topographical maps; choose “Save as PDF” in your browser print dialog.
          Maps need a brief moment online to load before printing.
        </p>
      </div>

      <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-2">
        <Button
          type="button"
          variant={
            selectedAlbumKey === WHOLE_HISTORY_ALBUM ? "default" : "ghost"
          }
          className="justify-between rounded-xl"
          onClick={() => onSelectedAlbumKey(WHOLE_HISTORY_ALBUM)}
        >
          <span>Whole history</span>
          <Badge variant="secondary" className="rounded-full">
            {wholeHistoryItems.length}
          </Badge>
        </Button>
        {disclosedAlbums.map((album) => (
          <Button
            key={album.dateKey}
            type="button"
            variant={selectedAlbumKey === album.dateKey ? "default" : "ghost"}
            className="justify-between rounded-xl"
            onClick={() => onSelectedAlbumKey(album.dateKey)}
          >
            <span>{formatAlbumDateLabel(album.dateKey)}</span>
            <Badge variant="secondary" className="rounded-full">
              {album.items.length}
            </Badge>
          </Button>
        ))}
        {albums.length > disclosedAlbums.length || albumListExpanded ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-dashed"
            onClick={() => setAlbumListExpanded((expanded) => !expanded)}
          >
            {albumListExpanded
              ? "Show fewer albums"
              : `Show all albums${hiddenAlbumCount ? ` (+${hiddenAlbumCount})` : ""}`}
          </Button>
        ) : null}
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-background/70 p-6 text-center text-sm text-muted-foreground">
          Add bagged dates to your completed Wainwrights and they will appear as
          albums here.
        </div>
      ) : selectedAlbumKey === WHOLE_HISTORY_ALBUM ? (
        <div className="grid gap-4">
          {albums
            .slice()
            .reverse()
            .map((album) => (
              <AlbumDaySection
                key={album.dateKey}
                dateKey={album.dateKey}
                items={album.items}
                onEdit={onEdit}
              />
            ))}
        </div>
      ) : (
        <AlbumDaySection
          dateKey={selectedAlbumKey}
          items={visibleItems}
          onEdit={onEdit}
        />
      )}
    </div>
  );
}

function AlbumDaySection({
  dateKey,
  items,
  onEdit,
}: {
  dateKey: string;
  items: WainwrightAlbumItem[];
  onEdit: (peak: Wainwright) => void;
}) {
  return (
    <section className="grid gap-3 rounded-3xl border border-border/70 bg-card/85 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            album day
          </p>
          <h3 className="mt-1 font-display text-3xl italic leading-none text-foreground">
            {formatAlbumDateLabel(dateKey)}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} Wainwright{items.length === 1 ? "" : "s"} bagged
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full">
          {items.reduce(
            (total, item) => total + (item.entry.photos?.length ?? 0),
            0,
          )}{" "}
          photos
        </Badge>
      </div>

      <AlbumMiniMap items={items} />

      <ol className="grid gap-3">
        {items.map((item) => (
          <li
            key={`${item.completedDateKey}-${item.peak.id}`}
            className="overflow-hidden rounded-2xl border border-border/70 bg-background/70"
          >
            <div className="grid gap-3 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-xl italic leading-tight text-foreground">
                    {item.peak.name}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {heightLabel(item.peak)} · {item.peak.area}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="shrink-0 rounded-full"
                  onClick={() => onEdit(item.peak)}
                >
                  <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={1.7} />
                  Edit
                </Button>
              </div>
              {item.entry.photos && item.entry.photos.length > 0 ? (
                <div className="album-photo-grid grid grid-cols-3 gap-2">
                  {item.entry.photos.map((photo, index) =>
                    photo.url ? (
                      <img
                        key={`${photo.storageId}-${index}`}
                        src={photo.url}
                        alt={
                          photo.originalName ?? `${item.peak.name} album photo`
                        }
                        className="aspect-square rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        key={`${photo.storageId}-${index}`}
                        className="grid aspect-square place-items-center rounded-xl bg-muted text-center text-[10px] text-muted-foreground"
                      >
                        photo saved
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  No photos saved for this summit yet.
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AlbumMiniMap({ items }: { items: WainwrightAlbumItem[] }) {
  const latitudes = items.map((item) => item.peak.latitude);
  const longitudes = items.map((item) => item.peak.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);

  return (
    <div
      className="album-mini-map relative h-36 overflow-hidden rounded-2xl border border-border/70 bg-[radial-gradient(circle_at_30%_20%,rgba(85,130,85,0.35),transparent_32%),linear-gradient(135deg,rgba(216,220,200,0.95),rgba(181,193,158,0.9))]"
      aria-label="small map of this album day"
    >
      <div className="absolute inset-x-0 top-1/2 h-px bg-white/35" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/35" />
      {items.map((item, index) => {
        const left = 12 + ((item.peak.longitude - minLng) / lngSpan) * 76;
        const top = 88 - ((item.peak.latitude - minLat) / latSpan) * 76;
        return (
          <span
            key={item.peak.id}
            className="absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg ring-2 ring-white/80"
            style={{ left: `${left}%`, top: `${top}%` }}
            title={item.peak.name}
          >
            {index + 1}
          </span>
        );
      })}
      <span className="absolute bottom-2 left-2 rounded-full bg-background/85 px-2 py-1 font-mono text-[10px] text-muted-foreground shadow-sm backdrop-blur">
        mini map · {items.length} stop{items.length === 1 ? "" : "s"}
      </span>
    </div>
  );
}

export function formatCompletionDate(value?: string) {
  if (!value) return "date not set";
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function CompletionDialog({
  initialMetadata,
  onOpenChange,
  onSave,
  open,
  peak,
  photos,
}: {
  initialMetadata?: CompletionEntry;
  onOpenChange: (open: boolean) => void;
  onSave: (metadata: CompletionMetadata, photoFiles: File[]) => Promise<void>;
  open: boolean;
  peak: Wainwright | null;
  photos: WainwrightPhotoMetadata[];
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [completedAt, setCompletedAt] = useState(
    () => initialMetadata?.completedAt ?? "",
  );
  const [note, setNote] = useState(() => initialMetadata?.note ?? "");
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const pendingPhotosRef = useRef<PendingPhoto[]>([]);
  const [removedPhotoStorageIds, setRemovedPhotoStorageIds] = useState<
    Set<string>
  >(() => new Set());
  const [fullscreenPhoto, setFullscreenPhoto] = useState<{
    alt: string;
    url: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(initialMetadata);
  const visibleSavedPhotos = Array.from(removedPhotoStorageIds).reduce(
    (nextPhotos, storageId) => removePhotoMetadata(nextPhotos, storageId),
    photos,
  );
  const pendingPhotoPreviews = pendingPhotos.map((photo) => ({
    id: photo.id,
    originalName: photo.file.name,
    url: photo.previewUrl,
  }));
  const photoCount = visibleSavedPhotos.length + pendingPhotos.length;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(
        {
          completedAt: completedAt || undefined,
          note: note.trim() || undefined,
          photos: visibleSavedPhotos,
        },
        pendingPhotos.map((photo) => photo.file),
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length === 0) return;
    try {
      validatePhotoSelectionLimit(
        visibleSavedPhotos.length,
        pendingPhotos.length,
        selected.length,
      );
      setPendingPhotos((current) => [
        ...current,
        ...selected.map((file) => ({
          file,
          id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
          previewUrl: URL.createObjectURL(file),
        })),
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not add those photos";
      toast.error(message);
    }
  };

  const removePendingPhoto = (id: string) => {
    setPendingPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
  };

  const removeSavedPhoto = (storageId: string) => {
    setRemovedPhotoStorageIds((current) => new Set(current).add(storageId));
  };

  useEffect(() => {
    pendingPhotosRef.current = pendingPhotos;
  }, [pendingPhotos]);

  useEffect(() => {
    return () => {
      pendingPhotosRef.current.forEach((photo) =>
        URL.revokeObjectURL(photo.previewUrl),
      );
    };
  }, []);

  if (!peak) return null;

  const form = (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label
          htmlFor="completion-date"
          className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground"
        >
          date bagged
        </label>
        <Input
          id="completion-date"
          type="date"
          value={completedAt}
          onChange={(event) => setCompletedAt(event.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="completion-note"
          className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground"
        >
          note
        </label>
        <Textarea
          id="completion-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Weather, route, company, summit snack..."
        />
      </div>

      <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/55 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
              photos
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Max {MAX_PHOTOS_PER_WAINWRIGHT}; images upload only when you save.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {photoCount}/{MAX_PHOTOS_PER_WAINWRIGHT}
          </Badge>
        </div>

        {photoCount > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {visibleSavedPhotos.map((photo) => (
              <div
                key={photo.storageId}
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted"
              >
                <button
                  type="button"
                  aria-label={`remove ${photo.originalName ?? "saved photo"}`}
                  onClick={() => removeSavedPhoto(photo.storageId)}
                  className="absolute right-1.5 top-1.5 z-10 grid size-7 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-destructive hover:text-destructive-foreground"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    className="size-3.5"
                    strokeWidth={2}
                  />
                </button>
                {photo.url ? (
                  <button
                    type="button"
                    aria-label={`Open full screen photo ${photo.originalName ?? peak.name}`}
                    onClick={() =>
                      setFullscreenPhoto({
                        url: photo.url!,
                        alt: photo.originalName ?? `${peak.name} photo`,
                      })
                    }
                    className="block h-full w-full cursor-zoom-in"
                  >
                    <img
                      src={photo.url}
                      alt={photo.originalName ?? `${peak.name} photo`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="grid h-full place-items-center px-2 text-center text-xs text-muted-foreground">
                    photo saved
                  </div>
                )}
              </div>
            ))}
            {pendingPhotoPreviews.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-dashed border-primary/50 bg-muted"
              >
                <button
                  type="button"
                  aria-label={`remove ${photo.originalName}`}
                  onClick={() => removePendingPhoto(photo.id)}
                  className="absolute right-1.5 top-1.5 z-10 grid size-7 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-destructive hover:text-destructive-foreground"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    className="size-3.5"
                    strokeWidth={2}
                  />
                </button>
                <button
                  type="button"
                  aria-label={`Open full screen photo ${photo.originalName}`}
                  onClick={() =>
                    setFullscreenPhoto({
                      url: photo.url,
                      alt: photo.originalName,
                    })
                  }
                  className="block h-full w-full cursor-zoom-in"
                >
                  <img
                    src={photo.url}
                    alt={photo.originalName}
                    className="h-full w-full object-cover"
                  />
                </button>
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
                  pending
                </span>
              </div>
            ))}
          </div>
        )}

        <label className="inline-flex">
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            disabled={saving || photoCount >= MAX_PHOTOS_PER_WAINWRIGHT}
            onChange={(event) => {
              handlePhotoChange(event.target.files);
              event.currentTarget.value = "";
            }}
          />
          <span
            className={cn(
              "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent",
              (saving || photoCount >= MAX_PHOTOS_PER_WAINWRIGHT) &&
                "pointer-events-none cursor-not-allowed opacity-50",
            )}
          >
            <HugeiconsIcon
              icon={Upload04Icon}
              className="size-4"
              strokeWidth={1.6}
            />
            {saving ? "compressing photos…" : "add photo"}
          </span>
        </label>
      </div>

      {isDesktop ? (
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "saving…" : isEditing ? "save changes" : "save as bagged"}
          </Button>
        </DialogFooter>
      ) : (
        <DrawerFooter>
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "saving…" : isEditing ? "save changes" : "save as bagged"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            cancel
          </Button>
        </DrawerFooter>
      )}
    </form>
  );

  const fullscreenPhotoDialog = (
    <Dialog
      open={Boolean(fullscreenPhoto)}
      onOpenChange={(isOpen) => {
        if (!isOpen) setFullscreenPhoto(null);
      }}
    >
      <DialogContent className="fullscreen-photo-dialog" showCloseButton>
        <DialogTitle className="sr-only">
          {fullscreenPhoto?.alt ?? "full screen photo"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Full screen photo preview. Rotate your phone to landscape for a wider
          horizontal view.
        </DialogDescription>
        {fullscreenPhoto && (
          <img
            src={fullscreenPhoto.url}
            alt={fullscreenPhoto.alt}
            className="fullscreen-photo-image"
          />
        )}
      </DialogContent>
    </Dialog>
  );

  if (isDesktop) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{peak.name}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Edit the date, note, and photos saved for this bag."
                  : "Add a date and note for this bag. Both are optional."}
              </DialogDescription>
            </DialogHeader>
            {form}
          </DialogContent>
        </Dialog>
        {fullscreenPhotoDialog}
      </>
    );
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
        <DrawerContent className="completion-drawer-content overflow-hidden">
          <DrawerHeader className="shrink-0">
            <DrawerTitle>{peak.name}</DrawerTitle>
            <DrawerDescription>
              {isEditing
                ? "Edit the date, note, and photos saved for this bag."
                : "Add a date and note for this bag. Both are optional."}
            </DrawerDescription>
          </DrawerHeader>
          <div className="completion-drawer-body min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            {form}
          </div>
        </DrawerContent>
      </Drawer>
      {fullscreenPhotoDialog}
    </>
  );
}
