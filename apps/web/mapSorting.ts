import type { Wainwright } from "@wainwrights/catalog/wainwrights";

export type JournalSort =
  | "progress"
  | "date-desc"
  | "date-asc"
  | "guide"
  | "height-desc";

export type JournalCompletionEntry = {
  completedAt?: string;
  id: string;
};

type SortOptions = {
  completed: Set<string>;
  entriesById: Map<string, JournalCompletionEntry>;
  sortBy: JournalSort;
};

function completionTime(entry?: JournalCompletionEntry) {
  if (!entry?.completedAt) return Number.NaN;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(entry.completedAt)
    ? `${entry.completedAt}T00:00:00`
    : entry.completedAt;
  const time = new Date(normalized).getTime();
  return Number.isNaN(time) ? Number.NaN : time;
}

function dateRank(
  peak: Wainwright,
  entriesById: Map<string, JournalCompletionEntry>,
) {
  return completionTime(entriesById.get(peak.id));
}

function compareDate(
  direction: "asc" | "desc",
  entriesById: Map<string, JournalCompletionEntry>,
) {
  return (a: Wainwright, b: Wainwright) => {
    const aTime = dateRank(a, entriesById);
    const bTime = dateRank(b, entriesById);
    const aHasDate = !Number.isNaN(aTime);
    const bHasDate = !Number.isNaN(bTime);

    if (aHasDate !== bHasDate) return aHasDate ? -1 : 1;
    if (aHasDate && bHasDate && aTime !== bTime) {
      return direction === "desc" ? bTime - aTime : aTime - bTime;
    }
    return a.bookNumber - b.bookNumber;
  };
}

export function sortWainwrightsForJournal(
  peaks: Wainwright[],
  { completed, entriesById, sortBy }: SortOptions,
) {
  return [...peaks].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return compareDate("desc", entriesById)(a, b);
      case "date-asc":
        return compareDate("asc", entriesById)(a, b);
      case "guide":
        return a.bookNumber - b.bookNumber;
      case "height-desc":
        return b.heightMetres - a.heightMetres || a.bookNumber - b.bookNumber;
      case "progress":
      default:
        return (
          Number(completed.has(a.id)) - Number(completed.has(b.id)) ||
          a.bookNumber - b.bookNumber
        );
    }
  });
}
