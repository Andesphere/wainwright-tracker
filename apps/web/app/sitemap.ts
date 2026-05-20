import type { MetadataRoute } from "next";
import { getIndexableBlogUrls, SITE_URL } from "@/lib/seo";

const now = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...getIndexableBlogUrls().map((entry) => ({
      ...entry,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
