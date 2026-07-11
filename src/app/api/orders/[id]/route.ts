import { db } from "@/db";
import { orders } from "@/db/schema";
import { isAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { eq } from "drizzle-orm";

const statuses = ["new", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return unauthorizedResponse();
  const { id } = await params;
  const body = await request.json();
  if (!statuses.includes(body.status)) return Response.json({ error: "Statut invalide" }, { status: 400 });
  const [updated] = await db.update(orders).set({ status: body.status, updatedAt: new Date() }).where(eq(orders.id, Number(id))).returning();
  return Response.json(updated || { error: "Commande introuvable" }, { status: updated ? 200 : 404 });
}
