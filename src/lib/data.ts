import { isDbConfigured } from "@/db";
import { categories, orderItems, orders, products, shippingRates } from "@/db/schema";
import { categorySeeds, productSeeds, wilayaSeeds } from "@/lib/catalog";
import { asc, count, desc, eq } from "drizzle-orm";

let bootstrapPromise: Promise<void> | null = null;

export async function bootstrapStore() {
  if (!isDbConfigured) return;
  // Lazy import to avoid crashing when DB is not configured
  const { db } = await import("@/db");
  if (!db) return;
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        const [categoryCount, productCount, rateCount] = await Promise.all([
          db.select({ value: count() }).from(categories),
          db.select({ value: count() }).from(products),
          db.select({ value: count() }).from(shippingRates),
        ]);

        if (categoryCount[0].value === 0) {
          await db.insert(categories).values(categorySeeds).onConflictDoNothing();
        }
        if (productCount[0].value === 0) {
          await db.insert(products).values(productSeeds).onConflictDoNothing();
        }
        if (rateCount[0].value === 0) {
          await db.insert(shippingRates).values(wilayaSeeds).onConflictDoNothing();
        }
      } catch (error) {
        // Tables may not exist yet — skip bootstrap silently
        console.warn("Bootstrap skipped (tables may not exist):", error);
        bootstrapPromise = null;
      }
    })();
  }
  return bootstrapPromise;
}

export async function getStoreData() {
  if (!isDbConfigured) {
    return { products: [], categories: [], rates: [] };
  }
  try {
    const { db } = await import("@/db");
    if (!db) return { products: [], categories: [], rates: [] };
    await bootstrapStore();
    const [storeProducts, storeCategories, rates] = await Promise.all([
      db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.featured), desc(products.createdAt)),
      db.select().from(categories).orderBy(asc(categories.id)),
      db.select().from(shippingRates).where(eq(shippingRates.active, true)).orderBy(asc(shippingRates.code)),
    ]);
    return { products: storeProducts, categories: storeCategories, rates };
  } catch (error) {
    console.warn("getStoreData fallback:", error);
    return { products: [], categories: [], rates: [] };
  }
}

export async function getProductBySlug(slug: string) {
  if (!isDbConfigured) return null;
  try {
    const { db } = await import("@/db");
    if (!db) return null;
    await bootstrapStore();
    const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    if (!product || !product.active) return null;
    const related = await db
      .select()
      .from(products)
      .where(eq(products.categorySlug, product.categorySlug))
      .orderBy(desc(products.featured))
      .limit(5);
    return { product, related: related.filter((item) => item.id !== product.id).slice(0, 4) };
  } catch (error) {
    console.warn("getProductBySlug fallback:", error);
    return null;
  }
}

export async function getAdminData() {
  if (!isDbConfigured) {
    return { products: [], orders: [], rates: [] };
  }
  try {
    const { db } = await import("@/db");
    if (!db) return { products: [], orders: [], rates: [] };
    await bootstrapStore();
    const [allProducts, allOrders, allItems, rates] = await Promise.all([
      db.select().from(products).orderBy(desc(products.createdAt)),
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select().from(orderItems).orderBy(asc(orderItems.id)),
      db.select().from(shippingRates).orderBy(asc(shippingRates.code)),
    ]);

    const ordersWithItems = allOrders.map((order) => ({
      ...order,
      items: allItems.filter((item) => item.orderId === order.id),
    }));

    return { products: allProducts, orders: ordersWithItems, rates };
  } catch (error) {
    console.warn("getAdminData fallback:", error);
    return { products: [], orders: [], rates: [] };
  }
}
