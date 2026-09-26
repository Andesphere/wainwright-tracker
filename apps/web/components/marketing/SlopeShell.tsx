// SlopeShell — outer wrapper for every marketing page (/, /contact, /guides,
// /guides/:slug, not found). Applies the design-slope CSS scope and pins the
// shared footer at the bottom. Children supply the nav + main content.

import type { ReactNode } from "react";

import { SlopeFooter } from "./SlopeFooter";

export { SlopeMark } from "./SlopeMark";

type SlopeShellProps = {
  /** Page content — typically <SlopeNav /> followed by sections. */
  children: ReactNode;
};

export function SlopeShell({ children }: SlopeShellProps) {
  return (
    <div className="design-slope">
      <main className="slope-main">{children}</main>
      <SlopeFooter />
    </div>
  );
}
