import type { DownloadProgress } from "./offlineMap";

export const DEFAULT_TOPO_ENABLED = true;
export const TOPO_ENABLED_STORAGE_KEY = "wainwright-tracker:v1:topo-enabled";
export const AUTO_OFFLINE_TOPO_STATUS_KEY =
  "wainwright-tracker:v1:auto-offline-topo";
export const LEGACY_OFFLINE_MAP_META_KEY = "wainwright-tracker:v1:offline-map";
const AUTO_OFFLINE_TOPO_STALE_MS = 30 * 60 * 1_000;

type AutoOfflineTopoMetadata = DownloadProgress & {
  savedAt?: string;
  startedAt?: string;
  status?: "downloading" | "ready" | "error";
};

type AutoOfflineTopoDownloadOptions = {
  download: (
    onProgress?: (progress: DownloadProgress) => void,
  ) => Promise<DownloadProgress>;
  onProgress?: (progress: DownloadProgress) => void;
  onStatus?: (status: "downloading" | "ready" | "error") => void;
};

function getStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function getCaches() {
  return "caches" in globalThis ? globalThis.caches : undefined;
}

function readJson<T>(key: string): T | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadTopoPreference() {
  const storage = getStorage();
  if (!storage) return DEFAULT_TOPO_ENABLED;

  const saved = storage.getItem(TOPO_ENABLED_STORAGE_KEY);
  if (saved === "true") return true;
  if (saved === "false") return false;
  return DEFAULT_TOPO_ENABLED;
}

export function storeTopoPreference(enabled: boolean) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(TOPO_ENABLED_STORAGE_KEY, String(enabled));
}

export function shouldAutoDownloadOfflineTopo() {
  const storage = getStorage();
  const caches = getCaches();
  if (!storage || !caches) return false;

  if (storage.getItem(LEGACY_OFFLINE_MAP_META_KEY)) return false;

  const metadata = readJson<AutoOfflineTopoMetadata>(
    AUTO_OFFLINE_TOPO_STATUS_KEY,
  );
  if (metadata?.status === "ready") return false;
  if (metadata?.status === "downloading") {
    const startedAt = metadata.startedAt
      ? new Date(metadata.startedAt).getTime()
      : Number.NaN;
    return (
      Number.isNaN(startedAt) ||
      Date.now() - startedAt > AUTO_OFFLINE_TOPO_STALE_MS
    );
  }
  return true;
}

export function storeAutoOfflineTopoMetadata(
  progress: DownloadProgress,
  status: AutoOfflineTopoMetadata["status"] = "ready",
) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(
    AUTO_OFFLINE_TOPO_STATUS_KEY,
    JSON.stringify({
      ...progress,
      savedAt: new Date().toISOString(),
      status,
    }),
  );
}

export function markAutoOfflineTopoDownloadStarted() {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(
    AUTO_OFFLINE_TOPO_STATUS_KEY,
    JSON.stringify({
      startedAt: new Date().toISOString(),
      status: "downloading",
    }),
  );
}

export async function startAutoOfflineTopoDownload({
  download,
  onProgress,
  onStatus,
}: AutoOfflineTopoDownloadOptions) {
  if (!shouldAutoDownloadOfflineTopo()) return false;

  markAutoOfflineTopoDownloadStarted();
  onStatus?.("downloading");

  try {
    const result = await download(onProgress);
    storeAutoOfflineTopoMetadata(result, "ready");
    onStatus?.("ready");
    return true;
  } catch {
    storeAutoOfflineTopoMetadata(
      { downloaded: 0, failed: 1, total: 0 },
      "error",
    );
    onStatus?.("error");
    return false;
  }
}
