import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  bookOf,
  bookTitle,
  feetLabel,
  HEIGHT_RANK,
  heightLabel,
  TOTAL_WAINWRIGHTS,
  type Wainwright,
} from "./fells";
import { PhotoIcon, PlusIcon, SealCheckIcon, XIcon } from "./icons";
import { formatCompletionDate, type CompletionEntry } from "./journal";
import { LockedFeatureRow, ProBadge, type ProFeature } from "./Pro";

const today = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

/** The panel when a fell is selected: name, height, book, and Bag it. Once bagged, the journal. */
export function FellCard({
  baggedCount,
  entry,
  fell,
  isBagged,
  isPro,
  onBag,
  onClose,
  onEditJournal,
  onUnbag,
  onUpsell,
}: {
  baggedCount: number;
  entry?: CompletionEntry;
  fell: Wainwright;
  isBagged: boolean;
  isPro: boolean;
  onBag: (date: string) => Promise<void>;
  onClose: () => void;
  onEditJournal: () => void;
  onUnbag: () => void;
  onUpsell: (feature: ProFeature) => void;
}) {
  const book = bookOf(fell);
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [confirmingUnbag, setConfirmingUnbag] = useState(false);
  const heading = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [fell.id]);

  const hasJournal = Boolean(entry?.note) || (entry?.photos?.length ?? 0) > 0;

  const bag = async () => {
    setSaving(true);
    try {
      await onBag(date);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-[18px] px-5 pb-6 pt-4 wb-fade-in">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2
            ref={heading}
            tabIndex={-1}
            className="wb-serif text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] outline-none"
          >
            {fell.name}
          </h2>
          <p className="mt-1 text-[15px] text-[var(--wb-secondary)]">
            {bookTitle(book)} · Book {book.ordinal}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="wb-press grid size-[34px] shrink-0 place-items-center rounded-full bg-[var(--wb-fill-strong)] text-[var(--wb-secondary)]"
          aria-label="Close"
        >
          <XIcon size={14} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Stat
          title="Height"
          value={heightLabel(fell)}
          detail={feetLabel(fell)}
        />
        <Stat title="Book" value={book.ordinal} detail={book.name} />
        <Stat
          title="Rank"
          value={`#${HEIGHT_RANK.get(fell.id) ?? 0}`}
          detail="by height"
        />
      </div>

      {isBagged ? (
        <div className="grid gap-2.5">
          <div
            className="flex items-center gap-3 rounded-2xl bg-[color-mix(in_oklab,var(--wb-bracken)_18%,transparent)] p-3.5"
            role="status"
          >
            <span className="text-[var(--wb-bracken)]">
              <SealCheckIcon size={28} />
            </span>
            <span>
              <span className="block text-[17px] font-semibold">Bagged</span>
              <span className="block text-[15px] text-[var(--wb-secondary)]">
                {entry?.completedAt
                  ? `${formatCompletionDate(entry.completedAt)} · ${baggedCount} of ${TOTAL_WAINWRIGHTS} done`
                  : `${baggedCount} of ${TOTAL_WAINWRIGHTS} done`}
              </span>
            </span>
          </div>

          <div className="pt-1.5">
            <JournalSection
              entry={entry}
              fell={fell}
              isPro={isPro}
              onEdit={onEditJournal}
              onUpsell={onUpsell}
            />
          </div>

          <button
            type="button"
            onClick={() => (hasJournal ? setConfirmingUnbag(true) : onUnbag())}
            className="mx-auto mt-1 rounded-full px-3 py-1.5 text-[13px] text-[var(--wb-secondary)] hover:text-[var(--wb-label)]"
          >
            Mark as not bagged
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <label className="flex items-center justify-between gap-3 text-[15px]">
            Date walked
            <input
              type="date"
              value={date}
              max={today()}
              required
              onChange={(event) => setDate(event.target.value)}
              className="wb-focus rounded-full bg-[var(--wb-fill-strong)] px-3.5 py-1.5 text-[15px] text-[var(--wb-label)] [color-scheme:inherit]"
            />
          </label>
          <button
            type="button"
            onClick={() => void bag()}
            disabled={saving || !date}
            className="wb-press flex h-[52px] items-center justify-center gap-2 rounded-full bg-[var(--wb-brand)] text-[17px] font-semibold text-white shadow-[0_10px_24px_-14px_rgba(31,66,50,0.9)] disabled:opacity-60"
          >
            <span className="grid size-5 place-items-center rounded-full bg-white text-[var(--wb-brand)]">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m5 12.5 4.4 4.4L19 7.4"
                />
              </svg>
            </span>
            {saving ? "Bagging…" : "Bag it"}
          </button>
        </div>
      )}

      <Dialog open={confirmingUnbag} onOpenChange={setConfirmingUnbag}>
        <DialogContent className="wb-surface">
          <DialogHeader>
            <DialogTitle>Mark {fell.name} as not bagged?</DialogTitle>
            <DialogDescription>
              Its journal note and photos are deleted too.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmingUnbag(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setConfirmingUnbag(false);
                onUnbag();
              }}
            >
              Remove bag, note and photos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  detail,
  title,
  value,
}: {
  detail: string;
  title: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[14px] bg-[var(--wb-fill)] px-3 py-2.5">
      <p className="text-xs text-[var(--wb-secondary)]">{title}</p>
      <p className="truncate text-[17px] font-semibold">{value}</p>
      <p className="truncate text-xs text-[var(--wb-secondary)]">{detail}</p>
    </div>
  );
}

