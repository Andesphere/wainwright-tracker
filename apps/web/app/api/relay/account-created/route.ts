import { NextResponse } from "next/server";
import { getAndesRelayClient } from "@/lib/andes-relay";

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const userId = asString(body?.userId);
  const email = asString(body?.email);
  const name = asString(body?.name);

  if (!userId || !email) {
    return NextResponse.json(
      { error: "Missing userId or email" },
      { status: 400 },
    );
  }

  const client = getAndesRelayClient();
  if (!client) {
    return NextResponse.json({ skipped: true });
  }

  await client.trackAccountCreated({
    eventId: `wainwrights-account-created-${userId}`,
    externalId: userId,
    email,
    name: name || undefined,
    locale: "en",
    source: "clerk",
    contact: {
      email,
      name: name || undefined,
      locale: "en",
      externalId: userId,
    },
    context: {
      accountId: userId,
      currentUrl: "https://wainwrightsbaggers.com/app",
    },
  });

  return NextResponse.json({ ok: true });
}
