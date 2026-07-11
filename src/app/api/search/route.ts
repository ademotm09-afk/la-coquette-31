import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq, or, ilike, and, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const limit = Math.min(Number(url.searchParams.get("limit")) || 8, 20);

    if (!q || q.length < 1) return Response.json({ products: [], categories: [] });

    const term = `%${q}%`;
    const [foundProducts, foundCategories] = await Promise.all([
      db.select({
        id: products.id,
        slug: products.slug,
        nameFr: products.nameFr,
        nameEn: products.nameEn,
        nameAr: products.nameAr,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        images: products.images,
        categorySlug: products.categorySlug,
        stock: products.stock,
        featured: products.featured,
        isNew: products.isNew,
        salesCount: products.salesCount,
        colors: products.colors,
        sizes: products.sizes,
        descriptionFr: products.descriptionFr,
        descriptionEn: products.descriptionEn,
        descriptionAr: products.descriptionAr,
        active: products.active,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
        .from(products)
        .where(
          and(
            eq(products.active, true),
            or(
              ilike(products.nameFr, term),
              ilike(products.nameEn, term),
              ilike(products.nameAr, term),
              ilike(products.categorySlug, term)
            )
          )
        )
        .orderBy(desc(products.featured), desc(products.salesCount))
        .limit(limit),
      db.select({
        id: categories.id,
        slug: categories.slug,
        nameFr: categories.nameFr,
        nameEn: categories.nameEn,
        nameAr: categories.nameAr,
      })
        .from(categories)
        .where(or(ilike(categories.nameFr, term), ilike(categories.nameEn, term), ilike(categories.nameAr, term)))
        .limit(5),
    ]);

    return Response.json({ products: foundProducts, categories: foundCategories });
  } catch {
    return Response.json({ products: [], categories: [] }, { status: 500 });
  }
}
