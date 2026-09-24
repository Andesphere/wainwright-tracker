import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { webhookUserIds } from "./billing";
import { safeEqual, verifySvixSignature } from "./svix";

const http = httpRouter();

// RevenueCat webhook. The Authorization header set in the RevenueCat dashboard
// must be `Bearer <REVENUECAT_WEBHOOK_AUTH>`. The event only says who changed;
// billing.recompute asks RevenueCat for the truth, so answering 200 at once is safe.
http.route({
  path: "/revenuecat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const token = process.env.REVENUECAT_WEBHOOK_AUTH;
    const header = request.headers.get("Authorization") ?? "";
    if (!token || !safeEqual(header, `Bearer ${token}`)) {
      return new Response("Unauthorized", { status: 401 });
    }

    let event: unknown;
    try {
      event = ((await request.json()) as { event?: unknown }).event;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const type = (event as { type?: unknown } | undefined)?.type;
    if (type === "TEST") {
      console.log("RevenueCat test event received");
      return new Response(null, { status: 200 });
    }
    for (const userId of webhookUserIds(event)) {
      await ctx.scheduler.runAfter(0, internal.billing.recompute, { userId });
    }
    return new Response(null, { status: 200 });
  }),
});

// Clerk webhook (Svix). On `user.deleted`, remove everything the app stored
// for that user, so deletions made outside the apps still clean up.
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    const body = await request.text();
    if (
      !secret ||
      !(await verifySvixSignature(secret, request.headers, body))
    ) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body) as {
      type?: string;
      data?: { id?: unknown };
    };
    if (event.type === "user.deleted" && typeof event.data?.id === "string") {
      await ctx.runMutation(internal.account.deleteUserDataInternal, {
        userId: event.data.id,
      });
    }
    return new Response(null, { status: 200 });
  }),
});

export default http;
