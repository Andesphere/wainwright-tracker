import { NextResponse } from "next/server";
import { getAndesRelayClient } from "@/lib/andes-relay";

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = asString(body?.name);
  const email = asString(body?.email);
  const message = asString(body?.message);

  if (name.length < 2 || !email.includes("@") || message.length < 10) {
    return NextResponse.json(
      { error: "Invalid contact form" },
      { status: 400 },
    );
  }

  const client = getAndesRelayClient();
  if (!client) {
    return NextResponse.json({ skipped: true });
  }

  const occurredAt = Date.now();
  const eventId = `wainwrights-contact-${occurredAt}-${crypto.randomUUID()}`;

  await client.submitContactForm({
    eventId,
    occurredAt,
    externalId: eventId,
    subject: "Website contact form",
    message,
    page: "https://wainwrightsbaggers.com/contact",
    contact: {
      email,
      name,
      locale: "en",
    },
    context: {
      currentUrl:
        asString(body?.currentUrl) || "https://wainwrightsbaggers.com/contact",
    },
  });

  return NextResponse.json({ ok: true });
}
