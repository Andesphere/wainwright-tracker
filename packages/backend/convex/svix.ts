// Clerk sends webhooks through Svix. Spec:
// https://docs.svix.com/receiving/verifying-payloads/how-manual

const TOLERANCE_SECONDS = 5 * 60;

/** Compares two strings without leaking where they differ. */
export const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
};

/** True when `body` was signed with `secret` (`whsec_...`) in the last five minutes. */
export const verifySvixSignature = async (
  secret: string,
  headers: Headers,
  body: string,
  now = Date.now(),
) => {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!id || !timestamp || !signatures) return false;

  const seconds = Number(timestamp);
  if (
    !Number.isFinite(seconds) ||
    Math.abs(now / 1000 - seconds) > TOLERANCE_SECONDS
  ) {
    return false;
  }

  const keyBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, "")), (c) =>
    c.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${body}`),
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

  // Several space-separated "v1,<base64>" entries while a secret rotates.
  return signatures.split(" ").some((entry) => {
    const [version, signature] = entry.split(",");
    return (
      version === "v1" &&
      signature !== undefined &&
      safeEqual(signature, expected)
    );
  });
};
