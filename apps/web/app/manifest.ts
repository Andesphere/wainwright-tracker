import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wainwrights Baggers",
    short_name: "Wainwrights",
    description:
      "Track completed Wainwright fells on a rich Lake District map.",
    theme_color: "#1f2d23",
    background_color: "#fbf7ec",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    start_url: "/app",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
