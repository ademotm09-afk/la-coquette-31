import type { MetadataRoute } from "next";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lacoquette.dz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allProducts = await db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.active, true));

  const productUrls: MetadataRoute.Sitemap = allProducts.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...productUrls,
  ];
}
