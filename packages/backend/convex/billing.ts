import { ConvexError, v, type Infer } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  query,
  type ActionCtx,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";

// RevenueCat is the single purchase authority. Convex never trusts a client
// about Pro: every webhook and every refresh asks RevenueCat for the user's
// current access and stores the answer, so events can arrive twice or out of
// order without harm. The app user ID in RevenueCat is the Clerk user ID.

export const PRO_ENTITLEMENT = "pro";
const RETRY_DELAYS_MS = [30_000, 5 * 60_000];

const accessValidator = {
  expiresAt: v.optional(v.number()),
  periodType: v.optional(v.string()),
  pro: v.boolean(),
  productId: v.optional(v.string()),
  store: v.optional(v.string()),
  willRenew: v.optional(v.boolean()),
};
const accessObject = v.object(accessValidator);
type Access = Infer<typeof accessObject>;

type List<T> = { items: T[]; next_page?: string | null };
type RevenueCatEntitlement = {
  id: string;
  lookup_key: string;
  products?: List<{ id: string; store_identifier: string }> | null;
};
type RevenueCatSubscription = {
  auto_renewal_status: string;
  current_period_ends_at: number | null;
  entitlements: List<{ id: string }>;
  gives_access: boolean;
  product_id?: string;
  status: string;
  store: string;
};

const isAnonymous = (appUserId: string) =>
  appUserId.startsWith("$RCAnonymousID:");

const hasAccess = (row: Access, now: number) =>
  row.pro && (row.expiresAt === undefined || row.expiresAt > now);

const entitlementFor = (ctx: QueryCtx | MutationCtx, userId: string) =>
  ctx.db
    .query("entitlements")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

const summary = (row: Access | null) => ({
  expiresAt: row?.expiresAt,
  periodType: row?.periodType,
  pro: row ? hasAccess(row, Date.now()) : false,
  productId: row?.productId,
  willRenew: row?.willRenew,
});
const summaryValidator = v.object({
  expiresAt: v.optional(v.number()),
  periodType: v.optional(v.string()),
  pro: v.boolean(),
  productId: v.optional(v.string()),
  willRenew: v.optional(v.boolean()),
});

/** Throws unless the signed-in user has active Pro. Returns their user ID. */
export const requirePro = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Sign in to use Pro.",
    });
  }
  const row = await entitlementFor(ctx, identity.subject);
  if (!row || !hasAccess(row, Date.now())) {
    throw new ConvexError({
      code: "PRO_REQUIRED",
      message: "This needs Wainwrights Baggers Pro.",
    });
  }
  return identity.subject;
};

