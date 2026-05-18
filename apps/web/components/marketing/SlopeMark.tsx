// SlopeMark — the small mountain glyph used in the nav and footer.
// Kept in its own file so SlopeNav / SlopeFooter can pull it in without
// creating an import cycle with SlopeShell.

export function SlopeMark() {
  return (
    <svg viewBox="0 0 28 28" className="slope-mark" aria-hidden>
      <path d="M2 22 L9 12 L13 17 L18 8 L26 22 Z" fill="currentColor" />
      <circle cx="22" cy="7" r="2.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