/**
 * The journal on a bagged fell: the note and up to two photos. Free walkers see what it would
 * hold and a tap opens the upsell; a note or photos saved while they had Pro stay visible, read-only.
 */
function JournalSection({
  entry,
  fell,
  isPro,
  onEdit,
  onUpsell,
}: {
  entry?: CompletionEntry;
  fell: Wainwright;
  isPro: boolean;
  onEdit: () => void;
  onUpsell: (feature: ProFeature) => void;
}) {
  const [viewing, setViewing] = useState<string | null>(null);
  const photos = entry?.photos ?? [];
  const note = entry?.note;

  if (!isPro && !note && photos.length === 0) {
    return (
      <LockedFeatureRow
        icon={<PhotoIcon size={20} />}
        title="Add a note and photos"
        subtitle="Keep the day with the fell"
        onClick={() => onUpsell("journal")}
      />
    );
  }

  return (
    <section className="grid gap-2.5" aria-label="Journal">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold uppercase! tracking-[0.02em] text-[var(--wb-secondary)]">
          Journal
        </h3>
        {isPro ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-[15px] font-semibold text-[var(--wb-brand)]"
          >
            {note ? "Edit" : "Add note"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onUpsell("journal")}
            aria-label="Read only. Get Pro to edit"
          >
            <ProBadge />
          </button>
        )}
      </div>

      {note ? (
        <button
          type="button"
          onClick={isPro ? onEdit : undefined}
          disabled={!isPro}
          className="wb-serif w-full whitespace-pre-line rounded-2xl bg-[var(--wb-fill)] p-3.5 text-left text-[17px] leading-snug disabled:cursor-default"
        >
          {note}
        </button>
      ) : null}

      {photos.length === 0 && isPro ? (
        <button
          type="button"
          onClick={onEdit}
          className="wb-press flex h-[76px] items-center justify-center gap-2.5 rounded-2xl border-[1.2px] border-dashed border-[color-mix(in_oklab,var(--wb-brand)_40%,transparent)] bg-[color-mix(in_oklab,var(--wb-brand)_7%,transparent)] text-[15px] font-medium text-[var(--wb-brand)]"
        >
          <PhotoIcon size={20} />
          Add up to two photos
        </button>
      ) : null}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {photos.map((photo, index) =>
            photo.url ? (
              <button
                key={photo.storageId}
                type="button"
                onClick={() => setViewing(photo.url ?? null)}
                className="wb-press aspect-[4/3] overflow-hidden rounded-[14px] bg-[var(--wb-fill)]"
                aria-label={`Open photo ${index + 1} of ${fell.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt=""
                  className="size-full object-cover"
                />
              </button>
            ) : (
              <div
                key={photo.storageId}
                className="grid aspect-[4/3] place-items-center rounded-[14px] bg-[var(--wb-fill)] text-xs text-[var(--wb-secondary)]"
              >
                Photo saved
              </div>
            ),
          )}
          {isPro && photos.length < 2 ? (
            <button
              type="button"
              onClick={onEdit}
              className="wb-press flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-[14px] bg-[color-mix(in_oklab,var(--wb-brand)_7%,transparent)] text-[var(--wb-brand)]"
            >
              <PlusIcon size={22} />
              <span className="text-xs font-medium">Add photo</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {!isPro ? (
        <p className="text-[13px] text-[var(--wb-secondary)]">
          Saved while you had Pro. Get Pro again to edit it or add more.
        </p>
      ) : null}

      <Dialog
        open={viewing !== null}
        onOpenChange={(open) => !open && setViewing(null)}
      >
        <DialogContent className="fullscreen-photo-dialog" showCloseButton>
          <DialogTitle className="sr-only">{fell.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Photo of {fell.name}
          </DialogDescription>
          {viewing ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={viewing}
              alt={`Photo of ${fell.name}`}
              className={cn("fullscreen-photo-image")}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
