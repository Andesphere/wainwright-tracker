/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import { requirePro } from "./billing";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const WEBHOOK_AUTH = "test-webhook-auth";
const CLERK_SECRET = `whsec_${btoa("a-32-byte-secret-for-svix-tests!")}`;
const walker = { subject: "user_walker", name: "Walker" };
const DAY = 24 * 60 * 60 * 1000;

type FakeCustomer = {
  expiresAt: number | null;
  status?: "trialing" | "active";
  autoRenewal?: "will_renew" | "will_not_renew";
};

/** A RevenueCat API v2 stand-in: customers with active Pro, everyone else unknown. */
const fakeRevenueCat = (customers: Record<string, FakeCustomer>) =>
  vi.fn(async (input: string | URL | Request) => {
    const url = new URL(String(input));
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status });
    if (url.pathname === "/v2/projects/proj_test/entitlements") {
      return json({
        items: [
          {
            id: "entl_pro",
            lookup_key: "pro",
            products: {
              items: [
                {
                  id: "prod_yearly",
                  store_identifier: "com.wainwrightsbaggers.pro.yearly",
                },
              ],
            },
          },
        ],
        next_page: null,
      });
    }
    const match = url.pathname.match(
      /^\/v2\/projects\/proj_test\/customers\/([^/]+)\/(active_entitlements|subscriptions)$/,
    );
    const customer = match && customers[decodeURIComponent(match[1]!)];
    if (!match) return json({ type: "resource_missing" }, 404);
    if (!customer) return json({ type: "resource_missing" }, 404);
    if (match[2] === "active_entitlements") {
      return json({
        items: [{ entitlement_id: "entl_pro", expires_at: customer.expiresAt }],
        next_page: null,
      });
    }
    return json({
      items: [
        {
          auto_renewal_status: customer.autoRenewal ?? "will_renew",
          current_period_ends_at: customer.expiresAt,
          entitlements: { items: [{ id: "entl_pro", lookup_key: "pro" }] },
          gives_access: true,
          product_id: "prod_yearly",
          status: customer.status ?? "active",
          store: "app_store",
        },
      ],
      next_page: null,
    });
  });

const postRevenueCat = (
  t: ReturnType<typeof convexTest>,
  event: Record<string, unknown>,
  auth = `Bearer ${WEBHOOK_AUTH}`,
) =>
  t.fetch("/revenuecat", {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ api_version: "1.0", event }),
  });

