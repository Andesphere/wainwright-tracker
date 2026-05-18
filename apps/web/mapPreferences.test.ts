import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTO_OFFLINE_TOPO_STATUS_KEY,
  DEFAULT_TOPO_ENABLED,
  LEGACY_OFFLINE_MAP_META_KEY,
  TOPO_ENABLED_STORAGE_KEY,
  loadTopoPreference,
  shouldAutoDownloadOfflineTopo,
  storeAutoOfflineTopoMetadata,
  storeTopoPreference,
} from "./mapPreferences";

function createStorage() {
  const store = new Map<string, string>();
  return {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } satisfies Storage;
}

describe("map preferences", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("localStorage", createStorage());
    vi.stubGlobal("caches", { open: vi.fn() });
  });
  it("defaults to topo enabled for a first-class outdoor map", () => {
    expect(DEFAULT_TOPO_ENABLED).toBe(true);
    expect(loadTopoPreference()).toBe(true);
  });

  it("persists user topo toggle changes in localStorage", () => {
    storeTopoPreference(false);

    expect(localStorage.getItem(TOPO_ENABLED_STORAGE_KEY)).toBe("false");
    expect(loadTopoPreference()).toBe(false);

    storeTopoPreference(true);
    expect(localStorage.getItem(TOPO_ENABLED_STORAGE_KEY)).toBe("true");
    expect(loadTopoPreference()).toBe(true);
  });

  it("auto-downloads the offline topo pack once in the background", () => {
    expect(shouldAutoDownloadOfflineTopo()).toBe(true);

    storeAutoOfflineTopoMetadata({ downloaded: 662, failed: 0, total: 662 });

    expect(localStorage.getItem(AUTO_OFFLINE_TOPO_STATUS_KEY)).toContain(
      '"status":"ready"',
    );
    expect(shouldAutoDownloadOfflineTopo()).toBe(false);
  });

  it("retries stale interrupted background downloads", () => {
    localStorage.setItem(
      AUTO_OFFLINE_TOPO_STATUS_KEY,
      JSON.stringify({
        startedAt: new Date(Date.now() - 31 * 60 * 1_000).toISOString(),
        status: "downloading",
      }),
    );

    expect(shouldAutoDownloadOfflineTopo()).toBe(true);
  });

  it("does not redownload for users who already saved the old offline pack", () => {
    localStorage.setItem(
      LEGACY_OFFLINE_MAP_META_KEY,
      JSON.stringify({ savedAt: "2026-05-16" }),
    );

    expect(shouldAutoDownloadOfflineTopo()).toBe(false);
  });

  it("does not auto-download when storage or cache APIs are unavailable", () => {
    vi.stubGlobal("caches", undefined);

    expect(shouldAutoDownloadOfflineTopo()).toBe(false);
  });
});
