// SlopeMark — the app icon (the trig pillar) used as the logo in the nav and
// footer. It is the small-size cut from /favicon.svg, which stays legible at
// nav size. Kept in its own file so SlopeNav / SlopeFooter can pull it in
// without creating an import cycle with SlopeShell.

export function SlopeMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimisation needed
    <img
      src="/favicon.svg"
      alt=""
      className="slope-mark"
      width={32}
      height={32}
    />
  );
}