const entitlementRows = (t: ReturnType<typeof convexTest>) =>
  t.run((ctx) => ctx.db.query("entitlements").collect());

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("REVENUECAT_WEBHOOK_AUTH", WEBHOOK_AUTH);
  vi.stubEnv("REVENUECAT_PROJECT_ID", "proj_test");
  vi.stubEnv("REVENUECAT_SECRET_KEY", "sk_test");
  vi.stubEnv("CLERK_WEBHOOK_SECRET", CLERK_SECRET);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("RevenueCat webhook", () => {
  it("rejects a missing or wrong token and changes nothing", async () => {
    const t = convexTest(schema, modules);
    const fetchMock = fakeRevenueCat({});
    vi.stubGlobal("fetch", fetchMock);

    const wrong = await postRevenueCat(
      t,
      { type: "INITIAL_PURCHASE", app_user_id: "user_walker" },
      "Bearer nope",
    );
    const missing = await postRevenueCat(
      t,
      { type: "INITIAL_PURCHASE", app_user_id: "user_walker" },
      "",
    );
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(wrong.status).toBe(401);
    expect(missing.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await entitlementRows(t)).toEqual([]);
  });

  it("grants Pro from RevenueCat's answer, not from the event", async () => {
    const t = convexTest(schema, modules);
    const expiresAt = Date.now() + 7 * DAY;
    vi.stubGlobal(
      "fetch",
      fakeRevenueCat({ user_walker: { expiresAt, status: "trialing" } }),
    );

    const response = await postRevenueCat(t, {
      type: "INITIAL_PURCHASE",
      app_user_id: "user_walker",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(response.status).toBe(200);
    expect(await t.withIdentity(walker).query(api.billing.mine)).toEqual({
      expiresAt,
      periodType: "trial",
      pro: true,
      productId: "com.wainwrightsbaggers.pro.yearly",
      willRenew: true,
    });
    const [row] = await entitlementRows(t);
    expect(row?.store).toBe("app_store");
  });

  it("removes Pro when RevenueCat no longer reports the entitlement", async () => {
    const t = convexTest(schema, modules);
    vi.stubGlobal(
      "fetch",
      fakeRevenueCat({ user_walker: { expiresAt: Date.now() + DAY } }),
    );
    await postRevenueCat(t, { type: "RENEWAL", app_user_id: "user_walker" });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    vi.stubGlobal("fetch", fakeRevenueCat({}));
    // A stale event arriving late still ends in the current truth.
    await postRevenueCat(t, { type: "RENEWAL", app_user_id: "user_walker" });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(await t.withIdentity(walker).query(api.billing.mine)).toEqual({
      pro: false,
    });
    await expect(
      t.withIdentity(walker).mutation((ctx) => requirePro(ctx)),
    ).rejects.toThrow(/PRO_REQUIRED/);
  });

  it("moves Pro on a transfer between accounts", async () => {
    const t = convexTest(schema, modules);
    vi.stubGlobal(
      "fetch",
      fakeRevenueCat({ user_old: { expiresAt: Date.now() + DAY } }),
    );
    await postRevenueCat(t, {
      type: "INITIAL_PURCHASE",
      app_user_id: "user_old",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    vi.stubGlobal(
      "fetch",
      fakeRevenueCat({ user_new: { expiresAt: Date.now() + DAY } }),
    );
    await postRevenueCat(t, {
      type: "TRANSFER",
      transferred_from: ["user_old", "$RCAnonymousID:abc"],
      transferred_to: ["user_new"],
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const rows = await entitlementRows(t);
    expect(
      Object.fromEntries(rows.map((row) => [row.userId, row.pro])),
    ).toEqual({ user_new: true, user_old: false });
  });

  it("ignores anonymous RevenueCat users and test events", async () => {
    const t = convexTest(schema, modules);
    const fetchMock = fakeRevenueCat({});
    vi.stubGlobal("fetch", fetchMock);

    const anonymous = await postRevenueCat(t, {
      type: "INITIAL_PURCHASE",
      app_user_id: "$RCAnonymousID:1234",
    });
    const test = await postRevenueCat(t, {
      type: "TEST",
      app_user_id: "user_x",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(anonymous.status).toBe(200);
    expect(test.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("billing", () => {
  it("mine is null signed out and not Pro without a row", async () => {
    const t = convexTest(schema, modules);
    expect(await t.query(api.billing.mine)).toBeNull();
    expect(await t.withIdentity(walker).query(api.billing.mine)).toEqual({
      pro: false,
    });
  });

  it("treats an expired row as not Pro even before the expiry event lands", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) =>
      ctx.db.insert("entitlements", {
        expiresAt: Date.now() - 1000,
        pro: true,
        updatedAt: 1,
        userId: "user_walker",
      }),
    );

    expect((await t.withIdentity(walker).query(api.billing.mine))?.pro).toBe(
      false,
    );
    await expect(
      t.withIdentity(walker).mutation((ctx) => requirePro(ctx)),
    ).rejects.toThrow(/PRO_REQUIRED/);
  });

  it("refresh recomputes for the caller at once", async () => {
    const t = convexTest(schema, modules);
    const expiresAt = Date.now() + 30 * DAY;
    vi.stubGlobal("fetch", fakeRevenueCat({ user_walker: { expiresAt } }));

    const result = await t.withIdentity(walker).action(api.billing.refresh);

    expect(result.pro).toBe(true);
    expect(
      await t.withIdentity(walker).mutation((ctx) => requirePro(ctx)),
    ).toBe("user_walker");
  });

  it("requirePro rejects signed-out callers", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation((ctx) => requirePro(ctx))).rejects.toThrow(
      /UNAUTHENTICATED/,
    );
  });
});

describe("Clerk webhook", () => {
  const sign = async (
    body: string,
    timestamp: number,
    secret = CLERK_SECRET,
  ) => {
    const key = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from(atob(secret.slice("whsec_".length)), (c) =>
        c.charCodeAt(0),
      ),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`msg_1.${timestamp}.${body}`),
    );
    return `v1,${btoa(String.fromCharCode(...new Uint8Array(mac)))}`;
  };

  const postClerk = (
    t: ReturnType<typeof convexTest>,
    body: string,
    signature: string,
    timestamp: number,
  ) =>
    t.fetch("/clerk-webhook", {
      method: "POST",
      headers: {
        "svix-id": "msg_1",
        "svix-signature": signature,
        "svix-timestamp": String(timestamp),
      },
      body,
    });

  const seedWalker = async (t: ReturnType<typeof convexTest>) => {
    await t.withIdentity(walker).mutation(api.progress.setBagged, {
      id: "helvellyn",
      bagged: true,
      note: "Striding Edge",
    });
    await t.run((ctx) =>
      ctx.db.insert("entitlements", {
        pro: true,
        updatedAt: 1,
        userId: "user_walker",
      }),
    );
  };

  const leftFor = (t: ReturnType<typeof convexTest>) =>
    t.run(async (ctx) => ({
      entitlements: (await ctx.db.query("entitlements").collect()).length,
      progress: (await ctx.db.query("userProgress").collect()).length,
    }));

  const deletedBody = JSON.stringify({
    data: { deleted: true, id: "user_walker", object: "user" },
    object: "event",
    type: "user.deleted",
  });

  it("deletes the user's data and entitlement on a signed user.deleted", async () => {
    const t = convexTest(schema, modules);
    await seedWalker(t);
    const now = Math.floor(Date.now() / 1000);

    const response = await postClerk(
      t,
      deletedBody,
      `v1,bm90LWl0 ${await sign(deletedBody, now)}`,
      now,
    );

    expect(response.status).toBe(200);
    expect(await leftFor(t)).toEqual({ entitlements: 0, progress: 0 });
  });

  it("rejects a bad signature, another secret or a stale timestamp", async () => {
    const t = convexTest(schema, modules);
    await seedWalker(t);
    const now = Math.floor(Date.now() / 1000);
    const otherSecret = `whsec_${btoa("another-secret-that-is-32-bytes!")}`;

    const forged = await postClerk(t, deletedBody, "v1,Zm9yZ2Vk", now);
    const wrongKey = await postClerk(
      t,
      deletedBody,
      await sign(deletedBody, now, otherSecret),
      now,
    );
    const stale = await postClerk(
      t,
      deletedBody,
      await sign(deletedBody, now - 600),
      now - 600,
    );

    expect([forged.status, wrongKey.status, stale.status]).toEqual([
      401, 401, 401,
    ]);
    expect(await leftFor(t)).toEqual({ entitlements: 1, progress: 1 });
  });
});
