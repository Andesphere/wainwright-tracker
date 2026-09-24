import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { heightLabel, TOTAL_WAINWRIGHTS } from "./fells";
import {
  ArrowDownToLineIcon,
  ArrowUpToLineIcon,
  ChartIcon,
  ClockIcon,
  FlagIcon,
} from "./icons";
import type { Stats } from "./stats";

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const whole = new Intl.NumberFormat("en-GB");

/** A full-height screen over the map: Journal, Stats or Account. */
export function Screen({
  children,
  description,
  onOpenChange,
  open,
  title,
}: {
  children: ReactNode;
  description: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus();
        }}
        className="wb-surface top-auto bottom-0 flex outline-none h-[calc(100dvh-2.5rem)] w-full max-w-none translate-y-0 flex-col gap-0 overflow-hidden rounded-b-none rounded-t-[30px] border-0 bg-[var(--wb-paper)] p-0 sm:bottom-auto sm:top-1/2 sm:h-[min(88dvh,56rem)] sm:w-[min(calc(100vw-3rem),46rem)] sm:-translate-y-1/2 sm:rounded-[30px]"
      >
        <div className="flex items-center justify-between px-5 pb-1 pt-4">
          <DialogTitle className="text-[32px] font-bold tracking-[-0.02em]">
            {title}
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="wb-press rounded-full bg-[var(--wb-card)] px-4 py-2 text-[17px] font-semibold text-[var(--wb-brand)] shadow-[0_4px_14px_-6px_rgba(0,0,0,0.25)]"
          >
            Done
          </button>
        </div>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <div className="wb-panel-scroll min-h-0 flex-1 overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Pro stats from the walker's bagged fells and the dates they walked them. */
