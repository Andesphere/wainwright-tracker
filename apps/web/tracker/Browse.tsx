import { useRef, type ReactNode, type WheelEvent } from "react";
import { cn } from "@/lib/utils";
import {
  BOOKS,
  FELLS_BY_BOOK,
  heightLabel,
  TOTAL_WAINWRIGHTS,
  type Book,
  type StatusFilter,
  type Wainwright,
} from "./fells";
import {
  BookIcon,
  ChartIcon,
  CheckIcon,
  ChevronRightIcon,
  LockIcon,
  MountainsIcon,
  PersonIcon,
  SearchIcon,
  XIcon,
} from "./icons";

const STATUS: { id: StatusFilter; title: string }[] = [
  { id: "all", title: "All" },
  { id: "toGo", title: "To go" },
  { id: "bagged", title: "Bagged" },
];

/** Search field and the account button: the part of the sheet that is always visible. */
export function BrowseHeader({
  avatarUrl,
  onAccount,
  onFocus,
  query,
  setQuery,
}: {
  avatarUrl?: string;
  onAccount: () => void;
  onFocus: () => void;
  query: string;
  setQuery: (query: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 pb-1 pt-2">
      <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-[var(--wb-fill-strong)] px-3.5 focus-within:ring-2 focus-within:ring-[var(--wb-brand)]">
        <span className="text-[var(--wb-secondary)]">
          <SearchIcon size={17} />
        </span>
        <span className="sr-only">Search fells</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={onFocus}
          placeholder={`Search ${TOTAL_WAINWRIGHTS} fells`}
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-[var(--wb-secondary)] [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="grid size-5 place-items-center rounded-full bg-[var(--wb-tertiary)] text-[var(--wb-paper)]"
            aria-label="Clear search"
          >
            <XIcon size={10} />
          </button>
        ) : null}
      </label>
      <button
        type="button"
        onClick={onAccount}
        className="wb-press grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--wb-brand)_22%,transparent)] text-[var(--wb-brand)]"
        aria-label="Account"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <PersonIcon size={22} />
        )}
      </button>
    </div>
  );
}

/** The sheet when no fell is selected: overall progress, Pro shortcuts, the seven books and the list. */
export function BrowseView({
  bagged,
  book,
  isPro,
  onBook,
  onJournal,
  onSelect,
  onStats,
  photoCount,
  query,
  results,
  selectedId,
  setStatus,
  status,
}: {
  bagged: Set<string>;
  book: Book | null;
  isPro: boolean;
  onBook: (book: Book) => void;
  onJournal: () => void;
  onSelect: (fell: Wainwright) => void;
  onStats: () => void;
  photoCount: number;
  query: string;
  results: Wainwright[];
  selectedId: string | null;
  setStatus: (status: StatusFilter) => void;
  status: StatusFilter;
}) {
  const searching = query.trim().length > 0;
  const scope = book ? `${book.name} fells` : "All fells";

  return (
    <div className="pb-6">
      {!searching ? (
        <>
          <ProgressSummary count={bagged.size} />
          <div className="grid grid-cols-2 gap-2.5 px-4 pt-3.5">
            <Shortcut
              icon={<BookIcon size={17} />}
              isPro={isPro}
              onClick={onJournal}
              subtitle={
                !isPro
                  ? "Notes, photos, albums"
                  : photoCount === 0
                    ? "Albums to print"
                    : `${photoCount} ${photoCount === 1 ? "photo" : "photos"}`
              }
              title="Journal"
            />
            <Shortcut
              icon={<ChartIcon size={17} />}
              isPro={isPro}
              onClick={onStats}
              subtitle="Years, books, records"
              title="Stats"
            />
          </div>
          <SectionTitle>The seven books</SectionTitle>
          <BookStrip bagged={bagged} book={book} onBook={onBook} />
          <div
            role="radiogroup"
            aria-label="Show"
            className="mx-4 mt-[22px] grid grid-cols-3 rounded-[10px] bg-[var(--wb-fill-strong)] p-0.5"
          >
            {STATUS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={status === option.id}
                onClick={() => setStatus(option.id)}
                className={cn(
                  "h-8 rounded-lg text-[14px] font-medium transition-[background-color,box-shadow] duration-200",
                  status === option.id
                    ? "bg-[var(--wb-card)] font-semibold shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
                    : "text-[var(--wb-label)]",
                )}
              >
                {option.title}
              </button>
            ))}
          </div>
          <SectionTitle>
            {scope} · {results.length}
          </SectionTitle>
        </>
      ) : null}

      {results.length === 0 ? (
        <p
          className="px-4 py-7 text-center text-[15px] text-[var(--wb-secondary)]"
          role="status"
        >
          {searching
            ? `No fells match “${query.trim()}”.`
            : status === "bagged"
              ? "Nothing bagged here yet."
              : "Every fell here is bagged."}
        </p>
      ) : (
        <ul
          className={cn(searching && "pt-2.5")}
          aria-label={searching ? "Search results" : scope}
        >
          {results.map((fell) => (
            <li key={fell.id}>
              <FellRow
                fell={fell}
                isBagged={bagged.has(fell.id)}
                isSelected={fell.id === selectedId}
                onClick={() => onSelect(fell)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="px-4 pb-2 pt-6 text-[13px] font-semibold uppercase! tracking-[0.02em] text-[var(--wb-secondary)]">
      {children}
    </h3>
  );
}

export function ProgressRing({
  fraction,
  size,
  width,
}: {
  fraction: number;
  size: number;
  width: number;
}) {
  const radius = (size - width) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="-rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="color-mix(in oklab, var(--wb-brand) 20%, transparent)"
        strokeWidth={width}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--wb-bracken)"
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - Math.min(1, fraction))}
        style={{
          transition:
            "stroke-dashoffset 700ms cubic-bezier(0.34, 1.2, 0.64, 1)",
        }}
        opacity={fraction > 0 ? 1 : 0}
      />
    </svg>
  );
}

