import { useState, type ReactNode } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TOTAL_WAINWRIGHTS } from "./fells";
import {
  BookIcon,
  ChartIcon,
  ChevronRightIcon,
  PersonIcon,
  SealCheckIcon,
} from "./icons";
import { ProBadge } from "./Pro";

export type ProSummary = {
  expiresAt?: number;
  periodType?: string;
  pro: boolean;
  productId?: string;
  willRenew?: boolean;
};

const longDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "Pro · Yearly" and "Renews 12 October 2027", from the entitlement Convex keeps. */
export function proLines(summary: ProSummary) {
  const plan = summary.productId?.includes("yearly")
    ? "Yearly"
    : summary.productId?.includes("monthly")
      ? "Monthly"
      : null;
  const title = plan ? `Pro · ${plan}` : "Pro";
  if (!summary.expiresAt) return { title, detail: null };
  const date = longDate.format(new Date(summary.expiresAt));
  const detail =
    summary.periodType === "trial"
      ? `Free trial until ${date}`
      : summary.willRenew
        ? `Renews ${date}`
        : `Ends ${date}`;
  return { title, detail };
}

/** Who is signed in, Pro, community, tools, sign out and delete account. */
export function AccountView({
  baggedCount,
  community,
  onDeleteData,
  onFeedback,
  onJournal,
  onPeople,
  onStats,
  onUpsell,
  pro,
  tools,
}: {
  baggedCount: number;
  community: ReactNode;
  onDeleteData: () => Promise<void>;
  onFeedback: () => void;
  onJournal: () => void;
  onPeople: () => void;
  onStats: () => void;
  onUpsell: () => void;
  pro: ProSummary;
  tools: ReactNode;
}) {
  const { user } = useUser();
  const clerk = useClerk();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Signed in";
  const lines = proLines(pro);

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    setFailed(false);
    try {
      // App data first: once the Clerk user is gone we can no longer authenticate to remove it.
      await onDeleteData();
      await user.delete();
      window.location.assign("/");
    } catch {
      setDeleting(false);
      setFailed(true);
    }
  };

  return (
    <div className="grid gap-6 px-4 pb-10 pt-3">
      <Group>
        <div className="flex items-center gap-3.5 p-4">
          <span className="grid size-[52px] shrink-0 place-items-center overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--wb-brand)_22%,transparent)] text-[var(--wb-brand)]">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <PersonIcon size={26} />
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-[17px] font-semibold">{name}</span>
            <span className="block truncate text-[15px] text-[var(--wb-secondary)]">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
          </span>
        </div>
        <Row
          label="Fells bagged"
          value={`${baggedCount} of ${TOTAL_WAINWRIGHTS}`}
        />
      </Group>

      <Group title="Wainwrights Baggers Pro">
        {pro.pro ? (
          <>
            <div className="flex items-center gap-3 p-4">
              <span className="text-[var(--wb-bracken)]">
                <SealCheckIcon size={28} />
              </span>
              <span>
                <span className="block text-[17px] font-semibold">
                  {lines.title}
                </span>
                {lines.detail ? (
                  <span className="block text-[15px] text-[var(--wb-secondary)]">
                    {lines.detail}
                  </span>
                ) : null}
              </span>
            </div>
            <LinkRow
              icon={<BookIcon size={18} />}
              label="Journal"
              onClick={onJournal}
            />
            <LinkRow
              icon={<ChartIcon size={18} />}
              label="Stats"
              onClick={onStats}
            />
          </>
        ) : (
          <button
            type="button"
            onClick={onUpsell}
            className="flex w-full items-center gap-3 p-4 text-left hover:bg-[var(--wb-fill)]"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-semibold">
                Upgrade to Pro
              </span>
              <span className="block text-[15px] text-[var(--wb-secondary)]">
                Photo journal, albums, map layers and stats
              </span>
            </span>
            <ProBadge />
          </button>
        )}
      </Group>
      <p className="-mt-4 px-4 text-[13px] text-[var(--wb-secondary)]">
        {pro.pro
          ? "Manage or cancel your subscription in the App Store on your iPhone."
          : "Pro is bought in the iPhone app and unlocks here on the same account."}
      </p>

      <Group title="Community">
        <LinkRow label="Find other baggers" onClick={onPeople} />
        <div className="p-4">{community}</div>
      </Group>

      <Group title="Tools">
        <div className="p-4">{tools}</div>
      </Group>

      <Group>
        <LinkRow label="Send feedback" onClick={onFeedback} />
        <button
          type="button"
          onClick={() => void clerk.signOut({ redirectUrl: "/" })}
          className="w-full p-4 text-left text-[17px] text-[var(--wb-brand)] hover:bg-[var(--wb-fill)]"
        >
          Sign out
        </button>
      </Group>

      <div>
        <Group>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="w-full p-4 text-left text-[17px] text-[#D93A2B] hover:bg-[var(--wb-fill)]"
          >
            Delete account
          </button>
        </Group>
        <p className="mt-2 px-4 text-[13px] text-[var(--wb-secondary)]">
          Removes your fells, notes, photos and profile everywhere, then your
          sign-in.
          {pro.pro
            ? " It does not cancel your App Store subscription: cancel it on your iPhone first."
            : ""}
        </p>
      </div>

      <Dialog
        open={confirmingDelete}
        onOpenChange={(open) => !deleting && setConfirmingDelete(open)}
      >
        <DialogContent className="wb-surface">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently removes your bagged fells, dates, notes, photos,
              profile and follows, and your sign-in account. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {failed ? (
            <p className="text-sm text-destructive" role="alert">
              Could not delete your account. Please try again.
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={deleting}
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void deleteAccount()}
            >
              {deleting ? "Deleting…" : "Delete account and data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Group({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <section>
      {title ? (
        <h3 className="px-4 pb-1.5 text-[13px] font-semibold uppercase tracking-[0.02em] text-[var(--wb-secondary)]">
          {title}
        </h3>
      ) : null}
      <div className="divide-y divide-[var(--wb-separator)] overflow-hidden rounded-[20px] bg-[var(--wb-card)]">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-4 text-[17px]">
      <span>{label}</span>
      <span className="text-[var(--wb-secondary)]">{value}</span>
    </div>
  );
}

function LinkRow({
  icon,
  label,
  onClick,
}: {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 p-4 text-left text-[17px] hover:bg-[var(--wb-fill)]"
    >
      {icon ? <span className="text-[var(--wb-brand)]">{icon}</span> : null}
      <span className="flex-1">{label}</span>
      <span className="text-[var(--wb-tertiary)]">
        <ChevronRightIcon size={14} />
      </span>
    </button>
  );
}
