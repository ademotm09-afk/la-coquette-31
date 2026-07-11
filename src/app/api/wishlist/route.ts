import { db } from "@/db";
import { products, wishlists } from "@/db/schema";
import { and, eq } from "drizzle-orm";

function getSessionId(request: Request): string {
  return request.headers.get("x-wishlist-session") || "anonymous";
}

export async function GET(request: Request) {
  try {
    const sessionId = getSessionId(request);
    const url = new URL(request.url);
    const productIds = url.searchParams.get("ids");

    if (productIds) {
      const ids = productIds.split(",").map(Number).filter(Boolean);
      if (!ids.length) return Response.json([]);
      const rows = await db.select({ productId: wishlists.productId }).from(wishlists).where(
        and(eq(wishlists.sessionId, sessionId), eq(wishlists.productId, ids[0]))
      );
      return Response.json(rows.map((r) => r.productId));
    }

    const rows = await db
      .select({ productId: wishlists.productId })
      .from(wishlists)
      .where(eq(wishlists.sessionId, sessionId));
    return Response.json(rows.map((r) => r.productId));
  } catch {
    return Response.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionId = getSessionId(request);
    const { productId } = await request.json();
    if (!productId) return Response.json({ error: "productId requis" }, { status: 400 });

    const [existing] = await db.select().from(wishlists).where(
      and(eq(wishlists.sessionId, sessionId), eq(wishlists.productId, Number(productId)))
    ).limit(1);

    if (existing) return Response.json({ ok: true, action: "already_exists" });

    const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, Number(productId))).limit(1);
    if (!product) return Response.json({ error: "Produit introuvable" }, { status: 404 });

    await db.insert(wishlists).values({ sessionId, productId: Number(productId) });
    return Response.json({ ok: true, action: "added" }, { status: 201 });
  } catch {
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const sessionId = getSessionId(request);
    const { productId } = await request.json();
    if (!productId) return Response.json({ error: "productId requis" }, { status: 400 });

    await db.delete(wishlists).where(
      and(eq(wishlists.sessionId, sessionId), eq(wishlists.productId, Number(productId)))
    );
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
