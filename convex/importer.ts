import { ConvexError, v } from "convex/values";
import { generateText, createGateway } from "ai";

import { action } from "./_generated/server";
import { WAINWRIGHTS } from "../src/data/wainwrights";

const candidateValidator = v.object({
  confidence: v.number(),
  id: v.string(),
  name: v.string(),
  reason: v.optional(v.string()),
});

const matchValidator = v.object({
  candidates: v.array(candidateValidator),
  sourceText: v.string(),
});

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
});

const MAX_IMPORT_LINES = 150;
const MAX_IMPORT_LINE_CHARS = 220;

const extractJsonArray = (text: string) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const body = fenced ?? text;
  const start = body.indexOf("[");
  const end = body.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return [];
  return JSON.parse(body.slice(start, end + 1));
};

const cleanCandidate = (
  candidate: unknown,
  wainwrightById: Map<string, { id: string; name: string }>,
) => {
  if (!candidate || typeof candidate !== "object") return null;
  const raw = candidate as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id : "";
  const peak = wainwrightById.get(id);
  if (!peak) return null;
  const confidence =
    typeof raw.confidence === "number"
      ? Math.max(0, Math.min(1, raw.confidence))
      : 0.5;
  return {
    confidence,
    id: peak.id,
    name: peak.name,
    reason: typeof raw.reason === "string" ? raw.reason.slice(0, 160) : undefined,
  };
};

export const matchImport = action({
  args: {
    lines: v.array(v.string()),
  },
  returns: v.array(matchValidator),
  handler: async (_ctx, args) => {
    const identity = await _ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Sign in to use AI matching.",
      });
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      throw new ConvexError({
        code: "MISSING_AI_GATEWAY_API_KEY",
        message: "AI matching is not configured yet.",
      });
    }

    const lines = args.lines
      .map((line) => line.trim().slice(0, MAX_IMPORT_LINE_CHARS))
      .filter(Boolean)
      .slice(0, MAX_IMPORT_LINES);

    if (lines.length === 0) return [];

    const canonicalWainwrights = WAINWRIGHTS.map((peak) => ({
      area: peak.area,
      bookNumber: peak.bookNumber,
      gridReference: peak.gridReference,
      id: peak.id,
      name: peak.name,
    }));
    const wainwrightById = new Map(
      canonicalWainwrights.map((peak) => [peak.id, { id: peak.id, name: peak.name }]),
    );

    const { text } = await generateText({
      model: gateway("openai/gpt-4o-mini"),
      temperature: 0,
      system:
        "You match messy user-provided hiking/completion records to canonical Wainwright fells. Return strict JSON only. Never invent IDs. If one row could mean more than one fell, include up to 4 candidates rather than choosing. If no plausible Wainwright exists, return an empty candidates array.",
      prompt: JSON.stringify({
        responseShape:
          "Array<{ sourceText: string, candidates: Array<{ id: string, confidence: number, reason: string }> }>",
        canonicalWainwrights,
        importedRows: lines,
      }),
    });

    let parsed: unknown;
    try {
      parsed = extractJsonArray(text);
    } catch (error) {
      throw new ConvexError({
        code: "AI_MATCH_PARSE_FAILED",
        message:
          error instanceof Error
            ? `Could not parse AI match response: ${error.message}`
            : "Could not parse AI match response.",
      });
    }

    const rawMatches = Array.isArray(parsed) ? parsed : [];
    const rows = lines.map((line) => {
      const rawMatch = rawMatches.find(
        (item) =>
          item &&
          typeof item === "object" &&
          (item as Record<string, unknown>).sourceText === line,
      ) as Record<string, unknown> | undefined;
      const candidates = Array.isArray(rawMatch?.candidates)
        ? rawMatch.candidates
            .map((candidate) => cleanCandidate(candidate, wainwrightById))
            .filter((candidate) => candidate !== null)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 4)
        : [];
      return { candidates, sourceText: line };
    });

    return rows;
  },
});
