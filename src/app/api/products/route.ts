import { db } from "@/db";
import { products } from "@/db/schema";
import { isAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { productInput } from "@/lib/product-input";

export async function POST(request: Request) {
  if (!(await isAdmin())) return unauthorizedResponse();
  try {
    const input = productInput(await request.json());
    const [created] = await db.insert(products).values(input).returning();
    return Response.json(created, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Création impossible" }, { status: 400 });
  }
}
