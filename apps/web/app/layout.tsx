import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  category: "travel",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1f2d23",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body
        className={`${bricolage.variable} ${plusJakarta.variable}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