/** Asks RevenueCat API v2 what the user has right now. */
export const fetchAccess = async (appUserId: string): Promise<Access> => {
  const projectId = process.env.REVENUECAT_PROJECT_ID;
  const secretKey = process.env.REVENUECAT_SECRET_KEY;
  if (!projectId || !secretKey) {
    throw new Error(
      "REVENUECAT_PROJECT_ID and REVENUECAT_SECRET_KEY must be set.",
    );
  }

  // null when RevenueCat has never seen the customer.
  const get = async <T>(path: string): Promise<T | null> => {
    const response = await fetch(`https://api.revenuecat.com${path}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(
        `RevenueCat returned ${response.status} for ${path.split("?")[0]}`,
      );
    }
    return (await response.json()) as T;
  };

  const project = `/v2/projects/${encodeURIComponent(projectId)}`;
  const customer = `${project}/customers/${encodeURIComponent(appUserId)}`;

  const subscriptionsFor = async () => {
    const all: RevenueCatSubscription[] = [];
    let path: string | null | undefined = `${customer}/subscriptions`;
    while (path) {
      const page: List<RevenueCatSubscription> | null =
        await get<List<RevenueCatSubscription>>(path);
      all.push(...(page?.items ?? []));
      path = page?.next_page;
    }
    return all;
  };

  const [entitlements, active, subscriptions] = await Promise.all([
    // The customer endpoints name entitlements by internal ID, not lookup key.
    get<List<RevenueCatEntitlement>>(
      `${project}/entitlements?expand=items.product`,
    ),
    get<List<{ entitlement_id: string; expires_at: number | null }>>(
      `${customer}/active_entitlements`,
    ),
    subscriptionsFor(),
  ]);

  const pro = entitlements?.items.find(
    (item) => item.lookup_key === PRO_ENTITLEMENT,
  );
  if (!pro) {
    throw new Error(`RevenueCat has no "${PRO_ENTITLEMENT}" entitlement.`);
  }
  const grant = active?.items.find((item) => item.entitlement_id === pro.id);
  if (!grant) return { pro: false };

  // The subscription behind the grant, latest period first. Absent for
  // promotional grants made in the RevenueCat dashboard.
  const subscription = subscriptions
    .filter(
      (item) =>
        item.gives_access &&
        item.entitlements.items.some(
          (entitlement) => entitlement.id === pro.id,
        ),
    )
    .sort(
      (a, b) =>
        (b.current_period_ends_at ?? Infinity) -
        (a.current_period_ends_at ?? Infinity),
    )[0];
  const storeIdentifier = new Map(
    (pro.products?.items ?? []).map((product) => [
      product.id,
      product.store_identifier,
    ]),
  );

  return {
    expiresAt: grant.expires_at ?? undefined,
    periodType: subscription
      ? subscription.status === "trialing"
        ? "trial"
        : "normal"
      : undefined,
    pro: true,
    productId: subscription?.product_id
      ? (storeIdentifier.get(subscription.product_id) ??
        subscription.product_id)
      : undefined,
    store: subscription?.store,
    willRenew: subscription
      ? ["will_renew", "has_already_renewed"].includes(
          subscription.auto_renewal_status,
        )
      : undefined,
  };
};

const recomputeFor = async (ctx: ActionCtx, userId: string) => {
  const access = await fetchAccess(userId);
  await ctx.runMutation(internal.billing.saveAccess, { userId, ...access });
  return access;
};

/** RevenueCat user IDs a webhook event touches, minus anonymous ones. */
export const webhookUserIds = (event: unknown): string[] => {
  if (!event || typeof event !== "object") return [];
  const { app_user_id, transferred_from, transferred_to } = event as Record<
    string,
    unknown
  >;
  const ids = [
    app_user_id,
    ...(Array.isArray(transferred_from) ? transferred_from : []),
    ...(Array.isArray(transferred_to) ? transferred_to : []),
  ];
  return Array.from(
    new Set(
      ids.filter(
        (id): id is string =>
          typeof id === "string" && id.length > 0 && !isAnonymous(id),
      ),
    ),
  );
};

export const saveAccess = internalMutation({
  args: { userId: v.string(), ...accessValidator },
  returns: v.null(),
  handler: async (ctx, { userId, ...access }) => {
    const existing = await entitlementFor(ctx, userId);
    // No row means "never had Pro"; do not create one just to say so.
    if (!existing && !access.pro) return null;
    const row = { ...access, updatedAt: Date.now(), userId };
    if (existing) {
      await ctx.db.replace(existing._id, row);
    } else {
      await ctx.db.insert("entitlements", row);
    }
    return null;
  },
});

/** Scheduled by the RevenueCat webhook. Retries twice if RevenueCat is unreachable. */
export const recompute = internalAction({
  args: { attempt: v.optional(v.number()), userId: v.string() },
  returns: v.null(),
  handler: async (ctx, { attempt = 0, userId }) => {
    try {
      await recomputeFor(ctx, userId);
    } catch (error) {
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay === undefined) throw error;
      console.warn(`Pro recompute failed, retrying in ${delay / 1000}s`, error);
      await ctx.scheduler.runAfter(delay, internal.billing.recompute, {
        attempt: attempt + 1,
        userId,
      });
    }
    return null;
  },
});

/** The signed-in user's Pro state; null when signed out. */
export const mine = query({
  args: {},
  returns: v.union(v.null(), summaryValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const row: Doc<"entitlements"> | null = await entitlementFor(
      ctx,
      identity.subject,
    );
    return summary(row);
  },
});

/** Clients call this right after a purchase or restore, so Convex knows at once. */
export const refresh = action({
  args: {},
  returns: summaryValidator,
  handler: async (ctx): Promise<Infer<typeof summaryValidator>> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Sign in to restore Pro.",
      });
    }
    return summary(await recomputeFor(ctx, identity.subject));
  },
});