export function StatsView({ stats }: { stats: Stats }) {
  if (stats.bagged.length === 0) {
    return (
      <div className="grid place-items-center px-6 py-24 text-center">
        <span className="text-[var(--wb-secondary)]">
          <ChartIcon size={44} />
        </span>
        <p className="mt-3 text-[20px] font-semibold">No fells bagged yet</p>
        <p className="mt-1 text-[15px] text-[var(--wb-secondary)]">
          Bag your first fell and your stats start here.
        </p>
      </div>
    );
  }

  const percent = Math.round((stats.bagged.length / TOTAL_WAINWRIGHTS) * 100);
  const maxYear = Math.max(1, ...stats.perYear.map((item) => item.count));

  return (
    <div className="grid gap-3.5 px-4 pb-8 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <Tile
          label="Fells bagged"
          value={String(stats.bagged.length)}
          unit={`of ${TOTAL_WAINWRIGHTS}`}
          detail={`${percent}% of the Wainwrights`}
        />
        <Tile
          label="Books complete"
          value={String(stats.booksComplete)}
          unit="of 7"
          detail={`${TOTAL_WAINWRIGHTS - stats.bagged.length} fells to go`}
        />
        <div className="col-span-2">
          <Tile
            label="Summit heights added up"
            value={whole.format(Math.round(stats.summitMetres))}
            unit="m"
            detail="The heights of your fells together, not the metres you climbed"
          />
        </div>
      </div>

      {stats.perYear.length > 0 ? (
        <Card
          title="Fells per year"
          footnote={
            stats.undated > 0
              ? `${stats.undated} ${stats.undated === 1 ? "fell has" : "fells have"} no date and ${stats.undated === 1 ? "is" : "are"} left out.`
              : undefined
          }
        >
          <figure>
            <figcaption className="sr-only">
              Fells bagged per year:{" "}
              {stats.perYear
                .map((item) => `${item.year}, ${item.count}`)
                .join("; ")}
            </figcaption>
            <div className="flex h-[170px] items-end gap-3" aria-hidden="true">
              {stats.perYear.map((item) => (
                <div
                  key={item.year}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                >
                  <span className="mb-1 text-xs font-semibold tabular-nums">
                    {item.count}
                  </span>
                  <span
                    className="w-[62%] rounded-t-[4px] bg-[var(--wb-bracken)]"
                    style={{
                      height: `${(item.count / (maxYear * 1.18)) * 138}px`,
                    }}
                  />
                  <span className="mt-1.5 text-xs tabular-nums text-[var(--wb-secondary)]">
                    {item.year}
                  </span>
                </div>
              ))}
            </div>
          </figure>
        </Card>
      ) : null}

      <Card title="By book">
        <ul className="grid gap-3.5">
          {stats.perBook.map(({ book, done, total }) => (
            <li
              key={book.number}
              aria-label={`The ${book.name} Fells: ${done} of ${total} bagged`}
            >
              <div className="flex items-baseline gap-2" aria-hidden="true">
                <span className="flex-1 text-[15px] font-semibold">
                  {book.name}
                </span>
                <span className="text-[15px] tabular-nums">
                  {done} of {total}
                </span>
                <span className="w-[68px] text-right text-xs text-[var(--wb-secondary)]">
                  {done === total ? "Complete" : `${total - done} to go`}
                </span>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--wb-fill-strong)]"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-[var(--wb-bracken)]"
                  style={{
                    width:
                      done === 0
                        ? 0
                        : `max(8px, ${(done / Math.max(total, 1)) * 100}%)`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Records">
        <ul>
          {stats.highest ? (
            <Record
              icon={<ArrowUpToLineIcon size={15} />}
              title="Highest bagged"
              fell={stats.highest.name}
              detail={heightLabel(stats.highest)}
            />
          ) : null}
          {stats.lowest && stats.lowest.id !== stats.highest?.id ? (
            <Record
              icon={<ArrowDownToLineIcon size={15} />}
              title="Lowest bagged"
              fell={stats.lowest.name}
              detail={heightLabel(stats.lowest)}
            />
          ) : null}
          {stats.first ? (
            <Record
              icon={<FlagIcon size={15} />}
              title="First bag"
              fell={stats.first.fell.name}
              detail={shortDate.format(stats.first.date)}
            />
          ) : null}
          {stats.latest && stats.latest.fell.id !== stats.first?.fell.id ? (
            <Record
              icon={<ClockIcon size={15} />}
              title="Latest bag"
              fell={stats.latest.fell.name}
              detail={shortDate.format(stats.latest.date)}
            />
          ) : null}
        </ul>
      </Card>
    </div>
  );
}

function Tile({
  detail,
  label,
  unit,
  value,
}: {
  detail: string;
  label: string;
  unit: string;
  value: string;
}) {
  return (
    <div className="h-full rounded-[20px] bg-[var(--wb-card)] p-4">
      <p className="text-[13px] font-semibold text-[var(--wb-secondary)]">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="wb-serif text-[34px] font-semibold leading-none tracking-[-0.02em]">
          {value}
        </span>
        <span className="text-[15px] text-[var(--wb-secondary)]">{unit}</span>
      </p>
      <p className="mt-1.5 text-xs text-[var(--wb-secondary)]">{detail}</p>
    </div>
  );
}

function Card({
  children,
  footnote,
  title,
}: {
  children: ReactNode;
  footnote?: string;
  title: string;
}) {
  return (
    <section className="grid gap-3.5 rounded-[20px] bg-[var(--wb-card)] p-4">
      <h3 className="wb-serif text-[21px] font-semibold">{title}</h3>
      {children}
      {footnote ? (
        <p className="text-xs text-[var(--wb-secondary)]">{footnote}</p>
      ) : null}
    </section>
  );
}

function Record({
  detail,
  fell,
  icon,
  title,
}: {
  detail: string;
  fell: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="grid size-8 place-items-center rounded-full bg-[color-mix(in_oklab,var(--wb-brand)_12%,transparent)] text-[var(--wb-brand)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-[var(--wb-secondary)]">
          {title}
        </span>
        <span className="wb-serif block truncate text-[17px] font-medium">
          {fell}
        </span>
      </span>
      <span className="text-[15px] tabular-nums text-[var(--wb-secondary)]">
        {detail}
      </span>
    </li>
  );
}
