import { createAndesRelayClient } from "@openandes/relay-sdk";

const endpoint =
  process.env.ANDES_RELAY_ENDPOINT ?? process.env.CUSTOMER_OPS_ENDPOINT;
const secret =
  process.env.ANDES_RELAY_INGEST_SECRET ??
  process.env.CUSTOMER_OPS_INGEST_SECRET;

export const getAndesRelayClient = () => {
  if (!endpoint || !secret) {
    return null;
  }

  return createAndesRelayClient({
    endpoint,
    secret,
    workspaceKey: "andesphere",
    productKey: "wainwrights-baggers",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
};
