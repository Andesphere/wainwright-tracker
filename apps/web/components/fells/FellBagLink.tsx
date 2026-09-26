"use client";

// "Bag it" on a fell page: a client island so the click is counted.

import { trackFellBagClick } from "@/lib/analytics";

export function FellBagLink({ id, label }: { id: string; label: string }) {
  return (
    <a
      href={`/app?fell=${id}`}
      className="btn-pill"
      onClick={() => trackFellBagClick(id)}
    >
      {label}
      <i className="btn-arr" />
    </a>
  );
}
