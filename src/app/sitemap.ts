import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lacoquette.dz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productUrls: MetadataRoute.Sitemap = [];

  try {
    const { db } = await import("@/db");
    const { products } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const allProducts = await db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.active, true));

    productUrls = allProducts.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    // Database not available during build — return only static pages
    console.warn("Sitemap: database unavailable, returning static pages only.");
  }

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
