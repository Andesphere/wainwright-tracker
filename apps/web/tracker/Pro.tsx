import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/appStore";
import { cn } from "@/lib/utils";
import {
  BookIcon,
  ChartIcon,
  LayersIcon,
  LockIcon,
  PhotoIcon,
  XIcon,
} from "./icons";

/** What Pro unlocks. The upsell highlights the one the walker tapped. */
export type ProFeature = "journal" | "albums" | "layers" | "stats";

const FEATURES: {
  id: ProFeature;
  title: string;
  pitch: string;
  icon: (props: { size?: number }) => ReactNode;
}[] = [
  {
    id: "journal",
    title: "Photo journal",
    pitch: "Notes and two photos for every fell.",
    icon: PhotoIcon,
  },
  {
    id: "albums",
    title: "Albums you can print",
    pitch: "Your bagging days as albums, ready to print.",
    icon: BookIcon,
  },
  {
    id: "layers",
    title: "Satellite and contours",
    pitch: "Satellite imagery and detailed contours.",
    icon: LayersIcon,
  },
  {
    id: "stats",
    title: "Your stats",
    pitch: "Years, books, highest and lowest.",
    icon: ChartIcon,
  },
];

/** "PRO" on a bracken capsule, with a small lock. */
export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-[3px] rounded-full bg-[var(--wb-bracken)] px-2 py-1 text-[11px] font-extrabold leading-none tracking-[0.06em] text-[var(--wb-pine)]">
      <LockIcon size={9} />
      PRO
    </span>
  );
}

/** A Pro feature shown to a free walker: what it is, a Pro badge, and a tap to the upsell. */
export function LockedFeatureRow({
  icon,
  onClick,
  subtitle,
  title,
}: {
  icon: ReactNode;
  onClick: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="wb-press flex w-full items-center gap-3 rounded-2xl bg-[var(--wb-fill)] p-3 text-left"
      aria-label={`${title}. ${subtitle}. Pro`}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[color-mix(in_oklab,var(--wb-brand)_14%,transparent)] text-[var(--wb-brand)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className="block text-[13px] text-[var(--wb-secondary)]">
          {subtitle}
        </span>
      </span>
      <ProBadge />
    </button>
  );
}

/** Contour lines for the hero, drawn like the iPhone paywall. */
function ContourHero() {
  const rings = Array.from({ length: 9 }, (_, index) => {
    const ring = index + 1;
    const points = Array.from({ length: 61 }, (_, step) => {
      const angle = (step / 60) * Math.PI * 2;
      const wobble =
        1 +
        0.16 * Math.sin(3 * angle + ring * 0.5) +
        0.06 * Math.cos(5 * angle);
      const r = ring * 26;
      return `${(300 + Math.cos(angle) * r * wobble * 1.3).toFixed(1)},${(70 + Math.sin(angle) * r * wobble).toFixed(1)}`;
    });
    return (
      <polyline
        key={ring}
        points={points.join(" ")}
        fill="none"
        stroke="rgba(250,250,232,0.22)"
        strokeWidth={ring % 5 === 0 ? 1.6 : 0.9}
      />
    );
  });
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {rings}
    </svg>
  );
}

/**
 * The web's Pro upsell. Pro is bought in the iPhone app for now; the same account unlocks it here.
 * Stays a sheet of facts, not a checkout: no prices, no web payments.
 */
export function ProUpsell({
  feature,
  onOpenChange,
  open,
}: {
  feature: ProFeature | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="wb-surface w-[min(calc(100vw-1.5rem),26rem)] gap-0 overflow-hidden rounded-[28px] border-0 bg-[var(--wb-paper)] p-0 shadow-2xl"
      >
        <div className="relative overflow-hidden bg-[linear-gradient(160deg,#3e6e54,#1f4232)] px-6 pb-6 pt-7 text-[var(--wb-cream)]">
          <ContourHero />
          <div className="relative">
            <span className="inline-flex rounded-full bg-[var(--wb-bracken)] px-2.5 py-1 text-[11px] font-extrabold tracking-[0.08em] text-[var(--wb-pine)]">
              PRO
            </span>
            <DialogTitle className="wb-serif mt-3 text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--wb-cream)]">
              Wainwrights Baggers Pro
            </DialogTitle>
            <DialogDescription className="mt-2 text-[15px] text-[rgba(250,250,232,0.82)]">
              Keep the story of every fell you bag.
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-black/20 text-[var(--wb-cream)]"
            aria-label="Close"
          >
            <XIcon size={14} />
          </button>
        </div>

        <ul className="grid gap-0.5 px-4 pt-4">
          {FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-2.5 py-2",
                  item.id === feature &&
                    "bg-[color-mix(in_oklab,var(--wb-bracken)_16%,transparent)]",
                )}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(135deg,#5c946f,#3e6e54)] text-[var(--wb-cream)]">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold">
                    {item.title}
                  </span>
                  <span className="block text-[13px] text-[var(--wb-secondary)]">
                    {item.pitch}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>

        <div className="grid gap-3 px-6 pb-6 pt-5">
          {APP_STORE_LIVE ? (
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="wb-press flex h-[52px] items-center justify-center gap-2 rounded-full bg-[var(--wb-brand)] text-[17px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(31,66,50,0.8)]"
            >
              <svg
                width="16"
                height="19"
                viewBox="0 0 17 20"
                aria-hidden="true"
                fill="currentColor"
              >
                <path d="M14.1 10.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9C3.8 4.9 2.2 5.9 1.3 7.4c-1.8 3.2-.5 7.9 1.3 10.4.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.8-1-2.8-4.4ZM11.6 3.2c.7-.8 1.2-2 1-3.2-1 .1-2.3.7-3 1.5-.7.7-1.2 1.9-1.1 3.1 1.2.1 2.4-.6 3.1-1.4Z" />
              </svg>
              Get Pro in the iPhone app
            </a>
          ) : (
            <span className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-[var(--wb-brand)] text-[17px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(31,66,50,0.8)]">
              Coming soon to iPhone
            </span>
          )}
          <p className="text-center text-[13px] leading-snug text-[var(--wb-secondary)]">
            {APP_STORE_LIVE
              ? "Subscribe in Wainwrights Baggers on your iPhone. Sign in there with this account and Pro unlocks here too."
              : "Pro is bought in the iPhone app, which is coming to the App Store soon. Subscribe there with this account and Pro unlocks here too."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
