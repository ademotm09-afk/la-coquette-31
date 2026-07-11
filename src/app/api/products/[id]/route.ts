import { db } from "@/db";
import { products } from "@/db/schema";
import { isAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { productInput } from "@/lib/product-input";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return unauthorizedResponse();
  try {
    const { id } = await params;
    const input = productInput(await request.json());
    const [updated] = await db.update(products).set(input).where(eq(products.id, Number(id))).returning();
    return Response.json(updated || { error: "Produit introuvable" }, { status: updated ? 200 : 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Modification impossible" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return unauthorizedResponse();
  const { id } = await params;
  const [deleted] = await db.delete(products).where(eq(products.id, Number(id))).returning({ id: products.id });
  return Response.json(deleted || { error: "Produit introuvable" }, { status: deleted ? 200 : 404 });
}
