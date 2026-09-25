import { BOOKS, FELLS_BY_BOOK, FELLS_BY_ID, type Wainwright } from "./fells";

type Entry = { completedAt?: string; id: string };
type Dated = { date: Date; fell: Wainwright };

/** "2026-09-24", or a full ISO timestamp from older web saves, read as a calendar day. */
export function parseBagDate(value?: string): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Everything the Stats view shows, from the bagged fells and the days they were walked. */
export function computeStats(entries: Entry[]) {
  const bagged = entries.flatMap((entry) => {
    const fell = FELLS_BY_ID.get(entry.id);
    return fell ? [fell] : [];
  });
  const dated: Dated[] = entries.flatMap((entry) => {
    const fell = FELLS_BY_ID.get(entry.id);
    const date = parseBagDate(entry.completedAt);
    return fell && date ? [{ date, fell }] : [];
  });

  const years = new Map<number, number>();
  for (const { date } of dated) {
    years.set(date.getFullYear(), (years.get(date.getFullYear()) ?? 0) + 1);
  }
  const perBook = BOOKS.map((book) => ({
    book,
    done: bagged.filter((fell) => fell.area === book.name).length,
    total: FELLS_BY_BOOK.get(book.number)?.length ?? 0,
  }));
  const byHeight = [...bagged].sort((a, b) => b.heightMetres - a.heightMetres);
  const byDate = [...dated].sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    bagged,
    booksComplete: perBook.filter((item) => item.done === item.total).length,
    first: byDate[0] ?? null,
    highest: byHeight[0] ?? null,
    latest: byDate.at(-1) ?? null,
    lowest: byHeight.at(-1) ?? null,
    perBook,
    perYear: [...years]
      .map(([year, count]) => ({ count, year }))
      .sort((a, b) => a.year - b.year),
    summitMetres: bagged.reduce((total, fell) => total + fell.heightMetres, 0),
    undated: bagged.length - dated.length,
  };
}

export type Stats = ReturnType<typeof computeStats>;
