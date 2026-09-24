/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const walker = { subject: "user_walker", name: "Walker" };

const storePhoto = (t: ReturnType<typeof convexTest>) =>
  t.run((ctx) => ctx.storage.store(new Blob(["jpeg"], { type: "image/jpeg" })));

const photoExists = (
  t: ReturnType<typeof convexTest>,
  storageId: Awaited<ReturnType<typeof storePhoto>>,
) => t.run(async (ctx) => (await ctx.storage.get(storageId)) !== null);

const photoFor = (storageId: Awaited<ReturnType<typeof storePhoto>>) => ({
  mimeType: "image/jpeg",
  storageId,
  uploadedAt: "2026-09-24T10:00:00Z",
});

describe("progress", () => {
  it("keeps fells another device saved when a stale client adds more", async () => {
    const t = convexTest(schema, modules);
    const phone = t.withIdentity(walker);
    const laptop = t.withIdentity(walker);

    await phone.mutation(api.progress.setBagged, {
      id: "helvellyn",
      bagged: true,
      note: "Striding Edge in the wind",
    });
    // The laptop never saw Helvellyn and bulk-adds from its stale list.
    await laptop.mutation(api.progress.addBagged, { ids: ["catbells"] });

    expect(await laptop.query(api.progress.get)).toEqual([
      "catbells",
      "helvellyn",
    ]);
    const entries = await laptop.query(api.progress.getEntries);
    expect(entries.find((entry) => entry.id === "helvellyn")?.note).toBe(
      "Striding Edge in the wind",
    );
  });

  it("keeps stored photos when a client re-bags without sending photos", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity(walker);
    const storageId = await storePhoto(t);

    await user.mutation(api.progress.setBagged, {
      id: "catbells",
      bagged: true,
      photos: [photoFor(storageId)],
    });
    await user.mutation(api.progress.setBagged, {
      id: "catbells",
      bagged: true,
      completedAt: "2026-09-24",
    });

    const entries = await user.query(api.progress.getEntries);
    expect(entries[0]?.photos?.map((photo) => photo.storageId)).toEqual([
      storageId,
    ]);
    expect(await photoExists(t, storageId)).toBe(true);
  });

  it("deletes photo files when a fell is unbagged or the journal is reset", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity(walker);
    const unbagged = await storePhoto(t);
    const reset = await storePhoto(t);

    await user.mutation(api.progress.setBagged, {
      id: "catbells",
      bagged: true,
      photos: [photoFor(unbagged)],
    });
    await user.mutation(api.progress.setBagged, {
      id: "catbells",
      bagged: false,
    });
    expect(await photoExists(t, unbagged)).toBe(false);

    await user.mutation(api.progress.setBagged, {
      id: "skiddaw",
      bagged: true,
      photos: [photoFor(reset)],
    });
    await user.mutation(api.progress.reset, {});
    expect(await user.query(api.progress.get)).toEqual([]);
    expect(await photoExists(t, reset)).toBe(false);
  });
});

describe("account.deleteMyData", () => {
  it("removes progress, photos, profile and follows", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity(walker);
    const friend = t.withIdentity({ subject: "user_friend", name: "Friend" });
    const storageId = await storePhoto(t);

    await user.mutation(api.progress.setBagged, {
      id: "helvellyn",
      bagged: true,
      photos: [photoFor(storageId)],
    });
    await user.mutation(api.social.upsertCurrentProfile, {});
    await friend.mutation(api.social.upsertCurrentProfile, {});
    await t.run(async (ctx) => {
      await ctx.db.insert("follows", {
        createdAt: 1,
        followerUserId: "user_walker",
        followingUserId: "user_friend",
      });
      await ctx.db.insert("follows", {
        createdAt: 1,
        followerUserId: "user_friend",
        followingUserId: "user_walker",
      });
    });

    await user.mutation(api.account.deleteMyData, {});

    const left = await t.run(async (ctx) => ({
      progress: await ctx.db.query("userProgress").collect(),
      profiles: await ctx.db.query("userProfiles").collect(),
      follows: await ctx.db.query("follows").collect(),
      photo: (await ctx.storage.get(storageId)) !== null,
    }));
    expect(left.progress).toEqual([]);
    expect(left.profiles.map((profile) => profile.userId)).toEqual([
      "user_friend",
    ]);
    expect(left.follows).toEqual([]);
    expect(left.photo).toBe(false);
  });
});
