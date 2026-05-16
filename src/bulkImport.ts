export type BulkMatchCandidate = {
  confidence: number;
  id: string;
  name: string;
  reason?: string;
};

export type BulkMatchResult = {
  candidates: BulkMatchCandidate[];
  sourceText: string;
};

export type BulkReviewRow = BulkMatchResult & {
  selectedId?: string;
  status: "ready" | "needs-choice" | "already-bagged" | "no-match";
};

const normalizeLine = (line: string) =>
  line
    .split(new RegExp("[,\\t;|]", "g"))
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const looksLikeHeader = (line: string) => {
  const normalized = line.toLowerCase();
  return (
    /\b(name|fell|peak|summit|wainwright)\b/.test(normalized) &&
    /\b(date|notes?|completed|bagged|area)\b/.test(normalized)
  );
};

export function parseDelimitedImportText(input: string) {
  return input
    .split(/\r?\n+/)
    .map(normalizeLine)
    .filter((line) => line.length > 0)
    .filter((line, index) => index !== 0 || !looksLikeHeader(line));
}

export function buildBulkReviewRows(
  matches: BulkMatchResult[],
  completed: Set<string>,
): BulkReviewRow[] {
  return matches.map((match) => {
    const selectedId =
      match.candidates.length === 1 && match.candidates[0].confidence >= 0.9
        ? match.candidates[0].id
        : undefined;

    if (!selectedId && match.candidates.length === 0) {
      return { ...match, selectedId, status: "no-match" };
    }

    if (!selectedId) {
      return { ...match, selectedId, status: "needs-choice" };
    }

    return {
      ...match,
      selectedId,
      status: completed.has(selectedId) ? "already-bagged" : "ready",
    };
  });
}

export function countImportableRows(rows: BulkReviewRow[], completed: Set<string>) {
  return rows.filter((row) => row.selectedId && !completed.has(row.selectedId))
    .length;
}
