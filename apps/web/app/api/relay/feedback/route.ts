import { NextResponse } from "next/server";
import { getAndesRelayClient } from "@/lib/andes-relay";

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const userId = asString(body?.userId);
  const email = asString(body?.email);
  const name = asString(body?.name);
  const type = asString(body?.type) || "comment";
  const message = asString(body?.message);

  if (!userId || message.length < 2) {
    return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  }

  const client = getAndesRelayClient();
  if (!client) {
    return NextResponse.json({ skipped: true });
  }

  const occurredAt = Date.now();
  const eventId = `wainwrights-feedback-${userId}-${occurredAt}`;

  await client.submitFeedback({
    eventId,
    occurredAt,
    externalId: eventId,
    title: `[${type}] ${message.slice(0, 90)}`,
    message,
    type,
    contact: email
      ? {
          email,
          name: name || undefined,
          locale: "en",
          externalId: userId,
        }
      : undefined,
    context: {
      accountId: userId,
      currentUrl:
        asString(body?.currentUrl) || "https://wainwrightsbaggers.com/app",
      userAgent: asString(body?.userAgent) || undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
