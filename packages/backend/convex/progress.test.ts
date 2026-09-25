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

const grantPro = (t: ReturnType<typeof convexTest>, userId = walker.subject) =>
  t.run((ctx) =>
    ctx.db.insert("entitlements", { pro: true, updatedAt: 1, userId }),
  );

/** A walker without Pro whose note and photo were saved while they had it. */
const lapsedWalkerWithJournal = async (t: ReturnType<typeof convexTest>) => {
  const storageId = await storePhoto(t);
  await t.run((ctx) =>
    ctx.db.insert("userProgress", {
      completed: ["helvellyn"],
      entries: [
        {
          completedAt: "2025-06-01",
          id: "helvellyn",
          note: "Striding Edge",
          photos: [photoFor(storageId)],
        },
      ],
      updatedAt: 1,
      userId: walker.subject,
    }),
  );
  return storageId;
};

describe("progress", () => {
  it("keeps fells another device saved when a stale client adds more", async () => {
    const t = convexTest(schema, modules);
    await grantPro(t);
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
    await grantPro(t);
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
    await grantPro(t);
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

describe("Pro gating", () => {
  it("lets a free walker bag with a date, unbag and reset", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity(walker);

    await user.mutation(api.progress.setBagged, {
      id: "catbells",
      bagged: true,
      completedAt: "2026-09-24",
    });
    await user.mutation(api.progress.setBagged, {
      id: "skiddaw",
      bagged: true,
    });
    expect(await user.query(api.progress.getEntries)).toEqual([
      { completedAt: "2026-09-24", id: "catbells", photos: [] },
      { id: "skiddaw", photos: [] },
    ]);

    await user.mutation(api.progress.setBagged, {
      id: "catbells",
      bagged: false,
    });
    expect(await user.query(api.progress.get)).toEqual(["skiddaw"]);
    await user.mutation(api.progress.reset, {});
    expect(await user.query(api.progress.get)).toEqual([]);
  });

  it("rejects a note or a photo from a free walker", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity(walker);
    const storageId = await storePhoto(t);

    await expect(
      user.mutation(api.progress.setBagged, {
        id: "catbells",
        bagged: true,
        note: "Windy on top",
      }),
    ).rejects.toThrow(/Pro/);
    await expect(
      user.mutation(api.progress.setBagged, {
        id: "catbells",
        bagged: true,
        photos: [photoFor(storageId)],
      }),
    ).rejects.toThrow(/Pro/);
    await expect(
      user.mutation(api.progress.generatePhotoUploadUrl, {}),
    ).rejects.toThrow(/Pro/);
    await expect(
      user.mutation(api.progress.attachPhoto, { id: "catbells", storageId }),
    ).rejects.toThrow(/Pro/);

    // Nothing was saved by the rejected calls.
    expect(await user.query(api.progress.get)).toEqual([]);
  });

  it("keeps a lapsed walker's journal read-only but lets them change the date or remove it", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity(walker);
    const storageId = await lapsedWalkerWithJournal(t);
    const stored = [photoFor(storageId)];

    // Re-saving the same note and photos with a new date is not a Pro write.
    await user.mutation(api.progress.setBagged, {
      id: "helvellyn",
      bagged: true,
      completedAt: "2025-06-02",
      note: "Striding Edge",
      photos: stored,
    });
    await expect(
      user.mutation(api.progress.setBagged, {
        id: "helvellyn",
        bagged: true,
        note: "Striding Edge, then Swirral Edge",
        photos: stored,
      }),
    ).rejects.toThrow(/Pro/);

    // Removing the note and the photo is always allowed.
    await user.mutation(api.progress.setBagged, {
      id: "helvellyn",
      bagged: true,
      completedAt: "2025-06-02",
      photos: [],
    });
    expect(await user.query(api.progress.getEntries)).toEqual([
      { completedAt: "2025-06-02", id: "helvellyn", photos: [] },
    ]);
    expect(await photoExists(t, storageId)).toBe(false);
  });

  it("lets a Pro walker write notes and photos", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity(walker);
    await grantPro(t);

    await user.mutation(api.progress.setBagged, {
      id: "catbells",
      bagged: true,
      completedAt: "2026-09-24",
      note: "Windy on top",
    });
    expect(
      typeof (await user.mutation(api.progress.generatePhotoUploadUrl, {})),
    ).toBe("string");
    const storageId = await storePhoto(t);
    await user.mutation(api.progress.attachPhoto, {
      id: "catbells",
      storageId,
    });

    const [entry] = await user.query(api.progress.getEntries);
    expect(entry?.note).toBe("Windy on top");
    expect(entry?.photos?.map((photo) => photo.storageId)).toEqual([
      storageId,
    ]);
  });

  it("stops accepting journal writes when Pro expires", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity(walker);
    await t.run((ctx) =>
      ctx.db.insert("entitlements", {
        expiresAt: Date.now() - 1000,
        pro: true,
        updatedAt: 1,
        userId: walker.subject,
      }),
    );

    await expect(
      user.mutation(api.progress.setBagged, {
        id: "catbells",
        bagged: true,
        note: "Windy on top",
      }),
    ).rejects.toThrow(/Pro/);
  });
});

describe("account.deleteMyData", () => {
  it("removes progress, photos, profile and follows", async () => {
    const t = convexTest(schema, modules);
    await grantPro(t);
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
