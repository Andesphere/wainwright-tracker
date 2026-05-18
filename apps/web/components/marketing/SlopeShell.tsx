// SlopeShell — outer wrapper for every marketing page (/, /blog, /blog/:slug)
// Applies the design-slope CSS scope, loads the type stack, and pins the
// shared footer at the bottom. Children supply the nav + main content.

import type { ReactNode } from "react";

import { SlopeFooter } from "./SlopeFooter";

export { SlopeMark } from "./SlopeMark";

type SlopeShellProps = {
  /** Page content — typically <SlopeNav /> followed by sections. */
  children: ReactNode;
  /** When true, footer links assume the visitor is signed in. */
  signedIn?: boolean;
};

export function SlopeShell({ children, signedIn = false }: SlopeShellProps) {
  return (
    <div className="design-slope">
      {/* Google Fonts — loaded once per page. Vite handles dedupe. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
      />
      <main className="slope-main">{children}</main>
      <SlopeFooter signedIn={signedIn} />
    </div>
  );
}
