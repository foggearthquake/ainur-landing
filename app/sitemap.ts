import type { MetadataRoute } from "next";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: "https://gabdra.pw", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://gabdra.pw/blog", lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: "https://gabdra.pw/privacy", lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const db = drizzle(createClient({ url: process.env.DATABASE_URL! }));
    const published = await db.select({ slug: articles.slug, updatedAt: articles.updatedAt })
      .from(articles)
      .where(eq(articles.status, "published"));

    const articleUrls: MetadataRoute.Sitemap = published.map(a => ({
      url: `https://gabdra.pw/blog/${a.slug}`,
      lastModified: new Date(a.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    return [...base, ...articleUrls];
  } catch {
    return base;
  }
}
