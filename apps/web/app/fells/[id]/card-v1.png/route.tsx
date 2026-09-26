// The share card for a fell page: name, height and book on the site's cream
// paper, 1200x630, generated once per fell at build time. The version is in
// the path (lib/seo.tsx fellCard); change both when the design changes.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { WAINWRIGHTS } from "@wainwrights/catalog/wainwrights";
import { ImageResponse } from "next/og";

import {
  bookOf,
  formatFeet,
  formatHeight,
  heightRank,
  ordinal,
  requireFell,
} from "@/lib/fells";

export const dynamicParams = false;

export function generateStaticParams() {
  return WAINWRIGHTS.map((fell) => ({ id: fell.id }));
}

const font = (file: string) =>
  readFile(path.join(process.cwd(), "assets", "fonts", file));

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const fell = requireFell(id);
  const book = bookOf(fell);
  const [serif, sans] = await Promise.all([
    font("newsreader-latin-500-normal.woff"),
    font("plus-jakarta-sans-latin-600-normal.woff"),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#f3f1e4",
        color: "#112318",
        fontFamily: "Plus Jakarta Sans",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 26,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "#3e6e54",
        }}
      >
        Book {book.number} · {book.title}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontFamily: "Newsreader",
            fontSize:
              fell.name.length > 30 ? 80 : fell.name.length > 22 ? 96 : 124,
            lineHeight: 1,
            color: "#1f4232",
          }}
        >
          {fell.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 38,
            color: "#3e6e54",
          }}
        >
          {formatHeight(fell)} · {formatFeet(fell)} ·{" "}
          {ordinal(heightRank(fell))} of 214
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 28,
          borderTop: "2px solid rgba(62, 110, 84, 0.25)",
          fontSize: 28,
          color: "#1f4232",
        }}
      >
        <span style={{ fontFamily: "Newsreader", fontSize: 34 }}>
          Wainwrights Baggers
        </span>
        <span style={{ color: "#6b8478" }}>wainwrightsbaggers.com</span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Newsreader", data: serif, weight: 500, style: "normal" },
        { name: "Plus Jakarta Sans", data: sans, weight: 600, style: "normal" },
      ],
    },
  );
}