/** "12 of 214" with a ring, and what to do next. */
function ProgressSummary({ count }: { count: number }) {
  const left = TOTAL_WAINWRIGHTS - count;
  return (
    <div
      className="flex items-center gap-3.5 px-4 pt-3.5"
      role="status"
      aria-label={`${count} of ${TOTAL_WAINWRIGHTS} Wainwrights bagged`}
    >
      <span className="relative grid size-[46px] place-items-center">
        <ProgressRing
          fraction={count / TOTAL_WAINWRIGHTS}
          size={46}
          width={5.5}
        />
        <span className="absolute text-[var(--wb-brand)]">
          <MountainsIcon size={17} />
        </span>
      </span>
      <span>
        <span className="wb-serif block text-[21px] font-semibold leading-tight tabular-nums">
          {count} of {TOTAL_WAINWRIGHTS}
        </span>
        <span className="block text-[15px] text-[var(--wb-secondary)]">
          {count === 0
            ? "Tap a fell to bag your first"
            : left === 0
              ? "All 214 bagged"
              : `${left} to go`}
        </span>
      </span>
    </div>
  );
}

/** Journal and Stats, one tap from the sheet. Free walkers see them locked; a tap opens the upsell. */
function Shortcut({
  icon,
  isPro,
  onClick,
  subtitle,
  title,
}: {
  icon: ReactNode;
  isPro: boolean;
  onClick: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="wb-press flex min-w-0 items-center gap-2 rounded-2xl bg-[var(--wb-fill)] p-2.5 text-left hover:bg-[var(--wb-fill-strong)]"
      aria-label={
        isPro ? `${title}. ${subtitle}` : `${title}, Pro. ${subtitle}`
      }
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[color-mix(in_oklab,var(--wb-brand)_14%,transparent)] text-[var(--wb-brand)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[15px] font-semibold leading-tight">
          {title}
          {!isPro ? (
            <span className="text-[var(--wb-tertiary)]">
              <LockIcon size={10} />
            </span>
          ) : null}
        </span>
        <span className="block truncate text-[11.5px] text-[var(--wb-secondary)]">
          {subtitle}
        </span>
      </span>
    </button>
  );
}

/** The seven Pictorial Guides as a horizontal strip. Tap to filter the list and frame the book. */
function BookStrip({
  bagged,
  book,
  onBook,
}: {
  bagged: Set<string>;
  book: Book | null;
  onBook: (book: Book) => void;
}) {
  const strip = useRef<HTMLDivElement | null>(null);

  // A mouse wheel scrolls the strip sideways until it reaches an end.
  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    const element = strip.current;
    if (!element || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const max = element.scrollWidth - element.clientWidth;
    const next = element.scrollLeft + event.deltaY;
    if (
      (event.deltaY < 0 && element.scrollLeft <= 0) ||
      (event.deltaY > 0 && element.scrollLeft >= max)
    ) {
      return;
    }
    element.scrollLeft = Math.max(0, Math.min(max, next));
    event.preventDefault();
  };

  return (
    <div
      ref={strip}
      onWheel={onWheel}
      className="wb-no-scrollbar flex snap-x gap-2.5 overflow-x-auto scroll-px-4 px-4"
    >
      {BOOKS.map((item) => {
        const fells = FELLS_BY_BOOK.get(item.number) ?? [];
        const done = fells.filter((fell) => bagged.has(fell.id)).length;
        const selected = book?.number === item.number;
        return (
          <button
            key={item.number}
            type="button"
            onClick={() => onBook(item)}
            aria-pressed={selected}
            aria-label={`The ${item.name} Fells, ${done} of ${fells.length} bagged`}
            className={cn(
              "wb-press flex w-[124px] shrink-0 snap-start flex-col gap-2 rounded-2xl p-3 text-left",
              selected
                ? "bg-[color-mix(in_oklab,var(--wb-brand)_20%,transparent)] shadow-[inset_0_0_0_1.5px_var(--wb-brand)]"
                : "bg-[var(--wb-fill)] hover:bg-[var(--wb-fill-strong)]",
            )}
          >
            <span className="flex items-center justify-between">
              <ProgressRing
                fraction={done / Math.max(fells.length, 1)}
                size={22}
                width={3.5}
              />
              <span className="text-xs font-medium tabular-nums text-[var(--wb-secondary)]">
                {done}/{fells.length}
              </span>
            </span>
            <span>
              <span className="block truncate text-[15px] font-semibold">
                {item.name}
              </span>
              <span className="block text-xs text-[var(--wb-secondary)]">
                Book {item.ordinal}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The map marker, at list size. */
export function FellDot({ isBagged }: { isBagged: boolean }) {
  return (
    <span
      className={cn(
        "grid size-[22px] shrink-0 place-items-center rounded-full shadow-[inset_0_0_0_1.8px_var(--wb-pine)] text-[var(--wb-pine)]",
        isBagged ? "bg-[var(--wb-bracken)]" : "bg-[var(--wb-cream)]",
      )}
      aria-hidden="true"
    >
      {isBagged ? <CheckIcon size={12} /> : null}
    </span>
  );
}

function FellRow({
  fell,
  isBagged,
  isSelected,
  onClick,
}: {
  fell: Wainwright;
  isBagged: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isSelected || undefined}
      aria-label={`${fell.name}, ${heightLabel(fell).replace(" m", " metres")}, The ${fell.area} Fells${isBagged ? ", bagged" : ""}`}
      className="group flex w-full items-center gap-3.5 pl-4 text-left hover:bg-[var(--wb-fill)] active:bg-[var(--wb-fill-strong)]"
    >
      <FellDot isBagged={isBagged} />
      <span className="flex min-w-0 flex-1 items-center gap-2 border-b border-[var(--wb-separator)] py-2.5 pr-4">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-medium">
            {fell.name}
          </span>
          <span className="block text-[15px] text-[var(--wb-secondary)]">
            {fell.area} · {heightLabel(fell)}
          </span>
        </span>
        <span className="text-[var(--wb-tertiary)]">
          <ChevronRightIcon size={14} />
        </span>
      </span>
    </button>
  );
}
