import { useState, type FormEvent } from "react";
import { useUser } from "@clerk/clerk-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Search01Icon,
  UserAdd01Icon,
  UserCheck01Icon,
  UserGroupIcon,
  UserSearch01Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type ProfileVisibility = "public" | "private";
export type CurrentProfile = {
  displayName: string;
  firstName?: string;
  imageUrl?: string;
  lastName?: string;
  needsOnboarding: boolean;
  nickname?: string;
  onboardingCompletedAt?: number;
  profileVisibility: ProfileVisibility;
  updatedAt: number;
  userId: string;
};
export type ProfileFormValues = {
  displayName: string;
  firstName: string;
  lastName: string;
  nickname: string;
  profileVisibility: ProfileVisibility;
};
export type BaggerSummary = {
  completedCount: number;
  displayName: string;
  firstName?: string;
  followersCount: number;
  followingCount: number;
  imageUrl?: string;
  isFollowing: boolean;
  isSelf: boolean;
  lastName?: string;
  nickname?: string;
  photoUrls: string[];
  profileVisibility?: ProfileVisibility;
  updatedAt?: number;
  userId: string;
};

export function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useUser();
  const [type, setType] = useState("comment");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "sent" | "error"
  >("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!user || !trimmed || status === "submitting") {
      return;
    }

    setStatus("submitting");
    const response = await fetch("/api/relay/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? user.username ?? undefined,
        type,
        message: trimmed,
        currentUrl: window.location.href,
        userAgent: window.navigator.userAgent,
      }),
    });

    if (response.ok) {
      setMessage("");
      setStatus("sent");
      return;
    }

    setStatus("error");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setStatus("idle");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            Share what broke, what is missing, or what would make the journal
            better.
          </DialogDescription>
        </DialogHeader>

        {status === "sent" ? (
          <>
            <div className="grid justify-items-center gap-3 py-3 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} />
              </span>
              <p className="text-sm text-muted-foreground">
                Thanks, your feedback was sent.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Select
              value={type}
              onValueChange={setType}
              disabled={status === "submitting"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Feedback type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comment">Comment</SelectItem>
                <SelectItem value="problem">Problem</SelectItem>
                <SelectItem value="feature_request">Feature request</SelectItem>
                <SelectItem value="question">Question</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              required
              minLength={2}
              maxLength={4000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write your feedback..."
              disabled={status === "submitting"}
            />
            {status === "error" ? (
              <p className="text-sm text-destructive">
                We could not send that. Try again in a moment.
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={status === "submitting"}>
                {status === "submitting" ? "Sending..." : "Send feedback"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function defaultProfileFormValues(
  profile?: CurrentProfile | null,
): ProfileFormValues {
  return {
    displayName: profile?.displayName ?? "",
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    nickname: profile?.nickname ?? "",
    profileVisibility: profile?.profileVisibility ?? "private",
  };
}

function ProfileForm({
  buttonLabel,
  intro,
  onSave,
  profile,
}: {
  buttonLabel: string;
  intro?: string;
  onSave: (values: ProfileFormValues) => Promise<void>;
  profile?: CurrentProfile | null;
}) {
  const [values, setValues] = useState(() => defaultProfileFormValues(profile));
  const [saving, setSaving] = useState(false);

  const update = (field: keyof ProfileFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({
        displayName: values.displayName.trim() || values.firstName.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        nickname: values.nickname.trim(),
        profileVisibility: values.profileVisibility,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={submit}>
      {intro && (
        <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-foreground">
          First name
          <Input
            required
            value={values.firstName}
            onChange={(event) => update("firstName", event.target.value)}
            placeholder="Wade"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-foreground">
          Last name
          <Input
            value={values.lastName}
            onChange={(event) => update("lastName", event.target.value)}
            placeholder="Optional"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-foreground">
          Nickname
          <Input
            value={values.nickname}
            onChange={(event) => update("nickname", event.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-foreground">
          Display name
          <Input
            required
            value={values.displayName}
            onChange={(event) => update("displayName", event.target.value)}
            placeholder="Shown to other baggers"
          />
        </label>
      </div>

      <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Profile visibility
        </p>
        <ToggleGroup
          type="single"
          value={values.profileVisibility}
          onValueChange={(value) => {
            if (value === "public" || value === "private") {
              update("profileVisibility", value);
            }
          }}
          className="grid grid-cols-2 rounded-xl bg-muted/60 p-1"
        >
          <ToggleGroupItem
            value="public"
            className="rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Public profile
          </ToggleGroupItem>
          <ToggleGroupItem
            value="private"
            className="rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Private profile
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {values.profileVisibility === "public"
            ? "Other baggers can find you by name or nickname, follow you, and see your Wainwright count and public summit photo previews."
            : "You can still track your own Wainwrights, but you will not appear in community search or public profiles."}
        </p>
      </div>

      <Button type="submit" className="rounded-full" disabled={saving}>
        {saving ? "saving…" : buttonLabel}
      </Button>
    </form>
  );
}

export function ProfileOnboardingGate({
  onComplete,
  profile,
}: {
  onComplete: (values: ProfileFormValues) => Promise<void>;
  profile: CurrentProfile | null | undefined;
}) {
  const shouldBlock =
    profile !== undefined && (!profile || profile.needsOnboarding);
  if (!shouldBlock) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-parchment/95 px-4 py-8 backdrop-blur-xl">
      <Card className="w-full max-w-lg rounded-3xl border-border/70 bg-card/95 p-5 shadow-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          community profile
        </p>
        <h1 className="mt-2 font-display text-4xl italic text-foreground">
          Set up your bagger profile
        </h1>
        {profile ? (
          <ProfileForm
            key={`${profile.userId}-${profile.updatedAt}`}
            profile={profile}
            buttonLabel="Save and continue"
            onSave={onComplete}
            intro="Help friends find the right Wade, Sarah, or Tom — and choose whether your profile appears in the community search."
          />
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Preparing your profile defaults…
          </p>
        )}
      </Card>
    </div>
  );
}

export function ProfileSettingsCard({
  onSave,
  profile,
}: {
  onSave: (values: ProfileFormValues) => Promise<void>;
  profile: CurrentProfile;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Profile & Privacy
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit how other baggers find you, or make your profile private.
        </p>
      </div>
      <ProfileForm
        key={`${profile.userId}-${profile.updatedAt}`}
        profile={profile}
        buttonLabel="Save profile"
        onSave={onSave}
      />
    </div>
  );
}

export function PeopleDiscoverySheet({
  onOpenChange,
  onQuery,
  onSelectProfile,
  onToggleFollow,
  open,
  query,
  results,
  selectedProfile,
  selectedUserId,
}: {
  onOpenChange: (open: boolean) => void;
  onQuery: (query: string) => void;
  onSelectProfile: (userId: string) => void;
  onToggleFollow: (bagger: BaggerSummary) => void;
  open: boolean;
  query: string;
  results: BaggerSummary[];
  selectedProfile: BaggerSummary | null | undefined;
  selectedUserId: string | null;
}) {
  const fallbackProfile =
    selectedProfile === undefined
      ? results.find((bagger) => bagger.userId === selectedUserId)
      : undefined;
  const activeProfile = selectedProfile ?? fallbackProfile;
  const selectedProfileUnavailable =
    selectedUserId !== null && selectedProfile === null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-h-[780px] overflow-hidden rounded-t-3xl border-border/70 bg-sidebar/95 p-0 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl"
      >
        <SheetTitle className="sr-only">Find other baggers</SheetTitle>
        <SheetDescription className="sr-only">
          Search app users by name or nickname, follow them, and view their
          public Wainwright progress and photos.
        </SheetDescription>
        <div className="grid h-full grid-rows-[auto_1fr] overflow-hidden">
          <div className="space-y-4 border-b border-border/70 bg-card/60 px-4 pb-4 pt-5 shadow-sm sm:px-6">
            <div className="flex items-start gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                <HugeiconsIcon icon={UserSearch01Icon} strokeWidth={1.7} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  community
                </p>
                <h2 className="mt-1 font-display text-3xl italic leading-none text-foreground">
                  Find other baggers
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Follow walkers to compare Wainwright progress, see recent
                  summit photos, and keep their profiles one tap away.
                </p>
              </div>
            </div>

            <div className="grid gap-2 rounded-2xl border border-border bg-background/80 p-2">
              <label className="sr-only" htmlFor="bagger-search">
                Search by name or nickname
              </label>
              <div className="flex items-center gap-2 px-2">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="size-4 text-muted-foreground"
                  strokeWidth={1.7}
                />
                <Input
                  id="bagger-search"
                  value={query}
                  onChange={(event) => onQuery(event.target.value)}
                  className="h-10 border-0 bg-transparent p-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                  placeholder="Search by name or nickname"
                />
              </div>
              <div className="rounded-xl bg-primary/8 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                Contact import can layer on later with explicit permission; this
                starts safely with in-app users only.
              </div>
            </div>
          </div>

          <div className="journal-scroll grid min-h-0 gap-4 overflow-y-auto px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)] sm:px-6">
            <div className="grid content-start gap-2.5">
              {results.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-background/70 p-6 text-center">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    className="mx-auto size-10 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                  <p className="mt-3 font-semibold text-foreground">
                    No baggers found yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a name or nickname once more friends have signed in.
                  </p>
                </div>
              ) : (
                results.map((bagger) => (
                  <button
                    key={bagger.userId}
                    type="button"
                    onClick={() => onSelectProfile(bagger.userId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-3xl border bg-background/75 p-3 text-left shadow-xs transition hover:bg-accent/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selectedUserId === bagger.userId
                        ? "border-primary/70 ring-2 ring-primary/20"
                        : "border-border/70",
                    )}
                  >
                    <BaggerAvatar bagger={bagger} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground">
                        {bagger.displayName}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {bagger.completedCount} Wainwrights bagged ·{" "}
                        {bagger.followersCount} followers
                      </span>
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        bagger.isFollowing
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {bagger.isFollowing ? "Following" : "View"}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="min-h-[22rem] rounded-3xl border border-border/70 bg-card/85 p-4 shadow-sm">
              {activeProfile ? (
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <BaggerAvatar bagger={activeProfile} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-3xl italic leading-none text-foreground">
                        {activeProfile.displayName}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <StatPill
                      label="Wainwrights bagged"
                      value={activeProfile.completedCount}
                    />
                    <StatPill
                      label="followers"
                      value={activeProfile.followersCount}
                    />
                    <StatPill
                      label="following"
                      value={activeProfile.followingCount}
                    />
                  </div>

                  {!activeProfile.isSelf && (
                    <Button
                      type="button"
                      className="rounded-full"
                      variant={
                        activeProfile.isFollowing ? "secondary" : "default"
                      }
                      onClick={() => onToggleFollow(activeProfile)}
                    >
                      <HugeiconsIcon
                        icon={
                          activeProfile.isFollowing
                            ? UserCheck01Icon
                            : UserAdd01Icon
                        }
                        strokeWidth={1.7}
                      />
                      {activeProfile.isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        summit photos
                      </p>
                      <Badge variant="secondary" className="rounded-full">
                        {activeProfile.photoUrls.length} previews
                      </Badge>
                    </div>
                    {activeProfile.photoUrls.length > 0 ? (
                      <div className="photo-preview-grid grid grid-cols-3 gap-2">
                        {activeProfile.photoUrls.map((url, index) => (
                          <img
                            key={`${url}-${index}`}
                            src={url}
                            alt={`${activeProfile.displayName} Wainwright photo ${index + 1}`}
                            className="aspect-square rounded-2xl object-cover"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="photo-preview-grid grid min-h-28 place-items-center rounded-2xl border border-dashed border-border bg-background/65 p-4 text-center text-sm text-muted-foreground">
                        No public summit photos yet.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                  <div>
                    <HugeiconsIcon
                      icon={UserSearch01Icon}
                      className="mx-auto size-10"
                      strokeWidth={1.5}
                    />
                    <p className="mt-3">
                      {selectedProfileUnavailable
                        ? "This profile is private or no longer available."
                        : "Select a bagger to view their profile."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BaggerAvatar({
  bagger,
  size = "md",
}: {
  bagger: BaggerSummary;
  size?: "md" | "lg";
}) {
  const className = cn(
    "grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/15 font-semibold text-primary",
    size === "lg" ? "size-16 text-xl" : "size-12 text-base",
  );

  if (bagger.imageUrl) {
    return (
      <img
        src={bagger.imageUrl}
        alt={`${bagger.displayName} profile photo`}
        className={cn(className, "object-cover")}
      />
    );
  }

  return (
    <span className={className}>
      {bagger.displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-2">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
